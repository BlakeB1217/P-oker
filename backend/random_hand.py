"""Generate a random heads-up Limit Hold'em hand."""

from __future__ import annotations

import json
import random
from dataclasses import asdict, dataclass


RANKS = "23456789TJQKA"
SUITS = "cdhs"  # clubs, diamonds, hearts, spades


@dataclass
class PlayerState:
    name: str
    seat: int
    position: str
    hole_cards: list[str]


def build_deck() -> list[str]:
    """Return a standard 52-card deck in short notation (e.g., Ah, Tc)."""
    return [f"{rank}{suit}" for rank in RANKS for suit in SUITS]


def generate_random_hand() -> dict:
    """
    Generate a heads-up fixed-limit hold'em hand state.

    - Players: User (button/small blind), Bot (big blind)
    - Deal 2 hole cards each
    - Deal flop/turn/river with burn cards
    - Include standard fixed-limit bet sizing metadata
    """
    deck = build_deck()
    random.shuffle(deck)

    players = [
        PlayerState(
            name="User",
            seat=0,
            position="BTN/SB",
            hole_cards=[deck.pop(), deck.pop()],
        ),
        PlayerState(
            name="Bot",
            seat=1,
            position="BB",
            hole_cards=[deck.pop(), deck.pop()],
        ),
    ]

    burn_flop = deck.pop()
    flop = [deck.pop(), deck.pop(), deck.pop()]
    burn_turn = deck.pop()
    turn = deck.pop()
    burn_river = deck.pop()
    river = deck.pop()

    board = flop + [turn, river]
    small_bet = 2
    big_bet = 4
    small_blind = 1
    big_blind = 2

    return {
        "game": "Limit Hold'em",
        "format": "heads_up",
        "stakes": {
            "small_bet": small_bet,
            "big_bet": big_bet,
            "small_blind": small_blind,
            "big_blind": big_blind,
            "display": f"{small_bet}/{big_bet}",
        },
        "players": [asdict(player) for player in players],
        "preflop": {
            "button": "User",
            "small_blind_posted_by": "User",
            "big_blind_posted_by": "Bot",
            "to_act_first": "User",
            "current_street": "preflop",
            "pot_size": small_blind + big_blind,
            "bet_size_this_street": small_bet,
            "raise_cap_per_street": 4,
        },
        "board": board,
        "streets": {
            "flop": flop,
            "turn": turn,
            "river": river,
        },
        "burn_cards": {
            "before_flop": burn_flop,
            "before_turn": burn_turn,
            "before_river": burn_river,
        },
        "remaining_deck_count": len(deck),
        "notes": {
            "betting_structure": "On preflop/flop use small_bet; on turn/river use big_bet.",
            "heads_up_rule": "Button is small blind and acts first preflop, second postflop.",
        },
    }


if __name__ == "__main__":
    hand = generate_random_hand()
    print(json.dumps(hand, indent=2))
