import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Dict, Any, Optional

from . import state

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Interviews table operations
def create_interview(user_id: str) -> Dict[str, Any]:
    user = state.get_user(user_id)
    if not user:
        raise ValueError(f"User with UUID {user_id} not found in state")

    interview_data = {
        "user_id": user_id,
        "communication_skills": "No",
        "td_knowledge": "No",
        "ps_ct": "No",
        "cf_attitude": "No"
    }

    response = supabase.table("interviews").insert(interview_data).execute()

    if response.data:
        # Return the first item from the response data array
        return response.data[0]
    else:
        raise Exception("Failed to create interview")

def get_interview(user_id: str) -> Optional[Dict[str, Any]]:
    user = state.get_user(user_id)
    if not user:
        raise ValueError(f"User with UUID {user_id} not found in state")

    response = supabase.table("interviews").select("*").eq("user_id", user_id).execute()

    if response.data and len(response.data) > 0:
        return response.data[0]
    else:
        return None

def update_interview(user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
    user = state.get_user(user_id)
    if not user:
        raise ValueError(f"User with UUID {user_id} not found in state")

    existing = get_interview(user_id)
    if not existing:
        raise ValueError(f"Interview not found for user {user_id}")

    response = supabase.table("interviews").update(update_data).eq("user_id", user_id).execute()

    if response.data and len(response.data) > 0:
        return response.data[0]
    else:
        raise Exception("Failed to update interview")

def delete_interview(user_id: str) -> bool:
    user = state.get_user(user_id)
    if not user:
        raise ValueError(f"User with UUID {user_id} not found in state")

    existing = get_interview(user_id)
    if not existing:
        raise ValueError(f"Interview for {user_id} not found")

    response = supabase.table("interviews").delete().eq("user_id", user_id).execute()

    return len(response.data) > 0