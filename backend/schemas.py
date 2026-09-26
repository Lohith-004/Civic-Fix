from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "CITIZEN"
    phone: Optional[str] = None
    badge_number: Optional[str] = None
    department_id: Optional[str] = None

class UserCreate(UserBase):
    password: Optional[str] = None

class UserResponse(UserBase):
    id: str
    active: bool
    created_at: datetime
    class Config:
        from_attributes = True

class DepartmentResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    contact_email: str
    contact_phone: Optional[str] = None
    head_name: Optional[str] = None
    active: bool
    class Config:
        from_attributes = True

class IssueCreate(BaseModel):
    title: str
    description: str
    category: str
    priority: Optional[str] = "HIGH"
    latitude: float
    longitude: float
    address: str
    landmark: Optional[str] = None
    department_id: Optional[str] = None
    images: Optional[List[Dict[str, Any]]] = []

class IssueResponse(BaseModel):
    id: str
    public_id: str
    title: str
    description: str
    category: str
    status: str
    priority: str
    latitude: float
    longitude: float
    address: str
    landmark: Optional[str] = None
    reporter_id: str
    department_id: str
    assigned_officer_id: Optional[str] = None
    sla_deadline: datetime
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class StatusTransitionRequest(BaseModel):
    status: str
    note: Optional[str] = None

class AssignOfficerRequest(BaseModel):
    officer_id: str
    notes: Optional[str] = None

class EscalateRequest(BaseModel):
    level: str = "MANAGER"
    reason: str

class CommentCreate(BaseModel):
    content: str
    is_internal: bool = False
