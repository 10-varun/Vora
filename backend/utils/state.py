from typing import Dict, Any

active_users: Dict[str, Any] = {}

def get_user(uuid: str) -> Any:
    """Get user data by UUID"""
    return active_users.get(uuid)

def set_user(uuid: str, data: Any) -> None:
    """Store user data by UUID"""
    active_users[uuid] = data

def remove_user(uuid: str) -> None:
    """Remove user data by UUID"""
    if uuid in active_users:
        del active_users[uuid]

chat_history: Dict[str, str] = {}
user_sessions: Dict[str, Dict[str, Any]] = {}