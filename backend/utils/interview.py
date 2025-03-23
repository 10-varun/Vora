from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv
import requests
import google.generativeai as genai
from elevenlabs.client import ElevenLabs
import uuid
import re

from supabase import create_client, Client

# Load Environment Variables
load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=gemini_api_key)

# Supabase config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

API_KEYS = os.getenv("ELEVEN_API_KEYS").split(",") if os.getenv("ELEVEN_API_KEYS") else []
current_key_index = 0

router = APIRouter()

class TextInput(BaseModel):
    text: str
    voice_id: str = "JBFqnCBsd6RMkjVDRZzb"
    model_id: str = "eleven_multilingual_v2"

class PromptInput(BaseModel):
    prompt: str
    
class FormDataInput(BaseModel):
    role: str
    jobDescription: str

class ChatInput(BaseModel):
    session_id: str
    message: str

class StatsInput(BaseModel):
    session_id: str

class EnhancedPromptInput(BaseModel):
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    prompt: str
    role: str = "Software Engineer"
    job_desc: str = "We are looking for a skilled Software Engineer with experience in Python, JavaScript, and cloud technologies. The ideal candidate should have 3+ years of experience developing web applications and be familiar with modern frameworks."

# Function to format the response text
def format_text(text):
    # Remove markdown bold markers (**)
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    
    # Convert any markdown bullet points to plain bullet points
    text = re.sub(r'^\s*\*\s+', '• ', text, flags=re.MULTILINE)
    
    # Convert numbered lists with markdown formatting to plain numbered lists
    text = re.sub(r'^\s*\d+\.\s+', lambda m: m.group(0), text, flags=re.MULTILINE)
    
    # Replace any remaining markdown with plain text
    text = re.sub(r'[_*~`]', '', text)
    
    return text.strip()

# Function to get chat history from Supabase
def get_chat_history(session_id):
    try:
        # Fetch the session record - UPDATED TABLE NAME
        response = supabase.table("chat_history").select("*").eq("session_id", session_id).execute()
        
        # If session exists, return its conversation history
        if response.data and len(response.data) > 0:
            return {
                "conv_history": response.data[0].get("conv_history", []),
                "user_messages": response.data[0].get("user_messages", []),
                "role": response.data[0].get("role", ""),
                "job_desc": response.data[0].get("job_desc", "")
            }
        
        # If session doesn't exist, return empty history
        return {"conv_history": [], "user_messages": []}
        
    except Exception as e:
        print(f"Error fetching chat history: {str(e)}")
        return {"conv_history": [], "user_messages": []}

# Function to update chat history in Supabase
def update_chat_history(session_id, session_data):
    try:
        # Check if session exists - UPDATED TABLE NAME
        response = supabase.table("chat_history").select("*").eq("session_id", session_id).execute()
        
        if response.data and len(response.data) > 0:
            # Update existing session with explicit field assignments - UPDATED TABLE NAME
            supabase.table("chat_history").update({
                "conv_history": session_data["conv_history"],
                "user_messages": session_data["user_messages"],
                "role": session_data.get("role", ""),
                "job_desc": session_data.get("job_desc", "")
            }).eq("session_id", session_id).execute()
        else:
            # Create new session with explicit field assignments - UPDATED TABLE NAME
            supabase.table("chat_history").insert({
                "session_id": session_id,
                "conv_history": session_data["conv_history"],
                "user_messages": session_data["user_messages"],
                "role": session_data.get("role", ""),
                "job_desc": session_data.get("job_desc", "")
            }).execute()
            
        return True
        
    except Exception as e:
        print(f"Error updating chat history: {str(e)}")
        return False

# Function to print chat history (for debugging)
def print_chat_history(session_id):
    session = get_chat_history(session_id)
    
    if session and session.get("conv_history"):
        print(f"\n--- CHAT HISTORY FOR SESSION {session_id} ---")
        for entry in session["conv_history"]:
            print(entry)
        print("-------------------------------------------\n")

# Switch API key function for ElevenLabs
def switch_api_key():
    global current_key_index
    if current_key_index < len(API_KEYS) - 1:
        current_key_index += 1
        print(f"⚠️ Switching to API Key {current_key_index + 1}...")
        return True
    return False

# Speech generation using ElevenLabs
def generate_speech(text, voice_id="JBFqnCBsd6RMkjVDRZzb", model_id="eleven_multilingual_v2"):
    global current_key_index

    while current_key_index < len(API_KEYS):
        try:
            client = ElevenLabs(api_key=API_KEYS[current_key_index].strip())
            audio_generator = client.text_to_speech.convert(text=text, voice_id=voice_id, model_id=model_id)

            file_path = "output/output.mp3"
            os.makedirs("output", exist_ok=True)
            with open(file_path, "wb") as f:
                for chunk in audio_generator:
                    f.write(chunk)

            print(f"✅ Audio saved as {file_path}")
            return file_path

        except requests.exceptions.HTTPError as e:
            error_code = e.response.status_code
            error_message = e.response.json().get("message", "Unknown error")

            print(f"❌ API Error: {error_code} - {error_message}")

            if error_code in [402, 429]:
                if not switch_api_key():
                    print("🚨 All API keys exhausted. Please add more keys or upgrade your plan.")
                    break
            else:
                break

        except Exception as e:
            print(f"🚨 Unexpected Error: {str(e)}")
            break

    raise HTTPException(status_code=500, detail="Speech generation failed.")

@router.post("/generate-speech/")
async def generate_speech_route(input_data: TextInput):
    file_path = generate_speech(input_data.text, input_data.voice_id, input_data.model_id)

    try:
        with open(file_path, "rb") as f:
            audio_content = f.read()

        return Response(content=audio_content, media_type="audio/mpeg")

    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Audio file not found.")

@router.post("/process-prompt/")
async def process_prompt(prompt_input: PromptInput):
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content([prompt_input.prompt])
        chatbot_reply = response.text.strip() if response and response.text.strip() else "Sorry, I couldn't generate a response."
        
        # Format the response to remove markdown and structure points
        formatted_reply = format_text(chatbot_reply)
        
    except Exception as e:
        formatted_reply = "Oops! I'm having some technical difficulties."

    return {"reply": formatted_reply}

@router.post("/chat")
async def chat(data: ChatInput):
    session_id = data.session_id
    user_input = data.message
    
    if not session_id or not user_input:
        raise HTTPException(status_code=400, detail="Missing session_id or message")
    
    # Get current session from Supabase
    session = get_chat_history(session_id)
    
    # Update session with new user message
    session["conv_history"].append(f"User: {user_input}")
    session["user_messages"].append(user_input)
    
    # Update the session in Supabase
    update_chat_history(session_id, session)
    
    # Print chat history after adding user message
    print_chat_history(session_id)
    
    # Use the entire conversation history
    context = "\n".join(session["conv_history"])
    
    prompt = f"""
    Assume that you're Khris and you're sitting for a date.
    Let's have a fun and engaging conversation! Be playful, witty, and genuinely interested.
    Ask thoughtful questions and make the chat feel warm and effortless.
    Keep responses concise and natural, like a real human conversation.
    Pick up on interesting bits from the user's replies and ask follow-up questions.
    No AI talk—just feel like a real person.

    Here's our conversation so far:
    {context}

    AI:
    """
    
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content([prompt])
        
        if hasattr(response, 'text') and response.text.strip():
            bot_response = response.text.strip()
        else:
            raise ValueError("Invalid or empty response from Gemini API")

    except Exception as e:
        bot_response = "Oops! I'm having some technical difficulties. Let's try that again!"

    # Update session with AI response
    session["conv_history"].append(f"AI: {bot_response}")
    update_chat_history(session_id, session)
    
    # Print chat history after adding AI response
    print_chat_history(session_id)
    
    return {"response": bot_response, "status": "success"}
    
@router.post("/process-interview-prompt/")
async def process_interview_prompt(prompt_input: EnhancedPromptInput):
    # Use the auto-generated UUID as the session ID
    user_id = prompt_input.user_id
    user_prompt = prompt_input.prompt
    role = prompt_input.role.strip()
    job_desc = prompt_input.job_desc.strip()

    # Get current session from Supabase
    session = get_chat_history(user_id)
    
    # Check if we need to update role and job desc
    if not session.get("role") and not session.get("job_desc"):
        session["role"] = role
        session["job_desc"] = job_desc
        
    # Update session with new message
    session["conv_history"].append(f"User: {user_prompt}")
    session["user_messages"].append(user_prompt)
    
    # Update the session in Supabase
    update_chat_history(user_id, session)
    
    # Print chat history after adding user message
    print_chat_history(user_id)
    
    # Get the complete context from the session
    context = "\n".join(session["conv_history"])

    # Create interview prompt
    prompt_interview = f"""
    Assume that you are an experienced hiring manager conducting an interview for the role of:

    **Role:** {role}
    **Job Description:** {job_desc}

    **Instructions:**
    - Your name is Khris.
    - Conduct the interview professionally and naturally.
    - Keep responses concise and structured (max 120 words).
    - Present answers in a **bullet-point format** using "•".
    - Ensure **clear spacing** between points.
    - Avoid markdown formatting.

    **Current conversation:**
    {context}

    **AI (Response in bullet points, max 120 words):**
    """

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content([prompt_interview])

        chatbot_reply = response.text.strip() if response and response.text.strip() else "Sorry, I couldn't generate a response."
        
        # Ensure markdown formatting is removed and bullet points are formatted
        formatted_reply = format_text(chatbot_reply)

    except Exception as e:
        formatted_reply = "Oops! I'm having some technical difficulties."

    # Update chat history with AI response
    session["conv_history"].append(f"AI: {formatted_reply}")
    update_chat_history(user_id, session)
    
    # Print chat history after adding AI response
    print_chat_history(user_id)
    
    return {"reply": formatted_reply}

@router.post("/fetch-form-data")
async def fetch_form_data(form_data: FormDataInput):
    """
    Receive job role and description from the frontend and update the session in Supabase.
    Returns a session ID that can be used for subsequent prompts.
    """
    try:
        # Create a new user ID for this session
        user_id = str(uuid.uuid4())
        
        # Create new session data
        session_data = {
            "conv_history": [],
            "user_messages": [],
            "role": form_data.role,
            "job_desc": form_data.jobDescription
        }
        
        # Save to Supabase
        update_chat_history(user_id, session_data)
        
        # Print the newly created session
        print(f"\n--- NEW SESSION CREATED: {user_id} ---")
        print(f"Role: {form_data.role}")
        print(f"Job Description: {form_data.jobDescription}")
        print("-------------------------------------------\n")
        
        # Return the user_id and the updated model information
        return {
            "status": "success",
            "message": "Form data received successfully",
            "session_id": user_id,
            "data": {
                "role": form_data.role,
                "job_desc": form_data.jobDescription
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing form data: {str(e)}")

@router.post("/interview-stats/")
async def generate_interview_stats(data: StatsInput):
    user_id = data.session_id
    
    # Get session from Supabase
    session = get_chat_history(user_id)
    
    if not session or not session.get("conv_history"):
        raise HTTPException(status_code=404, detail="No chat history found for this user")

    # Get the complete conversation string from the session
    context = "\n".join(session["conv_history"])
    
    if not context:
        raise HTTPException(status_code=404, detail="No chat history found for this user")
        
    # Print current chat history before generating stats
    print(f"\n--- GENERATING STATS FOR SESSION {user_id} ---")
    print_chat_history(user_id)

    # Fixed prompt to avoid f-string issues with the dictionary example
    stats_prompt = f"""
    This is a user's responses from an interview. Your task is to analyze the following conversation and evaluate the user's performance in these categories:
    
    {context}
    
    Evaluate based on these categories:
    Communication Skills: Assess the clarity, fluency, grammar, and coherence of the user's responses. Determine if the user effectively conveys their thoughts.
    Technical Domain Knowledge (TD Knowledge): Evaluate the user's understanding of technical concepts relevant to the interview. Check for correctness, depth, and confidence in explanations.
    Problem-Solving and Critical Thinking (PS_CT): Identify instances where the user demonstrates logical reasoning, structured problem-solving, and innovative thinking.
    Confidence and Attitude (CF_Attitude): Analyze the user's tone, willingness to engage, and overall confidence in responses. Consider whether they remain composed under challenging questions.
    
    Return a dictionary with this format:
    {{
        "communication_skills": "Yes" or "No",
        "td_knowledge": "Yes" or "No",
        "ps_ct": "Yes" or "No",
        "cf_attitude": "Yes" or "No"
    }}
    """

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content([stats_prompt])

        if not hasattr(response, "text"):
            raise ValueError("Unexpected API response format")

        text = response.text
        
        # Parse the returned JSON into a Python dict
        import json
        try:
            # Find JSON-like content in the text
            import re
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                json_text = json_match.group(0)
                formatted_stats = json.loads(json_text)
            else:
                formatted_stats = {"error": "Could not parse AI response"}
        except json.JSONDecodeError:
            formatted_stats = {"error": "Invalid JSON in AI response"}

    except Exception as e:
        formatted_stats = {"error": str(e)}
        
    # Print the generated stats
    print(f"\n--- STATS GENERATED FOR SESSION {user_id} ---")
    print(formatted_stats)
    print("-------------------------------------------\n")

    return {"stats": formatted_stats, "status": "success" if "error" not in formatted_stats else "error"}