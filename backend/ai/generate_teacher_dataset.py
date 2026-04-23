"""Generate synthetic training data from the teacher policy.

Usage:
  python backend/ai/generate_teacher_dataset.py --num-samples 5000 --output backend/ai/data/teacher_examples.jsonl
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import random
from typing import List

from teacher_policy import HandContext, teacher_policy


STREETS = ["preflop", "flop", "turn", "river"]
RANKS = "23456789TJQKA"
SUITS = "cdhs"
STYLES = ["aggressive", "moderate", "tight"]
POSITIONS = ["BTN/SB", "BB"]


def build_deck() -> List[str]:
    return [f"{rank}{suit}" for rank in RANKS for suit in SUITS]


def draw_random_hand_state() -> dict:
    deck = build_deck()
    random.shuffle(deck)

    hole = [deck.pop(), deck.pop()]
    _opp_hole = [deck.pop(), deck.pop()]  # not used in features for realism

    deck.pop()  # burn before flop
    flop = [deck.pop(), deck.pop(), deck.pop()]
    deck.pop()  # burn before turn
    turn = deck.pop()
    deck.pop()  # burn before river
    river = deck.pop()

    board_full = flop + [turn, river]
    street = random.choice(STREETS)
    board_cards = {
        "preflop": [],
        "flop": board_full[:3],
        "turn": board_full[:4],
        "river": board_full[:5],
    }[street]

    pot_size = round(random.uniform(2.0, 35.0), 2)
    to_call = round(random.uniform(0.0, min(8.0, pot_size)), 2)

    return {
        "hole_cards": hole,
        "board_cards": board_cards,
        "street": street,
        "pot_size": pot_size,
        "to_call": to_call,
        "style": random.choice(STYLES),
        "position": random.choice(POSITIONS),
    }


def make_example() -> dict:
    state = draw_random_hand_state()
    context = HandContext(**state)
    policy_out = teacher_policy(context)
    return {
        "state": state,
        "target_action": policy_out["action"],
        "target_probs": policy_out["probs"],
        "teacher_bucket": policy_out["bucket"],
    }


def generate_examples(num_samples: int) -> List[dict]:
    return [make_example() for _ in range(num_samples)]


def write_jsonl(path: Path, rows: List[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row) + "\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--num-samples", type=int, default=5000)
    parser.add_argument(
        "--output",
        type=str,
        default="backend/ai/data/teacher_examples.jsonl",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    examples = generate_examples(args.num_samples)
    output_path = Path(args.output)
    write_jsonl(output_path, examples)
    print(f"Wrote {len(examples)} examples to {output_path}")

