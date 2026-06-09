from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter()


@router.post("/{doc_id}/share", response_model=schemas.AccessOut)
def share_document(
    doc_id: str,
    share_in: schemas.ShareRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Only owner can share
    doc = db.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.owner_id == current_user.id,
    ).first()

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document not found or you are not the owner",
        )

    # Find target user
    target = db.query(models.User).filter(
        models.User.email == share_in.email
    ).first()

    if not target:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if target.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot share a document with yourself",
        )

    # Check if already shared
    existing = db.query(models.DocumentAccess).filter(
        models.DocumentAccess.document_id == doc_id,
        models.DocumentAccess.user_id == target.id,
    ).first()

    if existing:
        # Update role if already exists
        existing.role = share_in.role
        db.commit()
        db.refresh(existing)
        return existing

    access = models.DocumentAccess(
        document_id=doc_id,
        user_id=target.id,
        role=share_in.role,
    )

    try:
        db.add(access)
        db.commit()
        db.refresh(access)
        return access

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="User already has access to this document",
        )


@router.get("/{doc_id}/access", response_model=List[schemas.AccessOut])
def list_access(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    doc = db.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.owner_id == current_user.id,
    ).first()

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document not found or not owner",
        )

    return db.query(models.DocumentAccess).filter(
        models.DocumentAccess.document_id == doc_id
    ).all()


@router.delete("/{doc_id}/access/{access_id}", status_code=204)
def revoke_access(
    doc_id: str,
    access_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    doc = db.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.owner_id == current_user.id,
    ).first()

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document not found or not owner",
        )

    access = db.query(models.DocumentAccess).filter(
        models.DocumentAccess.id == access_id,
        models.DocumentAccess.document_id == doc_id,
    ).first()

    if not access:
        raise HTTPException(
            status_code=404,
            detail="Access record not found",
        )

    db.delete(access)
    db.commit()