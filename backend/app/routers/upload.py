import json
import re
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter()

SUPPORTED_TYPES = {
    "text/plain": ".txt",
    "text/markdown": ".md",
    "text/x-markdown": ".md",
}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def plain_text_to_tiptap(text: str) -> str:
    """Convert plain text / markdown to Tiptap JSON content."""
    paragraphs = []
    for line in text.splitlines():
        line = line.rstrip()

        # Heading detection (markdown)
        h_match = re.match(r'^(#{1,3})\s+(.*)', line)
        if h_match:
            level = len(h_match.group(1))
            content = h_match.group(2)
            paragraphs.append({
                "type": "heading",
                "attrs": {"level": level},
                "content": [{"type": "text", "text": content}] if content else [],
            })
            continue

        # Bullet list item
        bullet_match = re.match(r'^[-*]\s+(.*)', line)
        if bullet_match:
            content = bullet_match.group(1)
            paragraphs.append({
                "type": "bulletList",
                "content": [{
                    "type": "listItem",
                    "content": [{
                        "type": "paragraph",
                        "content": [{"type": "text", "text": content}] if content else [],
                    }],
                }],
            })
            continue

        # Numbered list item
        num_match = re.match(r'^\d+\.\s+(.*)', line)
        if num_match:
            content = num_match.group(1)
            paragraphs.append({
                "type": "orderedList",
                "content": [{
                    "type": "listItem",
                    "content": [{
                        "type": "paragraph",
                        "content": [{"type": "text", "text": content}] if content else [],
                    }],
                }],
            })
            continue

        # Empty line -> empty paragraph
        paragraphs.append({
            "type": "paragraph",
            "content": [{"type": "text", "text": line}] if line else [],
        })

    return json.dumps({"type": "doc", "content": paragraphs or [{"type": "paragraph"}]})


@router.post("/file", response_model=schemas.DocumentOut, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Validate content type
    content_type = file.content_type or ""
    # Also allow by filename extension
    filename = file.filename or ""
    is_supported = (
        content_type in SUPPORTED_TYPES
        or filename.endswith(".txt")
        or filename.endswith(".md")
    )
    if not is_supported:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Please upload a .txt or .md file.",
        )

    raw = await file.read()
    if len(raw) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 5 MB.")

    text = raw.decode("utf-8", errors="replace")
    title = filename.rsplit(".", 1)[0] if "." in filename else filename
    content = plain_text_to_tiptap(text)

    doc = models.Document(
        title=title or "Imported Document",
        content=content,
        owner_id=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    out = schemas.DocumentOut.model_validate(doc)
    out.is_owner = True
    out.access_role = "owner"
    return out