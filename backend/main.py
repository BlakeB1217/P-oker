from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_ANON_KEY
from pydantic import BaseModel
from typing import Optional

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        user = supabase.auth.get_user(token)
        return user
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/me")
def get_me(user=Depends(get_current_user)):
    return {"user": user.user.email}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

class ActionSubmission(BaseModel):
    hand_state: dict
    user_action: str
    scenario_id: Optional[str] = None

@app.get("/scenario")
def get_scenario():
    result = supabase.table("hands").select("*").limit(1).execute()
    return result.data[0] if result.data else {}

@app.post("/submit-action")
def submit_action(body: ActionSubmission):
    # Get AI evaluation for this hand
    if body.scenario_id:
        eval_result = supabase.table("ai_evaluations")\
            .select("*")\
            .eq("hand_id", body.scenario_id)\
            .limit(1)\
            .execute()
        if eval_result.data:
            ev = eval_result.data[0]
            return {
                "recommended_action": ev.get("recommended_action"),
                "reasoning": ev.get("explanation"),
                "concept": ev.get("strategy_mix"),
                "ev_difference": ev.get("ev_estimate"),
            }
    # Fallback if no evaluation found
    return {
        "recommended_action": "unknown",
        "reasoning": "No evaluation available for this hand.",
        "concept": None,
        "ev_difference": 0,
    }