from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel

from elevenlabs.client import ElevenLabs

import os
from dotenv import load_dotenv
import requests

import google.generativeai as genai

load_dotenv()
API_KEYS = os.getenv("ELEVEN_API_KEYS").split(",")
current_key_index = 0

router = APIRouter()

class TextInput(BaseModel):
    text: str
    voice_id: str = "JBFqnCBsd6RMkjVDRZzb"
    model_id: str = "eleven_multilingual_v2"
    
class PromptInput(BaseModel):
    prompt: str

def switch_api_key():
    global current_key_index
    if current_key_index < len(API_KEYS) - 1:
        current_key_index += 1
        print(f"⚠️ Switching to API Key {current_key_index + 1}...")
        return True
    return False

def generate_speech(text, voice_id="JBFqnCBsd6RMkjVDRZzb", model_id="eleven_multilingual_v2"):
    global current_key_index

    while current_key_index < len(API_KEYS):
        try:
            client = ElevenLabs(api_key=API_KEYS[current_key_index].strip())
            audio_generator = client.text_to_speech.convert(text=text,
                                                               voice_id=voice_id,
                                                               model_id=model_id)

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



#  -------------------- FastAPI ROUTE --------------------

@router.post("/generate-speech/")
async def generate_speech_route(input_data: TextInput):
    file_path = generate_speech(input_data.text, input_data.voice_id, input_data.model_id)

    try:
        with open(file_path, "rb") as f:
            audio_content = f.read()

        return Response(content = audio_content, 
                        media_type = "audio/mpeg")

    except FileNotFoundError:
        raise HTTPException(status_code = 500, detail = "Audio file not found.")
    
@router.post("/process-prompt/")
async def process_prompt(prompt_input: PromptInput):
    user_prompt = prompt_input.prompt

    # chatbot_reply = generate_chatbot_response(user_prompt)

    return {"reply": user_prompt}

def generate_chatbot_response(prompt: str):
    return f"Chatbot says: You said '{prompt}'"