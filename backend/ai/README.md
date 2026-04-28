# AI / Coaching Logic

Rule-based teacher policy and ML-powered tendency analysis.

## Files

- `teacher_policy.py` — maps hand state to a recommended action and probability distribution. Buckets hands by strength (premium/strong/playable/weak preflop; 0–8 rank postflop), applies style adjustments for aggressive/moderate/tight opponents, and uses a group-aware argmax so bet actions aren't split-voted by call.

- `features.py` — converts raw hand state (hole cards, board, street, pot, to_call) into a 14-element numerical feature vector used by the clustering module.

- `clustering.py` — pure Python k-means that groups a player's wrong decisions into recurring situation patterns. Requires 15+ wrong decisions to run. Returns human-readable cluster descriptions (e.g. "On the flop with one pair, you tend to check when betting is better.").
