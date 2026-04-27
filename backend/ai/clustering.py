"""
K-means clustering on wrong decisions to identify specific situation leaks.

Pure Python — no sklearn dependency.
"""

import random
from collections import Counter
from typing import Optional

from ai.features import extract_features

MIN_WRONG_FOR_CLUSTERING = 15
RANDOM_SEED = 42


def _kmeans(X: list[list[float]], k: int, max_iter: int = 100) -> tuple[list[int], list[list[float]]]:
    """K-means with fixed seed for reproducibility."""
    rng = random.Random(RANDOM_SEED)
    n = len(X)
    dim = len(X[0])

    centroids = [list(X[i]) for i in rng.sample(range(n), k)]
    assignments = [-1] * n

    for _ in range(max_iter):
        new_assignments = []
        for x in X:
            dists = [sum((x[j] - c[j]) ** 2 for j in range(dim)) for c in centroids]
            new_assignments.append(dists.index(min(dists)))

        if new_assignments == assignments:
            break
        assignments = new_assignments

        for ki in range(k):
            pts = [X[i] for i in range(n) if assignments[i] == ki]
            if pts:
                centroids[ki] = [sum(p[j] for p in pts) / len(pts) for j in range(dim)]

    return assignments, centroids


def _categorize_action(action: str) -> str:
    if action == "fold":
        return "fold"
    if action == "call":
        return "check/call"
    return "bet"


def _characterize_cluster(decisions: list[dict], centroid: list[float]) -> dict:
    """Convert a cluster into a human-readable insight."""
    streets = [d["street"] for d in decisions]
    top_street = Counter(streets).most_common(1)[0][0]

    strengths = [d["hand_strength"] for d in decisions]
    top_strength = Counter(strengths).most_common(1)[0][0]

    mistake_pairs = Counter(
        (_categorize_action(d["user_action"]), _categorize_action(d["recommended_action"]))
        for d in decisions
    )
    user_cat, rec_cat = mistake_pairs.most_common(1)[0][0]

    descriptions = {
        ("fold", "check/call"): "folding when you should check or call",
        ("fold", "bet"):        "folding when you should be betting",
        ("check/call", "fold"): "calling when folding is correct",
        ("check/call", "bet"):  "checking or calling instead of betting for value",
        ("bet", "fold"):        "bluffing in spots where folding is better",
        ("bet", "check/call"):  "betting when checking or calling is safer",
    }
    mistake = descriptions.get((user_cat, rec_cat), f"{user_cat} when {rec_cat} is better")

    pot_odds = centroid[6]
    price_note = ""
    if pot_odds > 0.4:
        price_note = " even when the price is high"
    elif pot_odds < 0.15:
        price_note = " even when getting a good price"

    return {
        "count": len(decisions),
        "street": top_street,
        "hand_strength": top_strength,
        "mistake": mistake,
        "description": (
            f"On the {top_street} with {top_strength.lower()}, "
            f"you tend toward {mistake}{price_note}."
        ),
    }


def find_situation_clusters(decisions: list[dict]) -> Optional[list[dict]]:
    """
    Cluster the wrong decisions and return a list of situation descriptions.
    Returns None if there isn't enough data.
    """
    wrong = [d for d in decisions if not d["correct"] and d.get("hole_cards") and d.get("board") is not None]

    if len(wrong) < MIN_WRONG_FOR_CLUSTERING:
        return None

    # Build feature matrix
    X = []
    valid = []
    for d in wrong:
        try:
            feats = extract_features(
                hole_cards=d["hole_cards"],
                board_cards=d["board"],
                street=d["street"],
                pot=d["pot"],
                to_call=d["to_call"],
            )
            X.append(feats)
            valid.append(d)
        except Exception:
            continue

    if len(X) < MIN_WRONG_FOR_CLUSTERING:
        return None

    k = min(3, max(2, len(X) // 10))
    assignments, centroids = _kmeans(X, k)

    clusters = []
    for ki in range(k):
        cluster_decisions = [valid[i] for i in range(len(valid)) if assignments[i] == ki]
        if len(cluster_decisions) < 3:
            continue
        centroid = centroids[ki]
        clusters.append(_characterize_cluster(cluster_decisions, centroid))

    # Sort by size descending — biggest leaks first
    clusters.sort(key=lambda c: c["count"], reverse=True)
    return clusters if clusters else None
