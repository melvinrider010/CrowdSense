import logging
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.errors import register_error_handlers
from app.core.auth import decode_token
from app.core.websocket import manager
from app.database.database import engine, get_db
from app.database.models import Base
from app.api.auth import router as auth_router
from app.api.events import router as events_router
from app.api.notifications import router as notifications_router
from app.api.devices import router as devices_router
from app.api.reports import router as reports_router

logger = logging.getLogger("app.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup structured logging
    setup_logging()
    logger.info("Initializing CrowdSense AI Backend Application...")
    
    # Automatic database table creation
    try:
        logger.info("Verifying and creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.critical(f"Failed to initialize database tables: {e}", exc_info=True)
        
    yield
    logger.info("Shutting down CrowdSense AI Backend Application...")

app = FastAPI(
    title="CrowdSense API",
    version="1.0.0",
    lifespan=lifespan
)

# Register CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register central error handlers
register_error_handlers(app)

# Include API routes
app.include_router(auth_router)
app.include_router(events_router)
app.include_router(notifications_router)
app.include_router(devices_router)
app.include_router(reports_router)

@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket, token: Optional[str] = None):
    # Verify JWT if token query parameter is present (RBAC requirement)
    if token:
        try:
            payload = decode_token(token)
            if payload.get("type") != "access":
                await websocket.close(code=4003) # Policy Violation / Forbidden
                return
        except Exception:
            await websocket.close(code=4003)
            return

    await manager.connect(websocket)
    try:
        while True:
            # Maintain connection and listen for client heartbeats or messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
def root():
    return {
        "project": "CrowdSense AI",
        "status": "Running",
        "environment": settings.ENV
    }

@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        # Run a simple query to verify database connection health
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = f"unhealthy: {str(e)}"
        
    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
        "environment": settings.ENV
    }