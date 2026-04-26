"""Rule-based teacher policy for heads-up Limit Hold'em.

This module is intentionally separated from app code so you can:
1) Generate synthetic training labels quickly
2) Iterate on strategy rules without touching frontend/backend API paths
"""

from __future__ import annotations

from dataclasses import dataclass
import random
from typing import Dict, List


ACTIONS = ["fold", "call", "bet_1", "bet_2", "bet_3", "bet_4", "bet_5"]

RANK_TO_VALUE = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "T": 10,
    "J": 11,
    "Q": 12,
    "K": 13,
    "A": 14,
}


@dataclass
class HandContext:
    hole_cards: List[str]
    board_cards: List[str]
    street: str
    pot_size: float
    to_call: float
    style: str  # "aggressive", "moderate", "tight"
    position: str  # "BTN/SB" or "BB"


def _rank(card: str) -> str:
    return card[0]


def _suit(card: str) -> str:
    return card[1]


def _preflop_strength_bucket(hole_cards: List[str]) -> str:
    """Very rough bucket model for fast synthetic labeling."""
    r1, r2 = _rank(hole_cards[0]), _rank(hole_cards[1])
    v1, v2 = RANK_TO_VALUE[r1], RANK_TO_VALUE[r2]
    suited = _suit(hole_cards[0]) == _suit(hole_cards[1])
    pair = r1 == r2
    high = max(v1, v2)
    low = min(v1, v2)
    gap = high - low

    if pair and high >= 11:
        return "premium"
    if {r1, r2} in [{"A", "K"}, {"A", "Q"}, {"K", "Q"}] and suited:
        return "premium"
    if pair and high >= 8:
        return "strong"
    if high >= 13 and low >= 10:
        return "strong"
    if suited and gap <= 2 and high >= 10:
        return "playable"
    if pair and high >= 5:
        return "playable"
    return "weak"


def _postflop_strength_bucket(hole_cards: List[str], board_cards: List[str]) -> str:
    """Evaluate actual best 5-card hand rank for accurate strength bucketing."""
    from itertools import combinations as _combos

    _RANKS = "23456789TJQKA"

    def _r(c: str) -> int:
        return _RANKS.index(c[0])

    def _eval5(cards) -> int:
        rs = sorted([_r(c) for c in cards], reverse=True)
        ss = [c[1] for c in cards]
        ct: Dict[int, int] = {}
        for r in rs:
            ct[r] = ct.get(r, 0) + 1
        gs = sorted(ct.items(), key=lambda x: (x[1], x[0]), reverse=True)
        fl = len(set(ss)) == 1
        st = rs[0] - rs[4] == 4 and len(set(rs)) == 5
        if not st and rs == [12, 3, 2, 1, 0]:
            st = True
        if fl and st: return 8
        if gs[0][1] == 4: return 7
        if gs[0][1] == 3 and gs[1][1] == 2: return 6
        if fl: return 5
        if st: return 4
        if gs[0][1] == 3: return 3
        if gs[0][1] == 2 and gs[1][1] == 2: return 2
        if gs[0][1] == 2: return 1
        return 0

    all_cards = hole_cards + board_cards
    best_rank = max(_eval5(list(c)) for c in _combos(all_cards, 5))

    if best_rank >= 3:
        return "very_strong"  # trips, straight, flush, full house, quads, str flush
    if best_rank == 2:
        return "strong"       # two pair
    if best_rank == 1:
        return "medium"       # one pair

    board_high = max(RANK_TO_VALUE[_rank(c)] for c in board_cards)
    hole_high = max(RANK_TO_VALUE[_rank(c)] for c in hole_cards)
    return "draw_or_overcards" if hole_high > board_high else "weak"


def _base_probs_for_bucket(bucket: str) -> Dict[str, float]:
    if bucket == "premium":
        return {"fold": 0.01, "call": 0.14, "bet_2": 0.20, "bet_3": 0.25, "bet_4": 0.24, "bet_5": 0.16}
    if bucket == "strong":
        return {"fold": 0.05, "call": 0.35, "bet_1": 0.12, "bet_2": 0.22, "bet_3": 0.16, "bet_4": 0.10}
    if bucket == "playable":
        return {"fold": 0.20, "call": 0.45, "bet_1": 0.18, "bet_2": 0.11, "bet_3": 0.06}
    if bucket == "very_strong":
        return {"fold": 0.00, "call": 0.20, "bet_2": 0.20, "bet_3": 0.26, "bet_4": 0.20, "bet_5": 0.14}
    if bucket == "medium":
        return {"fold": 0.15, "call": 0.50, "bet_1": 0.16, "bet_2": 0.12, "bet_3": 0.07}
    if bucket == "draw_or_overcards":
        return {"fold": 0.20, "call": 0.48, "bet_1": 0.17, "bet_2": 0.10, "bet_3": 0.05}
    return {"fold": 0.45, "call": 0.43, "bet_1": 0.08, "bet_2": 0.04}


def _apply_style_adjustment(probs: Dict[str, float], style: str) -> Dict[str, float]:
    """Shift baseline action frequencies toward chosen style."""
    adjusted = dict(probs)

    if style == "aggressive":
        adjusted["fold"] = adjusted.get("fold", 0.0) * 0.65
        adjusted["call"] = adjusted.get("call", 0.0) * 0.85
        for bet_action in ("bet_2", "bet_3", "bet_4", "bet_5"):
            adjusted[bet_action] = adjusted.get(bet_action, 0.0) * 1.25
        adjusted["bet_1"] = adjusted.get("bet_1", 0.0) * 1.10
    elif style == "tight":
        adjusted["fold"] = adjusted.get("fold", 0.0) * 1.35
        adjusted["call"] = adjusted.get("call", 0.0) * 1.10
        for bet_action in ("bet_3", "bet_4", "bet_5"):
            adjusted[bet_action] = adjusted.get(bet_action, 0.0) * 0.70
        adjusted["bet_1"] = adjusted.get("bet_1", 0.0) * 0.95
        adjusted["bet_2"] = adjusted.get("bet_2", 0.0) * 0.85
    else:  # moderate
        adjusted["fold"] = adjusted.get("fold", 0.0) * 1.00
        adjusted["call"] = adjusted.get("call", 0.0) * 1.00

    return adjusted


def _apply_price_adjustment(probs: Dict[str, float], to_call: float, pot_size: float) -> Dict[str, float]:
    adjusted = dict(probs)
    if pot_size <= 0:
        return adjusted
    price = to_call / pot_size
    if price > 0.5:
        adjusted["fold"] = adjusted.get("fold", 0.0) * 1.25
        adjusted["call"] = adjusted.get("call", 0.0) * 0.85
    elif price < 0.2:
        adjusted["call"] = adjusted.get("call", 0.0) * 1.10
        adjusted["fold"] = adjusted.get("fold", 0.0) * 0.90
    return adjusted


def _normalize(probs: Dict[str, float]) -> Dict[str, float]:
    filtered = {k: max(0.0, v) for k, v in probs.items() if k in ACTIONS}
    total = sum(filtered.values())
    if total <= 0:
        return {"call": 1.0}
    return {k: v / total for k, v in filtered.items()}


def sample_action(probabilities: Dict[str, float]) -> str:
    actions = list(probabilities.keys())
    weights = [probabilities[a] for a in actions]
    return random.choices(actions, weights=weights, k=1)[0]


def teacher_policy(context: HandContext) -> Dict[str, object]:
    """Return an action + probability distribution for the given state."""
    if context.street == "preflop":
        bucket = _preflop_strength_bucket(context.hole_cards)
    else:
        bucket = _postflop_strength_bucket(context.hole_cards, context.board_cards)

    probs = _base_probs_for_bucket(bucket)
    probs = _apply_style_adjustment(probs, context.style)
    probs = _apply_price_adjustment(probs, context.to_call, context.pot_size)
    probs = _normalize(probs)
    bet_total = sum(v for k, v in probs.items() if k.startswith("bet_"))
    call_prob = probs.get("call", 0.0)
    fold_prob = probs.get("fold", 0.0)

    if bet_total >= call_prob and bet_total >= fold_prob:
        action = max((k for k in probs if k.startswith("bet_")), key=probs.get)
    elif call_prob >= fold_prob:
        action = "call"
    else:
        action = "fold"

    return {
        "action": action,
        "probs": probs,
        "bucket": bucket,
    }

