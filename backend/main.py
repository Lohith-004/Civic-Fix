from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import logging
from backend.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("civicfix")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Autonomous Civic Issue Reporting & Resolution Platform API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "service": "CivicFix API Engine",
        "tagline": "Report it. Track it. Fix it.",
        "status": "online",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "database": "connected",
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get("/ready")
def readiness_check():
    return {"ready": True}
