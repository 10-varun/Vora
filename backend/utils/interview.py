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
user_sessions = {} # For stats

class TextInput(BaseModel):
    text: str
    voice_id: str = "JBFqnCBsd6RMkjVDRZzb"
    model_id: str = "eleven_multilingual_v2"

class PromptInput(BaseModel):
    prompt: str

class EnhancedPromptInput(BaseModel):
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    prompt: str
    role: str = "Software Engineer"
    job_desc: str = "We are looking for a skilled Software Engineer with experience in Python, JavaScript, and cloud technologies. The ideal candidate should have 3+ years of experience developing web applications and be familiar with modern frameworks."

# Completely rewritten format_text function to enforce bullet points with line breaks
def format_text(text):
    """
    Format text to ensure it's always in bullet point format with proper spacing
    and line breaks regardless of the input format.
    """
    # Step 1: Remove markdown formatting
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)  # Remove bold
    text = re.sub(r'\*(.*?)\*', r'\1', text)      # Remove italic
    text = re.sub(r'__(.*?)__', r'\1', text)      # Remove underline
    text = re.sub(r'~~(.*?)~~', r'\1', text)      # Remove strikethrough
    text = re.sub(r'`(.*?)`', r'\1', text)        # Remove code
    
    # Step 2: First, ensure all existing bullet points have proper breaks
    # This will handle any inline bullets in the original text
    text = re.sub(r'([^\n])(•|-)(\s*)', r'\1\n\n• ', text)
    
    # Step 3: Split text into paragraphs
    paragraphs = re.split(r'\n\s*\n', text)
    formatted_lines = []
    
    # Process each paragraph to extract sentences or existing lines
    for paragraph in paragraphs:
        if not paragraph.strip():
            continue
            
        # Split paragraph into lines
        lines = paragraph.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Handle existing bullet points
            if line.startswith('•') or line.startswith('-') or line.startswith('*'):
                line = re.sub(r'^[•\-*]\s*', '• ', line)
            # Convert numbered points to bullets
            elif re.match(r'^\d+\.?\s+', line):
                line = re.sub(r'^\d+\.?\s+', '• ', line)
            # If no bullet, add one
            else:
                line = f'• {line}'
                
            formatted_lines.append(line)
    
    # If no bullet points were created, try splitting by sentences
    if not formatted_lines:
        sentences = re.split(r'(?<=[.!?])\s+', text)
        for sentence in sentences:
            if sentence.strip():
                formatted_lines.append(f'• {sentence.strip()}')
    
    # Enforce word limit (approximately 120 words)
    word_count = sum(len(line.split()) for line in formatted_lines)
    if word_count > 120:
        total_words = 0
        truncated_lines = []
        for line in formatted_lines:
            words_in_line = len(line.split())
            if total_words + words_in_line <= 120:
                truncated_lines.append(line)
                total_words += words_in_line
            else:
                # Add partial line to reach ~120 words
                words = line.split()
                remaining_words = 120 - total_words
                if remaining_words > 0:
                    partial = ' '.join(words[:remaining_words])
                    truncated_lines.append(f"• {partial}...")
                break
        formatted_lines = truncated_lines
    
    # Join with DOUBLE newlines to ensure proper spacing
    # This is the key change - ensures each bullet point has its own line with spacing
    final_text = '\n\n'.join(formatted_lines)
    
    # Final cleanup to ensure consistent formatting
    # Make sure bullets are properly spaced
    final_text = re.sub(r'([^\n])• ', r'\1\n\n• ', final_text)
    
    # Remove any excess newlines at the beginning
    final_text = re.sub(r'^\n+', '', final_text)
    
    # Clean up any excessive line breaks (more than 2 consecutive newlines)
    final_text = re.sub(r'\n{3,}', '\n\n', final_text)
    
    return final_text

class StatsInput(BaseModel):
    session_id: str

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
        formatted_reply = "• Oops! I'm having some technical difficulties."

    return {"reply": formatted_reply}
    
@router.post("/process-interview-prompt/")
async def process_interview_prompt(prompt_input: EnhancedPromptInput):
    user_id = prompt_input.user_id
    user_prompt = prompt_input.prompt
    role = prompt_input.role.strip()
    job_desc = prompt_input.job_desc.strip()

    prev_context = chat_history.get(user_id, "")
    updated_context = f"{prev_context}\nUser: {user_prompt}"

    # Enhanced prompt with stronger instructions for bullet points and line breaks
    prompt_interview = f"""
    Assume that you are an experienced hiring manager conducting an interview for the role of:

    **Role:** {role}
    **Job Description:** {job_desc}

    **IMPORTANT FORMATTING INSTRUCTIONS:**
    - Conduct the interview professionally and naturally.
    - Keep responses concise (MAXIMUM 120 words).
    - Format EVERY key point as a bullet point starting with "• ".
    - DO NOT write in paragraphs, ONLY use bullet points.
    - Each bullet point should be on its own line.
    - Leave a blank line between each bullet point.
    - Add a line break after each bullet point.
    - Avoid any markdown formatting.

    Do not assume a name, post or company name.
    Have a professional and engaging conversation! Be clear and concise.
    Ask thoughtful questions tailored to the job description and make the chat feel focused and productive.
    Keep responses concise and clear, like a real professional conversation.
    Pick up on interesting bits from the candidate's replies and ask relevant follow-up questions that probe their experience and skills in relation to the role.
    No AI talk—just feel like a real interviewer conducting an interview for this particular position.

    Here's our conversation so far:
    {updated_context}

    **AI (RESPONSE MUST BE IN BULLET POINTS ONLY WITH CLEAR LINE BREAKS):**
    """

    # Debugging Step: Print the prompt before sending to AI
    print("DEBUG: Sending prompt to AI -->")
    print(prompt_interview)

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content([prompt_interview])

        chatbot_reply = response.text.strip() if response and response.text.strip() else "Sorry, I couldn't generate a response."
        
        # Force the reply into bullet points regardless of what Gemini returns
        formatted_reply = format_text(chatbot_reply)

        # Additional cleanup to ensure proper line breaks for speech synthesis
        # This replaces each "• " with a new line followed by "• "
        formatted_reply = re.sub(r'\n\n', '\n\n\n', formatted_reply)

    # Update user session for stats
    if user_id not in user_sessions:
        user_sessions[user_id] = {"user_messages": []}
    user_sessions[user_id]["user_messages"].append(user_prompt)

    return {"reply": chatbot_reply}

@router.post("/stats/")
async def generate_stats(stats_input: StatsInput):
    session_id = stats_input.session_id

    if not session_id or session_id not in user_sessions:
        raise HTTPException(status_code=400, detail={"error": "Invalid or missing session_id", "status": "error"})

    session = user_sessions[session_id]
    user_text = "\n".join(session["user_messages"])

    stats_prompt = f"""
    Analyze the following conversation **ONLY based on the user's messages**.
    Assess the user's performance in the following areas based on the provided conversation.
    Provide a **Yes** or **No** assessment for each category.

    **Communication Skills:** (Yes/No)
    **Technical & Domain Knowledge:** (Yes/No)
    **Problem-Solving & Critical Thinking:** (Yes/No)
    **Cultural Fit & Attitude:** (Yes/No)

    Here are the user's messages:
    {user_text}

    Ensure the response follows this format exactly.
    """

    formatted_stats = {
        "Communication Skills": "No",
        "Technical & Domain Knowledge": "No",
        "Problem-Solving & Critical Thinking": "No",
        "Cultural Fit & Attitude": "No"
    }

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content([stats_prompt])

        if not hasattr(response, "text"):
            raise ValueError("Unexpected API response format")

        text = response.text
        lines = text.split("\n")

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if line.startswith("**Communication Skills:**"):
                formatted_stats["Communication Skills"] = line.split(":")[-1].strip().lower().capitalize()
            elif line.startswith("**Technical & Domain Knowledge:**"):
                formatted_stats["Technical & Domain Knowledge"] = line.split(":")[-1].strip().lower().capitalize()
            elif line.startswith("**Problem-Solving & Critical Thinking:**"):
                formatted_stats["Problem-Solving & Critical Thinking"] = line.split(":")[-1].strip().lower().capitalize()
            elif line.startswith("**Cultural Fit & Attitude:**"):
                formatted_stats["Cultural Fit & Attitude"] = line.split(":")[-1].strip().lower().capitalize()

        for key in formatted_stats:
            if formatted_stats[key] not in ("Yes", "No"):
                formatted_stats[key] = "No"  # ensure only yes or no is returned.

    except Exception as e:
        print(f"Stats API Error: {str(e)}")
        formatted_stats = {"error": str(e)}

    return {"stats": formatted_stats, "status": "success" if "error" not in formatted_stats else "error"}
