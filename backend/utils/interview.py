from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv
import requests
import google.generativeai as genai
from elevenlabs.client import ElevenLabs
import uuid
import re

# Load Environment Variables
load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=gemini_api_key)

API_KEYS = os.getenv("ELEVEN_API_KEYS").split(",") if os.getenv("ELEVEN_API_KEYS") else []
current_key_index = 0

router = APIRouter()

# In-memory chat history storage
chat_history = {}

class TextInput(BaseModel):
    text: str
    voice_id: str = "JBFqnCBsd6RMkjVDRZzb"
    model_id: str = "eleven_multilingual_v2"

class PromptInput(BaseModel):
    prompt: str
    
class FormDataInput(BaseModel):
    role: str
    jobDescription: str

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
        print(f"Error generating response: {str(e)}")
        formatted_reply = "Oops! I'm having some technical difficulties."

    return {"reply": formatted_reply}
    
@router.post("/process-interview-prompt/")
async def process_interview_prompt(prompt_input: EnhancedPromptInput):
    user_id = prompt_input.user_id
    user_prompt = prompt_input.prompt
    role = prompt_input.role.strip()
    job_desc = prompt_input.job_desc.strip()

    prev_context = chat_history.get(user_id, "")
    updated_context = f"{prev_context}\nUser: {user_prompt}"

    # Ensure role and job description are explicitly injected into the prompt
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
    {updated_context}

    **AI (Response in bullet points, max 120 words):**
    """

    # Debugging Step: Print the prompt before sending to AI
    print("DEBUG: Sending prompt to AI -->")
    print(prompt_interview)

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content([prompt_interview])

        chatbot_reply = response.text.strip() if response and response.text.strip() else "Sorry, I couldn't generate a response."
        
        # Ensure markdown formatting is removed and bullet points are formatted
        formatted_reply = format_text(chatbot_reply)

    except Exception as e:
        print(f"Error generating response: {str(e)}")
        formatted_reply = "Oops! I'm having some technical difficulties."

    # Update chat history
    chat_history[user_id] = updated_context + f"\nAI: {formatted_reply}"

    # Debugging Step: Print chat history updates
    print(f"DEBUG: Updated chat history for {user_id} -->")
    print(chat_history[user_id])

    return {"reply": formatted_reply}

# Your enhanced prompt session storage (could be a database in production)
# This is just a simple in-memory store for demonstration
enhanced_prompt_sessions = {}

@router.post("/fetch-form-data")
async def fetch_form_data(form_data: FormDataInput):
    """
    Receive job role and description from the frontend and update the EnhancedPromptInput model.
    Returns a session ID that can be used for subsequent prompts.
    """
    try:
        # Create a new user ID for this session
        user_id = str(uuid.uuid4())
        
        # Create an initial EnhancedPromptInput with empty prompt but with the form data
        enhanced_input = EnhancedPromptInput(
            user_id=user_id,
            prompt="",  # This will be filled later when actual prompts are sent
            role=form_data.role,
            job_desc=form_data.jobDescription
        )
        
        # Store this session for later use
        enhanced_prompt_sessions[user_id] = enhanced_input
        
        # Return the user_id and the updated model information
        return {
            "status": "success",
            "message": "Form data received successfully",
            "session_id": user_id,
            "data": {
                "role": enhanced_input.role,
                "job_desc": enhanced_input.job_desc
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing form data: {str(e)}")