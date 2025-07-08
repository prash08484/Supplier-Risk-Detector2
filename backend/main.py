from fastapi import FastAPI
import os
from dotenv import load_dotenv
load_dotenv()

import sys
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from contextlib import asynccontextmanager
import asyncio
import logging
from database import db
from utils.url_tools import normalize_url  # ✅ added import

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import routers
from routes.analyze import router as analyze_router
from routes.chat import router as chat_router
from routes.voice import router as voice_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Improved lifespan management with robust connection handling"""
    async def keep_db_alive():
        """More aggressive keep-alive with shorter intervals"""
        while True:
            try:
                if not db.is_connected():
                    await db.connect()
                    logger.info("Reconnected to database")
                await db.execute_raw("SELECT 1")
                logger.debug("Database keep-alive ping successful")
            except Exception as e:
                logger.error(f"Database keep-alive failed: {e}")
                try:
                    await db.disconnect()
                    await asyncio.sleep(1)
                    await db.connect()
                    logger.info("Reconnected to database after failure")
                except Exception as reconnect_error:
                    logger.error(f"Reconnection failed: {reconnect_error}")
            await asyncio.sleep(60)

    try:
        await db.connect(timeout=10)
        logger.info("✅ Connected to database")

        from agent.vector_store import get_vector_store
        max_retries = 3
        for attempt in range(max_retries):
            try:
                vector_store = await get_vector_store()
                logger.info("✅ Vector store initialized")
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    logger.error(f"Failed to initialize vector store after {max_retries} attempts")
                    raise
                await asyncio.sleep(2 ** attempt)

        asyncio.create_task(keep_db_alive())
        logger.info("✅ Background tasks started")

    except Exception as e:
        logger.error(f"Application startup failed: {e}")
        raise

    yield

    try:
        if db.is_connected():
            await db.disconnect()
            logger.info("🛑 Disconnected from database")
    except Exception as e:
        logger.error(f"Database disconnect failed: {e}")


app = FastAPI(
    title="Supplier Risk Analysis API",
    description="API for analyzing supplier risks using AI and RAG",
    version="1.0.0",
    lifespan=lifespan
)

# Include routers
app.include_router(analyze_router, prefix="/api/v1", tags=["Analysis"])
app.include_router(chat_router, prefix="/api/v1", tags=["Chat"])
app.include_router(voice_router, prefix="/api/v1", tags=["Voice"])

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        os.getenv("FRONTEND_URL", "")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", include_in_schema=False)
def read_root():
    return {
        "message": "Supplier Risk Analysis API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health", tags=["System"])
async def health_check():
    try:
        await db.execute_raw("SELECT 1")

        from agent.vector_store import get_vector_store
        store = await get_vector_store()

        return {
            "status": "healthy",
            "database": "connected",
            "vector_store": "available"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }, 503


@app.get("/deep-health")
async def deep_health_check():
    checks = {
        "database": False,
        "vector_store": False,
        "openai": False
    }

    try:
        await db.execute_raw("SELECT 1")
        checks["database"] = True

        from agent.vector_store import get_vector_store
        store = await get_vector_store()
        stats = await store.get_stats()
        checks["vector_store"] = bool(stats.get("namespaces", {}))

        from openai import OpenAI
        client = OpenAI()
        client.models.list(limit=1)
        checks["openai"] = True

        status_code = 200 if all(checks.values()) else 503
        return {
            **checks,
            "status": "healthy" if all(checks.values()) else "degraded"
        }, status_code

    except Exception as e:
        logger.error(f"Deep health check failed: {e}")
        return {**checks, "error": str(e)}, 503


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)
