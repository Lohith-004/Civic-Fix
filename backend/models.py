from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, 
    ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from backend.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, index=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    country = Column(String(100), default="USA")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    departments = relationship("Department", back_populates="organization")

class Department(Base):
    __tablename__ = "departments"
    id = Column(String, primary_key=True, default=generate_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True)
    description = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=True)
    head_name = Column(String(255), nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="departments")
    categories = relationship("Category", back_populates="department")
    issues = relationship("CivicIssue", back_populates="department")

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    role = Column(String(50), default="CITIZEN", index=True)
    phone = Column(String(50), nullable=True)
    badge_number = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    department_id = Column(String, ForeignKey("departments.id"), nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Category(Base):
    __tablename__ = "categories"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, index=True)
    department_id = Column(String, ForeignKey("departments.id"), nullable=False)
    default_priority = Column(String(50), default="MEDIUM")
    icon = Column(String(50), default="alert-circle")
    description = Column(Text, nullable=True)
    active = Column(Boolean, default=True)

    department = relationship("Department", back_populates="categories")
    issues = relationship("CivicIssue", back_populates="category_rel")

class ServiceArea(Base):
    __tablename__ = "service_areas"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    zone_code = Column(String(50), unique=True, index=True)
    coordinates = Column(JSON, nullable=False)  # GeoJSON polygon
    primary_department_id = Column(String, ForeignKey("departments.id"), nullable=False)
    active = Column(Boolean, default=True)

class CivicIssue(Base):
    __tablename__ = "issues"
    id = Column(String, primary_key=True, default=generate_uuid)
    public_id = Column(String(50), unique=True, index=True, nullable=False)  # CF-2026-XXXXXX
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    category_id = Column(String, ForeignKey("categories.id"), nullable=True)
    status = Column(String(50), default="SUBMITTED", index=True)
    priority = Column(String(50), default="HIGH", index=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500), nullable=False)
    landmark = Column(String(255), nullable=True)
    
    reporter_id = Column(String, ForeignKey("users.id"), nullable=False)
    department_id = Column(String, ForeignKey("departments.id"), nullable=False)
    assigned_officer_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    sla_deadline = Column(DateTime, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    department = relationship("Department", back_populates="issues")
    category_rel = relationship("Category", back_populates="issues")
    images = relationship("IssueImage", back_populates="issue")
    comments = relationship("IssueComment", back_populates="issue")
    status_history = relationship("IssueStatusHistory", back_populates="issue")
    assignments = relationship("IssueAssignment", back_populates="issue")
    escalations = relationship("IssueEscalation", back_populates="issue")

class IssueImage(Base):
    __tablename__ = "issue_images"
    id = Column(String, primary_key=True, default=generate_uuid)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=False)
    url = Column(String(1000), nullable=False)
    image_type = Column(String(50), default="EVIDENCE")  # EVIDENCE, BEFORE, AFTER, INVESTIGATION
    caption = Column(String(500), nullable=True)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    issue = relationship("CivicIssue", back_populates="images")

class IssueComment(Base):
    __tablename__ = "issue_comments"
    id = Column(String, primary_key=True, default=generate_uuid)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    user_name = Column(String(255), nullable=False)
    user_role = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)  # Internal Government Notes
    created_at = Column(DateTime, default=datetime.utcnow)

    issue = relationship("CivicIssue", back_populates="comments")

class IssueStatusHistory(Base):
    __tablename__ = "issue_status_history"
    id = Column(String, primary_key=True, default=generate_uuid)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=False)
    status = Column(String(50), nullable=False)
    changed_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    changed_by_name = Column(String(255), nullable=False)
    changed_by_role = Column(String(50), nullable=False)
    note = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    issue = relationship("CivicIssue", back_populates="status_history")

class IssueAssignment(Base):
    __tablename__ = "issue_assignments"
    id = Column(String, primary_key=True, default=generate_uuid)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=False)
    officer_id = Column(String, ForeignKey("users.id"), nullable=False)
    officer_name = Column(String(255), nullable=False)
    assigned_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    assigned_by_name = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    issue = relationship("CivicIssue", back_populates="assignments")

class IssueEscalation(Base):
    __tablename__ = "issue_escalations"
    id = Column(String, primary_key=True, default=generate_uuid)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=False)
    level = Column(String(50), nullable=False)  # SUPERVISOR, MANAGER, ADMIN
    reason = Column(Text, nullable=False)
    escalated_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    escalated_by_name = Column(String(255), nullable=False)
    status = Column(String(50), default="OPEN")
    timestamp = Column(DateTime, default=datetime.utcnow)

    issue = relationship("CivicIssue", back_populates="escalations")

class SLAPolicy(Base):
    __tablename__ = "sla_policies"
    id = Column(String, primary_key=True, default=generate_uuid)
    priority = Column(String(50), unique=True, nullable=False)
    target_response_hours = Column(Integer, default=4)
    target_resolution_hours = Column(Integer, default=24)
    escalation_warning_threshold_percent = Column(Integer, default=75)
    auto_escalate_on_breach = Column(Boolean, default=True)
    description = Column(Text, nullable=True)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)
    issue_id = Column(String, nullable=True)
    issue_public_id = Column(String, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=generate_uuid)
    actor_id = Column(String, nullable=False)
    actor_name = Column(String(255), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=False)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
