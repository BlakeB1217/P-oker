from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_ANON_KEY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def get_hands():
    hands = (
        supabase.table("hands")
        .select("id, session_id, user_id, variant, format, hero_cards, board_flop, board_turn, board_river")
        .limit(10)
        .execute()
    )
    print(hands.data)


def get_random_hand():
    """Call the Supabase RPC `get_random_hand` (see SQL in docs). Returns one row dict or None."""
    r = supabase.rpc("get_random_hand").execute()
    if r.data and len(r.data) > 0:
        return r.data[0]
    return None


if __name__ == "__main__":
    print(get_random_hand())