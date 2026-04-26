"""
Feature extraction for the poker coach model.

Converts raw hand state (cards, street, pot, to_call) into a fixed-length
numerical feature vector that the MLP can learn from.
"""

from itertools import combinations

RANK_ORDER = "23456789TJQKA"
SUITS = "cdhs"


def build_deck():
    return [r + s for r in RANK_ORDER for s in SUITS]


def card_rank(card: str) -> int:
    return RANK_ORDER.index(card[0])


def card_suit(card: str) -> str:
    return card[1]


def _evaluate5(cards) -> int:
    """Return hand rank 0-8 for exactly 5 cards."""
    ranks = sorted([card_rank(c) for c in cards], reverse=True)
    suits = [card_suit(c) for c in cards]

    counts: dict = {}
    for r in ranks:
        counts[r] = counts.get(r, 0) + 1
    groups = sorted(counts.items(), key=lambda x: (x[1], x[0]), reverse=True)

    is_flush = len(set(suits)) == 1
    is_straight = ranks[0] - ranks[4] == 4 and len(set(ranks)) == 5
    straight_high = ranks[0]

    # Wheel: A-2-3-4-5
    if not is_straight and ranks == [12, 3, 2, 1, 0]:
        is_straight = True
        straight_high = 3

    if is_flush and is_straight:
        return 8
    if groups[0][1] == 4:
        return 7
    if groups[0][1] == 3 and groups[1][1] == 2:
        return 6
    if is_flush:
        return 5
    if is_straight:
        return 4
    if groups[0][1] == 3:
        return 3
    if groups[0][1] == 2 and groups[1][1] == 2:
        return 2
    if groups[0][1] == 2:
        return 1
    return 0


def best_hand_rank(hole_cards, board_cards) -> int:
    """Best 5-card hand rank from hole cards + board."""
    all_cards = hole_cards + board_cards
    if len(all_cards) < 5:
        return 0
    return max(_evaluate5(list(combo)) for combo in combinations(all_cards, 5))


def extract_features(hole_cards, board_cards, street: str, pot: float, to_call: float) -> list:
    """
    Returns a 14-element feature vector:
      [0]  street (normalized 0–1)
      [1]  high hole card rank (normalized)
      [2]  low hole card rank (normalized)
      [3]  rank gap (normalized)
      [4]  is_pair
      [5]  is_suited
      [6]  pot odds  (to_call / total)
      [7]  to_call (normalized, capped)
      [8]  pot size (normalized, capped)
      [9]  best hand rank (normalized, 0 preflop)
      [10] flush potential (max suit count / total cards, 0 preflop)
      [11] board is paired (0 preflop)
      [12] top board card rank (normalized, 0 preflop)
      [13] hero overcards to board (normalized, 0 preflop)
    """
    r1, r2 = card_rank(hole_cards[0]), card_rank(hole_cards[1])
    s1, s2 = card_suit(hole_cards[0]), card_suit(hole_cards[1])
    hi, lo = max(r1, r2), min(r1, r2)

    street_idx = ["preflop", "flop", "turn", "river"].index(street)
    total = pot + to_call
    pot_odds = to_call / total if total > 0 else 0.0

    feats = [
        street_idx / 3.0,
        hi / 12.0,
        lo / 12.0,
        (hi - lo) / 12.0,
        float(r1 == r2),
        float(s1 == s2),
        pot_odds,
        min(to_call, 10.0) / 10.0,
        min(pot, 50.0) / 50.0,
    ]

    if board_cards:
        hand_rank_val = best_hand_rank(hole_cards, board_cards)
        board_ranks = [card_rank(c) for c in board_cards]
        all_cards = hole_cards + board_cards
        all_suits = [card_suit(c) for c in all_cards]
        best_suit_count = max(all_suits.count(s) for s in SUITS)

        board_rank_counts: dict = {}
        for r in board_ranks:
            board_rank_counts[r] = board_rank_counts.get(r, 0) + 1
        board_paired = float(max(board_rank_counts.values()) >= 2)

        board_max = max(board_ranks)
        overcards = sum(1 for r in [r1, r2] if r > board_max)

        feats.extend([
            hand_rank_val / 8.0,
            best_suit_count / len(all_cards),
            board_paired,
            board_max / 12.0,
            overcards / 2.0,
        ])
    else:
        feats.extend([0.0, 0.0, 0.0, 0.0, 0.0])

    return feats
