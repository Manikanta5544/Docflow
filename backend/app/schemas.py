from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models import AccessRole


# Auth schemas
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# Document schemas
class DocumentCreate(BaseModel):
    title: Optional[str] = "Untitled Document"
    content: Optional[str] = '{"type":"doc","content":[{"type":"paragraph"}]}'


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class DocumentOut(BaseModel):
    id: str
    title: str
    content: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    owner: UserOut
    is_owner: Optional[bool] = True
    access_role: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentSummary(BaseModel):
    id: str
    title: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    owner: UserOut
    is_owner: bool
    access_role: Optional[str] = None

    class Config:
        from_attributes = True


# Sharing schemas
class ShareRequest(BaseModel):
    email: EmailStr
    role: AccessRole = AccessRole.editor


class AccessOut(BaseModel):
    id: str
    document_id: str
    user: UserOut
    role: str
    granted_at: datetime

    class Config:
        from_attributes = True


# Version schemas
class VersionOut(BaseModel):
    id: str
    document_id: str
    title: str
    version_number: str
    saved_by: UserOut
    created_at: datetime

    class Config:
        from_attributes = True


class VersionDetail(VersionOut):
    content: str