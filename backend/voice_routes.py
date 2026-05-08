"""Voice routes: Whisper STT and OpenAI TTS."""
import os
import io
import base64
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from emergentintegrations.llm.openai import OpenAISpeechToText, OpenAITextToSpeech

from auth_utils import get_current_user
from models import TTSRequest

router = APIRouter(prefix="/voice", tags=["voice"])

ALLOWED_TTS_VOICES = {"alloy", "ash", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer"}


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form("en"),
    user: dict = Depends(get_current_user),
):
    api_key = os.environ["EMERGENT_LLM_KEY"]
    contents = await audio.read()
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio file too large (max 25MB)")
    if len(contents) < 100:
        raise HTTPException(status_code=400, detail="Audio file is empty")

    stt = OpenAISpeechToText(api_key=api_key)
    file_obj = io.BytesIO(contents)
    file_obj.name = audio.filename or "audio.webm"
    try:
        response = await stt.transcribe(
            file=file_obj,
            model="whisper-1",
            response_format="json",
            language=language if language and len(language) == 2 else None,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Transcription failed: {str(e)[:200]}")

    text = getattr(response, "text", None) or (response.get("text") if isinstance(response, dict) else "")
    return {"text": text or ""}


@router.post("/tts")
async def text_to_speech(payload: TTSRequest, user: dict = Depends(get_current_user)):
    api_key = os.environ["EMERGENT_LLM_KEY"]
    voice = payload.voice if payload.voice in ALLOWED_TTS_VOICES else "sage"
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty text")
    # Limit to 4096 chars
    text = text[:4096]
    tts = OpenAITextToSpeech(api_key=api_key)
    try:
        audio_b64 = await tts.generate_speech_base64(
            text=text, model="tts-1", voice=voice, response_format="mp3"
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"TTS failed: {str(e)[:200]}")
    return {"audio_base64": audio_b64, "format": "mp3"}
