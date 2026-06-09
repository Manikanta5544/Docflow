from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter()


def get_document_with_access(doc_id: str, user: models.User, db: Session):
    """Return document if user is owner or has shared access. Raises 404/403 otherwise."""
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.owner_id == user.id:
        return doc, "owner"

    access = (
        db.query(models.DocumentAccess)
        .filter(
            models.DocumentAccess.document_id == doc_id,
            models.DocumentAccess.user_id == user.id,
        )
        .first()
    )
    if not access:
        raise HTTPException(status_code=403, detail="Access denied")

    return doc, access.role.value


@router.get("", response_model=List[schemas.DocumentSummary])
def list_documents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    owned = db.query(models.Document).filter(models.Document.owner_id == current_user.id).all()
    owned_out = []
    for doc in owned:
        d = schemas.DocumentSummary.model_validate(doc)
        d.is_owner = True
        d.access_role = "owner"
        owned_out.append(d)

    shared_accesses = (
        db.query(models.DocumentAccess)
        .filter(models.DocumentAccess.user_id == current_user.id)
        .all()
    )
    shared_out = []
    for access in shared_accesses:
        d = schemas.DocumentSummary.model_validate(access.document)
        d.is_owner = False
        d.access_role = access.role.value
        shared_out.append(d)

    return owned_out + shared_out


@router.post("", response_model=schemas.DocumentOut, status_code=201)
def create_document(
    doc_in: schemas.DocumentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    doc = models.Document(
        title=doc_in.title,
        content=doc_in.content,
        owner_id=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    out = schemas.DocumentOut.model_validate(doc)
    out.is_owner = True
    out.access_role = "owner"
    return out


@router.get("/{doc_id}", response_model=schemas.DocumentOut)
def get_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    doc, role = get_document_with_access(doc_id, current_user, db)
    out = schemas.DocumentOut.model_validate(doc)
    out.is_owner = role == "owner"
    out.access_role = role
    return out


@router.patch("/{doc_id}", response_model=schemas.DocumentOut)
def update_document(
    doc_id: str,
    doc_in: schemas.DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    doc, role = get_document_with_access(doc_id, current_user, db)

    if role == "viewer":
        raise HTTPException(status_code=403, detail="Viewers cannot edit documents")

    if doc_in.title is not None:
        doc.title = doc_in.title
    if doc_in.content is not None:
        doc.content = doc_in.content

    db.commit()
    db.refresh(doc)

    out = schemas.DocumentOut.model_validate(doc)
    out.is_owner = role == "owner"
    out.access_role = role
    return out


@router.delete("/{doc_id}", status_code=204)
def delete_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    doc = db.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.owner_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or not owner")

    db.delete(doc)
    db.commit()