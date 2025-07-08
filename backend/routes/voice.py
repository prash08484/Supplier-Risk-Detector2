from fastapi import APIRouter, HTTPException, UploadFile, Form
from pydantic import BaseModel
from typing import Optional
import logging
from agent.async_graph import AsyncSupplierRiskAgent
import openai
import os
from dotenv import load_dotenv
from tempfile import NamedTemporaryFile
import shutil
from datetime import datetime
import json

from database import db  # ✅ This imports the shared Prisma client

load_dotenv()
logger = logging.getLogger(__name__)


router = APIRouter(prefix="/voice")


openai.api_key = os.getenv("OPENAI_API_KEY")

class VoiceChatResponse(BaseModel):
    success: bool
    question: str
    answer: str
    audio_url: str
    sources: list[str]
    timestamp: str

@router.post("/chat", response_model=VoiceChatResponse)
async def voice_chat(
    url: Optional[str] = Form(None),
    supplier_name: Optional[str] = Form(None),
    file: UploadFile = Form(...),
    chat_history: Optional[str] = Form(None)
):
    try:
        logger.info(f"Starting voice chat for URL: {url or supplier_name}")

        if not url and not supplier_name:
            raise HTTPException(
                status_code=400,
                detail="Either 'url' or 'supplier_name' must be provided."
            )

        identifier = url or supplier_name

        if not db.is_connected():
            await db.connect()

        supplier = await db.supplier.find_unique(
            where={"url": url} if url else {"name": supplier_name}
        )
        if not supplier:
            raise HTTPException(
                status_code=404,
                detail="Supplier not found. Please analyze the supplier first."
            )

        with NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name

        with open(temp_path, "rb") as audio_file:
            transcription = openai.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        os.unlink(temp_path)
        question = transcription.text
        logger.info(f"Transcription result: {question}")

        parsed_history = []
        if chat_history:
            try:
                parsed_history = json.loads(chat_history)
            except json.JSONDecodeError as e:
                logger.warning(f"Invalid chat_history JSON: {e}")

        agent = AsyncSupplierRiskAgent()
        chat_result = await agent.answer_question(
            identifier,
            question,
            parsed_history
        )

        if not chat_result["success"]:
            raise HTTPException(
                status_code=400,
                detail=chat_result.get("error", "Chat failed")
            )

        answer = chat_result["answer"]

        tts_response = openai.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=answer
        )
        with NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
            temp_audio.write(tts_response.content)
            audio_url = f"/tmp/{os.path.basename(temp_audio.name)}"

        try:
            await db.chatlog.create(
                data={
                    "url": supplier.url,
                    "question": question,
                    "answer": answer,
                    "sources": chat_result.get("sources", [])
                }
            )
        except Exception as e:
            logger.warning(f"Failed to store chat: {e}")

        return {
            "success": True,
            "question": question,
            "answer": answer,
            "audio_url": audio_url,
            "sources": chat_result.get("sources", []),
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice chat failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
