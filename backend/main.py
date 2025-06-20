from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response

from backend.routes.analyze import router as analyze_router
from contextlib import asynccontextmanager
from backend.prisma.client import db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    print("✅ Connected to Prisma")
    yield
    await db.disconnect()
    print("🛑 Disconnected from Prisma")

app = FastAPI(lifespan=lifespan)
app.include_router(analyze_router)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root route
@app.get("/")
def read_root():
    return {"message": "Supplier Risk Detector Backend is running!"}

# Favicon route
@app.get("/favicon.ico")
def favicon():
    return Response(status_code=204)

# Health check endpoint
@app.get("/api/health")
def health_check():
    return {"status": "OK"}
