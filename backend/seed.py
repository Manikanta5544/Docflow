"""
Seed demo users and a sample document.
Run: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app import models
from app.auth import hash_password

Base.metadata.create_all(bind=engine)

USERS = [
    {"email": "owner@docflow.dev", "name": "Alice Owner", "password": "password123"},
    {"email": "editor@docflow.dev", "name": "Bob Editor", "password": "password123"},
    {"email": "viewer@docflow.dev", "name": "Carol Viewer", "password": "password123"},
]

SAMPLE_DOC_CONTENT = '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Welcome to DocFlow"}]},{"type":"paragraph","content":[{"type":"text","text":"This is a sample document. Try editing, sharing, or uploading your own files."}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Create new documents from the dashboard"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Upload .txt or .md files to import content"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Share with other users by email"}]}]}]}]}'


def seed():
    db = SessionLocal()
    try:
        created_users = []
        for u in USERS:
            existing = db.query(models.User).filter(models.User.email == u["email"]).first()
            if existing:
                print(f"  User {u['email']} already exists, skipping")
                created_users.append(existing)
            else:
                user = models.User(
                    email=u["email"],
                    name=u["name"],
                    password_hash=hash_password(u["password"]),
                )
                db.add(user)
                db.flush()
                created_users.append(user)
                print(f"  Created user: {u['email']}")

        db.commit()

        # Create sample document owned by Alice
        alice = created_users[0]
        existing_doc = db.query(models.Document).filter(
            models.Document.owner_id == alice.id,
            models.Document.title == "Welcome to DocFlow",
        ).first()

        if not existing_doc:
            doc = models.Document(
                title="Welcome to DocFlow",
                content=SAMPLE_DOC_CONTENT,
                owner_id=alice.id,
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)
            print(f"  Created sample document: {doc.id}")

            # Share with Bob as editor
            bob = created_users[1]
            access = models.DocumentAccess(
                document_id=doc.id,
                user_id=bob.id,
                role=models.AccessRole.editor,
            )
            db.add(access)
            db.commit()
            print(f"  Shared document with Bob as editor")

        print("\nSeed complete!")
        print("\nDemo credentials:")
        for u in USERS:
            print(f"  {u['email']} / {u['password']}")

    finally:
        db.close()


if __name__ == "__main__":
    seed()