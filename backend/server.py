from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import jwt
from supabase import create_client, Client
from dotenv import load_dotenv

from utils.interview import router

load_dotenv()

app = FastAPI(title="Interview Preparation")
app.include_router(router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SUPABASE_URL = os.getenv("SUPABASE_URL")
# SUPABASE_KEY = os.getenv("SUPABASE_KEY")
# SECRET_KEY = os.getenv("JWT_SECRET_KEY")

# supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Function to verify JWT token
# def verify_token(request: Request):
#     token = request.headers.get("Authorization")
#     if not token:
#         raise HTTPException(status_code = 401, detail = "Token missing")
    
#     try:
#         payload = jwt.decode(token.split(" ")[1], SECRET_KEY, algorithms = ["HS256"])
#         return payload  # Contains user details
#     except jwt.ExpiredSignatureError:
#         raise HTTPException(status_code = 401, detail = "Token expired")
#     except jwt.InvalidTokenError:
#         raise HTTPException(status_code = 401, detail = "Invalid token")

# # Signup Route
# @app.post("/signup/")
# def signup(email: str, password: str):
#     response = supabase.auth.sign_up({"email": email, 
#                                       "password": password})
    
#     if response.get("error"):
#         raise HTTPException(status_code=400, detail=response["error"]["message"])
    
#     return {"message": "Signup successful, verify your email!"}

# # Login Route
# @app.post("/login/")
# def login(email: str, password: str):
#     response = supabase.auth.sign_in_with_password({"email": email, 
#                                                     "password": password})
    
#     if response.get("error"):
#         raise HTTPException(status_code = 400, detail = response["error"]["message"])
    
#     user = response["user"]
#     jwt_token = response["session"]["access_token"]
    
#     return {"message": "Login successful", "token": jwt_token}

# Home Route
@app.get("/")
async def root():
    return {"message": "Interview Preparation API is running"}

# Protected Route (Requires Authentication)
# @app.get("/profile/")
# def profile(user = Depends(verify_token)):
#     return {"message": f"Welcome, {user['email']}"}

if __name__ == "__main__":
    uvicorn.run(app, host = "127.0.0.1", port = 8000, reload = True)