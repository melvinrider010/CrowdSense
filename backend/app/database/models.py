from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class SoftDeleteMixin:
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)

class User(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="Viewer", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

class Location(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    
    # Relationships
    devices = relationship("Device", back_populates="location_ref")
    events = relationship("Event", back_populates="location_ref")

class Device(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), unique=True, index=True, nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    location_ref = relationship("Location", back_populates="devices")
    events = relationship("Event", back_populates="device_ref")
    notifications = relationship("Notification", back_populates="device_ref")

class Event(Base, SoftDeleteMixin):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), ForeignKey("devices.device_id", ondelete="SET NULL"), nullable=True, index=True)
    distance = Column(Float, nullable=False)
    status = Column(String(50), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Fallback string location for unmapped events
    location = Column(String(100), nullable=True)
    
    # Relationships
    device_ref = relationship("Device", back_populates="events")
    location_ref = relationship("Location", back_populates="events")
    notifications = relationship("Notification", back_populates="event_ref")

class Notification(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    device_id = Column(Integer, ForeignKey("devices.id", ondelete="SET NULL"), nullable=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    device_ref = relationship("Device", back_populates="notifications")
    event_ref = relationship("Event", back_populates="notifications")

class AuditLog(Base, SoftDeleteMixin):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")