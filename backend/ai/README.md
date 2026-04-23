# Teacher Policy Sandbox

This directory is isolated from your app runtime and is meant for experimenting with
"AI-ish" bot training flows.

## Files

- `teacher_policy.py` - rule-based teacher that outputs:
  - sampled action (`fold`, `call`, `bet_1`..`bet_5`)
  - full probability distribution over actions
  - internal strength bucket used for the decision
- `generate_teacher_dataset.py` - synthetic dataset generator (JSONL).

## Why this exists

You asked for different playstyles (aggressive, moderate, tight) and concern about trainsets.
This creates your trainset by simulation instead of needing external labeled data.

## Generate a dataset

From repo root:

```bash
python backend/ai/generate_teacher_dataset.py --num-samples 5000 --output backend/ai/data/teacher_examples.jsonl
```

Each row contains:

- `state` (hole cards, board cards, street, pot size, to_call, style, position)
- `target_action` (teacher sampled action)
- `target_probs` (soft labels useful for distillation)
- `teacher_bucket` (debug signal)

## Next step after this

Train a small classifier (logistic regression or tiny MLP) to predict `target_action`
from `state` features. Keep `target_probs` if you want to do soft-label training later.

