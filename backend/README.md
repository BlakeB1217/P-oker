# Poker Strategy Trainer – Flask Backend

Python/Flask API that evaluates player actions and tracks decision history.

## Setup

1. **Python env** (from project root):
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Run** (from the `backend` directory):
   ```bash
   cd backend
   python app.py
   ```
   Runs on http://127.0.0.1:5001. The Vite frontend proxies `/api/*` to this port.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/evaluate` | Evaluate a user action. Body: `{ hero_hand, board, street, pot, to_call, user_action, style }`. Returns coaching feedback. |
| GET | `/api/leaks` | Analyze stored decisions and return tendency/leak report. |
| GET | `/api/decisions/count` | Total decisions tracked this session. |
| DELETE | `/api/decisions` | Clear decision history. |

## Decision Storage

Decisions are stored locally in `backend/decisions.jsonl`. Each line is a JSON record containing street, user action, recommended action, correctness, pot size, hand strength, and hole cards. This file is gitignored and accumulates across sessions until cleared via the API.

## Structure

- `app.py` — Flask app and API endpoints
- `supabase_client.py` — local file storage (read/write decisions.jsonl)
- `ai/teacher_policy.py` — rule-based coaching policy
- `ai/features.py` — hand state feature extraction
- `ai/clustering.py` — k-means clustering for leak detection
