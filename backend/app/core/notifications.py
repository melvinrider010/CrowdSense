import logging
from sqlalchemy.orm import Session
from app.database.models import Notification
from typing import Optional

logger = logging.getLogger("app.notifications")

def send_email_notification(subject: str, body: str):
    logger.info(f"== EMAIL NOTIFICATION DISPATCHED ==")
    logger.info(f"Subject: {subject}")
    logger.info(f"Message: {body}")
    logger.info(f"====================================")
    # Stubs SMTP parameters if needed. In development it prints to system logs.

def create_system_notification(
    db: Session, 
    title: str, 
    message: str, 
    device_id: Optional[int] = None, 
    event_id: Optional[int] = None
) -> Notification:
    notification = Notification(
        title=title,
        message=message,
        device_id=device_id,
        event_id=event_id,
        is_read=False
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    # Broadcast email notification
    send_email_notification(f"CrowdSense - {title}", message)
    return notification
