# Poker Strategy Trainer – Flask backend

Python/Flask API that serves scenarios and evaluates actions. Game data is stored in **Supabase**.

## Setup

1. **Python env** (from project root):
   ```bash
   python -m venv .venv
   source .venv/bin/activate   # or .venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

2. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - In the SQL Editor, run the contents of `backend/supabase_schema.sql` to create `scenarios` and `attempts` (and the optional `get_random_scenario()` function).
   - In Project Settings → API: copy **Project URL** and **anon public** key.

3. **Environment**
   - Copy `.env.example` to `.env` in the **project root**.
   - Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`.

## Run

From the **backend** directory (so imports resolve):

```bash
cd backend
flask --app app run
```

Default: http://127.0.0.1:5000. The Vite frontend proxies `/scenario` and `/submit-action` to this port.

**Without Supabase:** If `.env` has no Supabase keys, the app still runs and returns stub scenario/feedback so you can develop the UI.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/scenario` | One scenario (from Supabase or stub). Response includes `scenario_id`. |
| POST | `/submit-action` | Body: `{ hand_state, user_action, scenario_id }`. Returns feedback; optionally logs to `attempts`. |

## Supabase tables

- **scenarios** – One row per training hand (position, hero_hand, board, pot, stack, street, facing_action) plus correct answer (recommended_action, reasoning, concept, ev_difference).
- **attempts** – Optional log of each user submission (scenario_id, user_action, recommended_action, correct).

See `supabase_schema.sql` for full DDL and example insert.
