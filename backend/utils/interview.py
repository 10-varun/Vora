from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import requests
import google.generativeai as genai
from elevenlabs.client import ElevenLabs

# Load Environment Variables
load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=gemini_api_key)

API_KEYS = os.getenv("ELEVEN_API_KEYS").split(",")
current_key_index = 0

router = APIRouter()

# In-memory chat history storage
chat_history = {}

class TextInput(BaseModel):
    text: str
    voice_id: str = "JBFqnCBsd6RMkjVDRZzb"
    model_id: str = "eleven_multilingual_v2"

class PromptInput(BaseModel):
    user_id: str
    prompt: str
    role: str
    job_desc: str

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
    user_id = prompt_input.user_id
    user_prompt = prompt_input.prompt

    prev_context = chat_history.get(user_id, "")
    updated_context = f"{prev_context}\nUser: {user_prompt}"

    prompt_interview = f"""
    Assume that you're the interviewer and you're conducting a job interview for the following role:

    **Role:** {prompt_input.role}

    **Job Description:** {prompt_input.job_desc}

    Have a professional and engaging conversation! Be clear and concise.
    Ask thoughtful questions tailored to the job description and make the chat feel focused and productive.
    Keep responses concise and clear, like a real professional conversation.
    Pick up on interesting bits from the candidate's replies and ask relevant follow-up questions that probe their experience and skills in relation to the role.
    No AI talk—just feel like a real interviewer conducting an interview for this particular position.

    Here's our conversation so far:
    {updated_context}

    AI:
    """

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content([prompt_interview])
        chatbot_reply = response.text.strip() if response and response.text.strip() else "Sorry, I couldn't generate a response."
    except Exception:
        chatbot_reply = "Oops! I'm having some technical difficulties."

    chat_history[user_id] = updated_context + f"\nAI: {chatbot_reply}"

    return {"reply": chatbot_reply}