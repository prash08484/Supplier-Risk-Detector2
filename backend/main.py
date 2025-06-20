from fastapi import FastAPI
from dotenv import load_dotenv
load_dotenv()

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from contextlib import asynccontextmanager
import asyncio

from backend.prisma.client import db
from backend.routes.analyze import router as analyze_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async def keep_db_alive():
        while True:
            try:
                await db.execute_raw("SELECT 1")
                print("✅ DB ping success")
            except Exception as e:
                print(f"⚠️ DB ping failed: {e}")
            await asyncio.sleep(300)  # every 5 minutes

    try:
        await db.connect()
        print("✅ Connected to Prisma")

        # Start keep-alive task in background
        asyncio.create_task(keep_db_alive())

    except Exception as e:
        print(f"⚠️ Prisma connection failed: {e}")

    yield

    try:
        await db.disconnect()
        print("🛑 Disconnected from Prisma")
    except Exception as e:
        print(f"⚠️ Prisma disconnect failed: {e}")


app = FastAPI(lifespan=lifespan)

# Include the analyze router
app.include_router(analyze_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root route
@app.get("/")
def read_root():
    return {"message": "Supplier Risk Detector Backend is running!"}

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Favicon route
@app.get("/favicon.ico")
def favicon():
    return Response(status_code=204)
