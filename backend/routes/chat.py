from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from typing import List, Optional, Any
import logging
from datetime import datetime
import uuid
import asyncio
from agent.async_graph import AsyncSupplierRiskAgent
from database import db
from utils.url_tools import normalize_url  # ✅ import your normalizer

logger = logging.getLogger(__name__)
router = APIRouter()
agent = AsyncSupplierRiskAgent()

# Models
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

    @field_validator('role')
    def validate_role(cls, v):
        if v not in ['user', 'assistant']:
            raise ValueError('Role must be either "user" or "assistant"')
        return v

class ChatRequest(BaseModel):
    url: Optional[str] = None
    supplier_name: Optional[str] = None
    question: str
    chat_history: Optional[List[ChatMessage]] = None

    @field_validator('question')
    def validate_question(cls, v):
        if not v or not v.strip():
            raise ValueError('Question cannot be empty')
        return v.strip()

    @field_validator('url')
    def validate_url(cls, v):
        if v:
            try:
                v = normalize_url(v)  # ✅ Normalize URL
                if len(v) > 2048:
                    raise ValueError('URL must be less than 2048 characters')
            except Exception as e:
                raise ValueError(f'Invalid URL: {str(e)}')
        return v

    @field_validator('supplier_name')
    def validate_name(cls, v):
        if v and len(v) > 255:
            raise ValueError('Supplier name must be less than 255 characters')
        return v

class ChatResponse(BaseModel):
    success: bool
    answer: str
    sources: List[str]
    error: Optional[str] = None
    timestamp: str

# Helper Functions
async def ensure_db_connection():
    try:
        if not db.is_connected():
            await db.connect()
        if not hasattr(agent, 'vector_store'):
            await agent.initialize()
    except Exception as e:
        logger.error(f"Initialization error: {str(e)}")
        raise

async def get_or_create_supplier(url: Optional[str], name: Optional[str]) -> str:
    try:
        await ensure_db_connection()
        fallback_url = f"supplier-{uuid.uuid4().hex[:8]}"

        if url:
            try:
                normalized_url = normalize_url(url)
                existing = await db.supplier.find_unique(where={"url": normalized_url})
                if existing:
                    return normalized_url
                created = await db.supplier.create(
                    data={
                        "url": normalized_url,
                        "name": (name or f"Supplier {normalized_url[:20]}...")[:255],
                        "riskScore": "0",
                        "summary": "",
                        "flags": []
                    }
                )
                return created.url
            except Exception as e:
                logger.warning(f"URL-based supplier creation failed: {str(e)}")

        if name:
            try:
                existing = await db.supplier.find_first(
                    where={"name": {"equals": name, "mode": "insensitive"}}
                )
                if existing:
                    return existing.url if existing.url else fallback_url
                new_url = f"supplier-{name.lower().replace(' ', '-')[:200]}-{uuid.uuid4().hex[:4]}"
                created = await db.supplier.create(
                    data={
                        "url": new_url,
                        "name": name[:255],
                        "riskScore": "0",
                        "summary": "",
                        "flags": []
                    }
                )
                return created.url
            except Exception as e:
                logger.warning(f"Name-based supplier creation failed: {str(e)}")

        created = await db.supplier.create(
            data={
                "url": fallback_url,
                "name": "Unknown Supplier",
                "riskScore": "0",
                "summary": "",
                "flags": []
            }
        )
        return created.url

    except Exception as e:
        logger.error(f"Critical error in supplier creation: {str(e)}")
        created = await db.supplier.create(
            data={
                "url": fallback_url,
                "name": "Unknown Supplier",
                "riskScore": "0",
                "summary": "",
                "flags": []
            }
        )
        return created.url

async def store_chat_with_retry(
    question: str,
    answer: str,
    sources: Optional[List[str]],
    url: Optional[str],
    max_retries: int = 3
) -> bool:
    normalized_question = (question or "").strip()
    normalized_answer = (answer or "").strip()
    normalized_sources = sources if sources is not None else []

    if not normalized_question:
        logger.error("Attempted to store chat with empty or invalid question")
        return False
    if not normalized_answer:
        logger.error("Attempted to store chat with empty or invalid answer")
        return False

    chat_data = {
        "question": normalized_question,
        "answer": normalized_answer,
        "sources": [normalize_url(src) for src in normalized_sources if src],
        "url": normalize_url(url) if url else None
    }

    for attempt in range(max_retries):
        try:
            await ensure_db_connection()
            logger.debug(f"Prepared ChatLog data: {chat_data}")

            await db.chatlog.create(data=chat_data)
            return True

        except Exception as e:
            logger.warning(f"Chat storage attempt {attempt + 1} failed: {str(e)}")
            if attempt == max_retries - 1:
                logger.error(f"Final chat storage attempt failed: {str(e)}")
                return False
            await asyncio.sleep(1 * (attempt + 1))

@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    try:
        question = (request.question or "").strip()
        if not question:
            raise HTTPException(status_code=400, detail="Question cannot be empty")

        normalized_url = None
        if request.url:
            try:
                normalized_url = normalize_url(request.url)
            except Exception as e:
                logger.warning(f"URL normalization failed: {str(e)}")

        await ensure_db_connection()
        supplier_url = await get_or_create_supplier(normalized_url, request.supplier_name)
        if not supplier_url:
            raise HTTPException(status_code=500, detail="Could not resolve supplier URL")

        search_identifier = supplier_url or normalized_url or request.supplier_name
        if not search_identifier:
            raise HTTPException(status_code=400, detail="No valid identifier provided for search")

        result = await agent.answer_question(
            search_identifier,
            question,
            [msg.model_dump() for msg in request.chat_history] if request.chat_history else None
        )

        normalized_sources = []
        if result.get("sources"):
            normalized_sources = [
                normalize_url(src)
                for src in result["sources"]
                if src and isinstance(src, str)
            ]

        storage_success = await store_chat_with_retry(
            question=question,
            answer=result.get("answer", ""),
            sources=normalized_sources,
            url=supplier_url
        )
        if not storage_success:
            logger.error("Chat storage failed, but continuing with response")

        return {
            "success": True,
            "answer": result.get("answer", "No answer available"),
            "sources": normalized_sources,
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat processing failed: {str(e)}", exc_info=True)
        return {
            "success": False,
            "answer": "I encountered an error processing your request. Please try again.",
            "sources": [],
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
