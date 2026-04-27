"""Local file-based decision storage."""

import json
import os
from datetime import datetime, timezone

DECISIONS_FILE = os.path.join(os.path.dirname(__file__), "decisions.jsonl")


def save_decision(street: str, user_action: str, recommended_action: str,
                  correct: bool, pot: float, to_call: float,
                  hand_strength: str, style: str,
                  hole_cards: list, board: list) -> None:
    row = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "street": street,
        "user_action": user_action,
        "recommended_action": recommended_action,
        "correct": correct,
        "pot": round(pot, 2),
        "to_call": round(to_call, 2),
        "hand_strength": hand_strength,
        "style": style,
        "hole_cards": hole_cards,
        "board": board,
    }
    try:
        with open(DECISIONS_FILE, "a") as f:
            f.write(json.dumps(row) + "\n")
    except Exception as e:
        print(f"[storage] save_decision failed: {e}")


def clear_decisions() -> None:
    try:
        if os.path.exists(DECISIONS_FILE):
            os.remove(DECISIONS_FILE)
    except Exception as e:
        print(f"[storage] clear_decisions failed: {e}")


def get_recent_decisions(limit: int = 200) -> list[dict]:
    if not os.path.exists(DECISIONS_FILE):
        return []
    try:
        with open(DECISIONS_FILE) as f:
            lines = f.readlines()
        rows = []
        for line in reversed(lines):
            line = line.strip()
            if line:
                rows.append(json.loads(line))
            if len(rows) >= limit:
                break
        return rows
    except Exception as e:
        print(f"[storage] get_recent_decisions failed: {e}")
        return []
