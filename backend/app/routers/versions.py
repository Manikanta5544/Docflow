from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter()


def _check_access(doc_id: str, user: models.User, db: Session):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.owner_id == user.id:
        return doc
    access = db.query(models.DocumentAccess).filter(
        models.DocumentAccess.document_id == doc_id,
        models.DocumentAccess.user_id == user.id,
    ).first()
    if not access:
        raise HTTPException(status_code=403, detail="Access denied")
    return doc


@router.post("/{doc_id}/save-version", response_model=schemas.VersionOut)
def save_version(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    doc = _check_access(doc_id, current_user, db)

    # Count existing versions
    count = db.query(func.count(models.DocumentVersion.id)).filter(
        models.DocumentVersion.document_id == doc_id
    ).scalar()

    version = models.DocumentVersion(
        document_id=doc_id,
        title=doc.title,
        content=doc.content,
        saved_by_id=current_user.id,
        version_number=f"v{count + 1}",
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


@router.get("/{doc_id}/versions", response_model=List[schemas.VersionOut])
def list_versions(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _check_access(doc_id, current_user, db)
    return (
        db.query(models.DocumentVersion)
        .filter(models.DocumentVersion.document_id == doc_id)
        .order_by(models.DocumentVersion.created_at.desc())
        .all()
    )


@router.get("/{doc_id}/versions/{version_id}", response_model=schemas.VersionDetail)
def get_version(
    doc_id: str,
    version_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _check_access(doc_id, current_user, db)
    version = db.query(models.DocumentVersion).filter(
        models.DocumentVersion.id == version_id,
        models.DocumentVersion.document_id == doc_id,
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version