"""
Flask backend for the poker coach.

Endpoints:
    POST /api/evaluate        — evaluate a user action and return coach feedback
    GET  /api/leaks           — analyze stored decisions and return tendency report
    GET  /api/decisions/count — total decisions tracked
    DELETE /api/decisions     — clear decision history
"""

import os
import sys
import threading

from flask import Flask, jsonify, request
from flask_cors import CORS

sys.path.insert(0, os.path.dirname(__file__))

from ai.features import best_hand_rank
from ai.teacher_policy import HandContext, teacher_policy
from supabase_client import clear_decisions, get_recent_decisions, save_decision

app = Flask(__name__)
CORS(app)

PREFLOP_BUCKET_LABELS = {
    "premium": "Premium hand",
    "strong": "Strong hand",
    "playable": "Playable hand",
    "weak": "Weak hand",
}

PREFLOP_REASONING = {
    "premium": "Premium holding — raise to build the pot and charge draws.",
    "strong": "Strong hand — raise or call depending on position.",
    "playable": "Playable hand — worth seeing a flop at the right price.",
    "weak": "Weak hand — only continue if you're getting great pot odds.",
}

POSTFLOP_STRENGTH_LABELS = [
    "High card",
    "One pair",
    "Two pair",
    "Three of a kind",
    "Straight",
    "Flush",
    "Full house",
    "Four of a kind",
    "Straight flush",
]

POSTFLOP_REASONING = [
    "High card — you missed the board. Pot odds determine whether to continue.",
    "One pair — marginal strength. Check/call is usually safer than betting big.",
    "Two pair — strong hand. Bet for value and to charge draws.",
    "Three of a kind — very strong. Bet for value and protection.",
    "Straight — very strong. Bet for value.",
    "Flush — very strong. Bet for value.",
    "Full house — monster. Bet strong to extract maximum value.",
    "Four of a kind — near-unbeatable. Bet for maximum value.",
    "Straight flush — the nuts. Bet everything.",
]

MIN_DECISIONS_FOR_LEAKS = 10


def _hand_info(hero_hand: list, board: list, bucket: str):
    if not board:
        label = PREFLOP_BUCKET_LABELS.get(bucket, "Unknown")
        reasoning = PREFLOP_REASONING.get(bucket, "Act based on hand strength.")
    else:
        rank = best_hand_rank(hero_hand, board)
        label = POSTFLOP_STRENGTH_LABELS[rank]
        reasoning = POSTFLOP_REASONING[rank]
    return label, reasoning


def _display_action(action: str, to_call: float) -> str:
    if action == "fold":
        return "Fold"
    if action == "call":
        return "Check" if to_call == 0 else f"Call ${to_call:.0f}"
    if action.startswith("bet_"):
        amt = action.split("_")[1]
        return f"Bet ${amt}"
    return action


def _verdict(user_action: str, recommended: str, to_call: float, user_prob: float) -> str:
    if user_action == recommended:
        return "Correct play."

    user_bets = user_action.startswith("bet_")
    rec_bets = recommended.startswith("bet_")
    user_checks = user_action == "call" and to_call == 0
    confidence = f"({user_prob:.0%} coach approval)"

    if recommended == "fold":
        return f"Too loose — folding is safer here. {confidence}"
    if user_action == "fold" and recommended != "fold":
        return f"Too tight — {_display_action(recommended, to_call)} was better. {confidence}"
    if rec_bets and user_action == "fold":
        return f"Way too tight — this is a spot to bet. {confidence}"
    if rec_bets and (user_checks or user_action == "call"):
        return f"Missed value — bet here instead of checking/calling. {confidence}"
    if not rec_bets and user_bets:
        return f"Too aggressive — {_display_action(recommended, to_call)} is safer. {confidence}"
    if rec_bets and user_bets:
        rec_amt = int(recommended.split("_")[1])
        usr_amt = int(user_action.split("_")[1])
        if usr_amt > rec_amt:
            return f"Bet sizing too large — ${rec_amt} is better here. {confidence}"
        return f"Bet sizing too small — ${rec_amt} extracts more value. {confidence}"
    return f"Close — coach slightly prefers {_display_action(recommended, to_call)}. {confidence}"


def _group_probs(probs: dict) -> dict:
    """Collapse 7 actions into 3 readable groups for display."""
    fold_p = probs.get("fold", 0.0)
    call_p = probs.get("call", 0.0)
    bet_p = sum(v for k, v in probs.items() if k.startswith("bet_"))
    return {
        "Fold": round(fold_p, 3),
        "Check / Call": round(call_p, 3),
        "Bet / Raise": round(bet_p, 3),
    }


def _analyze_leaks(decisions: list[dict]) -> dict:
    total = len(decisions)
    if total < MIN_DECISIONS_FOR_LEAKS:
        return {"enough_data": False, "decisions_tracked": total, "needed": MIN_DECISIONS_FOR_LEAKS}

    correct = sum(1 for d in decisions if d["correct"])
    overall_accuracy = correct / total

    by_street = {}
    for street in ("preflop", "flop", "turn", "river"):
        street_d = [d for d in decisions if d["street"] == street]
        if street_d:
            acc = sum(1 for d in street_d if d["correct"]) / len(street_d)
            by_street[street] = {"accuracy": round(acc, 3), "count": len(street_d)}

    leaks = []

    # Over-folding: folded when fold wasn't top recommendation
    bad_folds = [d for d in decisions if d["user_action"] == "fold" and d["recommended_action"] != "fold"]
    if bad_folds:
        rate = len(bad_folds) / total
        if rate > 0.12:
            leaks.append({
                "type": "over_folding",
                "severity": "high" if rate > 0.25 else "medium",
                "message": f"You fold too often — {rate:.0%} of your decisions were unnecessary folds.",
            })

    # Calling station: called when fold was recommended
    bad_calls = [d for d in decisions if d["user_action"] == "call" and d["recommended_action"] == "fold"]
    if bad_calls:
        rate = len(bad_calls) / total
        if rate > 0.12:
            leaks.append({
                "type": "calling_station",
                "severity": "high" if rate > 0.25 else "medium",
                "message": f"You call too loosely — {rate:.0%} of your calls were in spots where folding was better.",
            })

    # Passive: checked/called when betting was recommended
    passive = [d for d in decisions if d["user_action"] == "call" and d["recommended_action"].startswith("bet_")]
    if passive:
        rate = len(passive) / total
        if rate > 0.18:
            leaks.append({
                "type": "passive",
                "severity": "high" if rate > 0.35 else "medium",
                "message": f"You play too passively — {rate:.0%} of the time you check/call when betting is better.",
            })

    # Over-aggressive: bet when check/call/fold was recommended
    over_agg = [d for d in decisions if d["user_action"].startswith("bet_") and not d["recommended_action"].startswith("bet_")]
    if over_agg:
        rate = len(over_agg) / total
        if rate > 0.12:
            leaks.append({
                "type": "over_aggressive",
                "severity": "medium",
                "message": f"You bet too liberally — {rate:.0%} of your bets were in spots that call for caution.",
            })

    worst_street = None
    if by_street:
        worst = min(by_street.items(), key=lambda x: x[1]["accuracy"])
        if worst[1]["count"] >= 3:
            worst_street = worst[0]

    return {
        "enough_data": True,
        "decisions_tracked": total,
        "overall_accuracy": round(overall_accuracy, 3),
        "by_street": by_street,
        "leaks": leaks,
        "worst_street": worst_street,
    }


@app.route("/api/evaluate", methods=["POST"])
def evaluate():
    data = request.get_json(force=True)
    hero_hand = data["hero_hand"]
    board = data.get("board", [])
    street = data["street"]
    pot = float(data["pot"])
    to_call = float(data["to_call"])
    user_action = data["user_action"]
    style = data.get("style", "moderate")

    ctx = HandContext(
        hole_cards=hero_hand,
        board_cards=board,
        street=street,
        pot_size=pot,
        to_call=to_call,
        style=style,
        position="BTN/SB",
    )
    result = teacher_policy(ctx)
    recommended = result["action"]
    bucket = result["bucket"]
    probs = result["probs"]

    user_prob = probs.get(user_action, 0.0)
    hand_strength, reasoning = _hand_info(hero_hand, board, bucket)
    correct = user_action == recommended

    threading.Thread(
        target=save_decision,
        args=(street, user_action, recommended, correct, pot, to_call, hand_strength, style),
        daemon=True,
    ).start()

    return jsonify({
        "street": street,
        "recommended_action": recommended,
        "recommended_label": _display_action(recommended, to_call),
        "match": correct,
        "verdict": _verdict(user_action, recommended, to_call, user_prob),
        "reasoning": reasoning,
        "hand_strength": hand_strength,
        "action_probs": _group_probs(probs),
        "user_action_prob": round(user_prob, 3),
    })


@app.route("/api/leaks", methods=["GET"])
def leaks():
    decisions = get_recent_decisions(limit=200)
    return jsonify(_analyze_leaks(decisions))


@app.route("/api/decisions/count", methods=["GET"])
def decisions_count():
    decisions = get_recent_decisions(limit=10_000)
    return jsonify({"count": len(decisions)})


@app.route("/api/decisions", methods=["DELETE"])
def reset_decisions():
    clear_decisions()
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(port=5001, debug=False)
