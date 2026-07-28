import logging
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from app.schemas.event import CrowdEvent
from app.database.database import get_db
from app.database.models import Event, Device
from app.core.auth import get_current_user, decode_token, RoleChecker
from app.core.config import settings
from app.core.websocket import manager
from app.core.notifications import create_system_notification
from datetime import datetime
from typing import List, Optional

logger = logging.getLogger("app.events")
router = APIRouter(prefix="/api/events", tags=["Events"])

# Custom dependency to authenticate either IoT devices or Users
async def verify_device_or_user(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db)
):
    # 1. Device Key Authentication
    if x_api_key and x_api_key == settings.DEVICE_API_KEY:
        return "device"

    # 2. JWT User Authentication fallback
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = decode_token(token)
            if payload.get("type") == "access":
                role = payload.get("role")
                if role in ["Admin", "Operator"]:
                    return "user"
        except Exception:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized. Provide a valid X-API-Key header or Bearer JWT token."
    )

@router.post("/")
async def receive_event(
    event: CrowdEvent, 
    auth_type: str = Depends(verify_device_or_user), 
    db: Session = Depends(get_db)
):
    logger.info(f"Incoming event from {event.device_id} (Auth: {auth_type})")
    
    if event.timestamp is None:
        event.timestamp = datetime.utcnow()

    # Dynamic auto-registration of device if not exists
    device = db.query(Device).filter(Device.device_id == event.device_id, Device.is_deleted == False).first()
    if not device:
        logger.info(f"Auto-registering new device {event.device_id} reporting from {event.location}")
        device = Device(
            device_id=event.device_id,
            status="ACTIVE",
            location=event.location or "Unknown"
        )
        db.add(device)
        db.commit()
        db.refresh(device)

    # Insert event
    db_event = Event(
        device_id=event.device_id,
        distance=event.distance,
        status=event.status,
        location=event.location,
        timestamp=event.timestamp
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    # Trigger notifications for risk or warning states
    if db_event.status in ["STAMPEDE_RISK", "STAMPEDE_WARNING"]:
        try:
            create_system_notification(
                db=db,
                title=f"Critical {db_event.status.replace('_', ' ')}",
                message=f"Device {db_event.device_id} registered crowd compression at {db_event.location}. Sensor distance: {db_event.distance}cm.",
                device_id=device.id,
                event_id=db_event.id
            )
        except Exception as e:
            logger.error(f"Failed to generate system notification: {e}", exc_info=True)

    # Broadcast event JSON to connected WebSocket clients in real-time
    event_data = {
        "id": db_event.id,
        "device_id": db_event.device_id,
        "distance": db_event.distance,
        "status": db_event.status,
        "location": db_event.location,
        "timestamp": db_event.timestamp.isoformat() if db_event.timestamp else None
    }
    await manager.broadcast(event_data)

    return {
        "message": "Event received and persisted successfully",
        "event": event_data
    }

@router.get("/", response_model=List[CrowdEvent], dependencies=[Depends(RoleChecker(["Admin", "Operator", "Viewer"]))])
async def get_events(db: Session = Depends(get_db)):
    db_events = db.query(Event).filter(Event.is_deleted == False).order_by(Event.timestamp.desc()).all()
    return db_events