from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    Enum,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid
import enum


def gen_uuid():
    return str(uuid.uuid4())


class AccessRole(str, enum.Enum):
    viewer = "viewer"
    editor = "editor"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owned_documents = relationship(
        "Document",
        back_populates="owner",
        cascade="all, delete-orphan",
    )

    shared_accesses = relationship(
        "DocumentAccess",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=gen_uuid)

    title = Column(
        String(255),
        nullable=False,
        default="Untitled Document",
    )

    content = Column(
        Text,
        nullable=False,
        default='{"type":"doc","content":[{"type":"paragraph"}]}',
    )

    owner_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    owner = relationship(
        "User",
        back_populates="owned_documents",
    )

    shared_accesses = relationship(
        "DocumentAccess",
        back_populates="document",
        cascade="all, delete-orphan",
    )

    versions = relationship(
        "DocumentVersion",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="DocumentVersion.created_at.desc()",
    )


class DocumentAccess(Base):
    __tablename__ = "document_access"

    __table_args__ = (
        UniqueConstraint(
            "document_id",
            "user_id",
            name="uq_document_user_access",
        ),
    )

    id = Column(String, primary_key=True, default=gen_uuid)

    document_id = Column(
        String,
        ForeignKey("documents.id"),
        nullable=False,
    )

    user_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False,
    )

    role = Column(
        Enum(AccessRole),
        nullable=False,
        default=AccessRole.editor,
    )

    granted_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    document = relationship(
        "Document",
        back_populates="shared_accesses",
    )

    user = relationship(
        "User",
        back_populates="shared_accesses",
    )


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(String, primary_key=True, default=gen_uuid)

    document_id = Column(
        String,
        ForeignKey("documents.id"),
        nullable=False,
    )

    title = Column(String(255), nullable=False)

    content = Column(
        Text,
        nullable=False,
    )

    saved_by_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False,
    )

    version_number = Column(
        String,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    document = relationship(
        "Document",
        back_populates="versions",
    )

    saved_by = relationship("User")