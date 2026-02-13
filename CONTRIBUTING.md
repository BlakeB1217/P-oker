# Contributing (P-oker)

## Workflow
- Prefer feature branches: simulator/..., agents/..., eval/..., ui/..., docs/...
- Keep `main` runnable. If your change breaks execution, don’t push to main.

## Commits
- Use clear messages:
  - Add KuhnPokerEnv
  - Implement random agent
  - Add tournament runner

## Code organization
- Simulator: poker_engine/game
- Agents: poker_engine/agents
- Training: poker_engine/training
- Evaluation: poker_engine/evaluation
- Scripts: experiments/
