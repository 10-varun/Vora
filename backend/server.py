from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
from dotenv import load_dotenv

from utils.interview import router
from utils import state  # Import the shared state module

load_dotenv()

app = FastAPI(title = "Vora")
app.include_router(router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserLogin(BaseModel):
    uuid: str
    email: Optional[str] = None

@app.post("/login")
async def user_login(user_data: UserLogin):
    # Store user data in the shared state
    state.set_user(user_data.uuid, {
        "uuid": user_data.uuid,
        "email": user_data.email,
        "logged_in": True
    })
    
    # Log the login attempt
    print(f"User with UUID {user_data.uuid} logged in")
    
    # Return success response
    return {
        "status": "success",
        "message": "Login recorded successfully",
        "user_id": user_data.uuid
    }

# Home Route
@app.get("/")
async def root():
    return {"message": "Interview Preparation API is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)