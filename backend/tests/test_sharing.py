"""
Meaningful integration test: document sharing permission flow.

Covers:
- Owner creates document
- Owner shares with another user
- Shared user can read the document
- Viewer cannot edit (role enforcement)
- Unrelated user gets 403
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# In-memory SQLite for tests
TEST_DATABASE_URL = "sqlite:///./test_docflow.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


def register_and_login(email: str, name: str, password: str = "testpass123"):
    r = client.post("/api/auth/register", json={"email": email, "name": name, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


class TestSharingFlow:
    def test_owner_can_create_and_read(self):
        token = register_and_login("owner@test.com", "Owner")
        r = client.post(
            "/api/documents",
            json={"title": "Test Doc", "content": '{"type":"doc","content":[]}'},
            headers=auth_headers(token),
        )
        assert r.status_code == 201
        doc = r.json()
        assert doc["title"] == "Test Doc"
        assert doc["is_owner"] is True

    def test_shared_editor_can_read_document(self):
        owner_token = register_and_login("owner2@test.com", "Owner")
        editor_token = register_and_login("editor@test.com", "Editor")

        # Create document as owner
        r = client.post(
            "/api/documents",
            json={"title": "Shared Doc"},
            headers=auth_headers(owner_token),
        )
        doc_id = r.json()["id"]

        # Share with editor
        r = client.post(
            f"/api/sharing/{doc_id}/share",
            json={"email": "editor@test.com", "role": "editor"},
            headers=auth_headers(owner_token),
        )
        assert r.status_code == 200

        # Editor can read
        r = client.get(f"/api/documents/{doc_id}", headers=auth_headers(editor_token))
        assert r.status_code == 200
        assert r.json()["access_role"] == "editor"

    def test_viewer_cannot_edit_document(self):
        owner_token = register_and_login("owner3@test.com", "Owner")
        viewer_token = register_and_login("viewer@test.com", "Viewer")

        r = client.post("/api/documents", json={"title": "View Only"}, headers=auth_headers(owner_token))
        doc_id = r.json()["id"]

        # Share as viewer
        client.post(
            f"/api/sharing/{doc_id}/share",
            json={"email": "viewer@test.com", "role": "viewer"},
            headers=auth_headers(owner_token),
        )

        # Viewer attempts edit
        r = client.patch(
            f"/api/documents/{doc_id}",
            json={"title": "Hijacked Title"},
            headers=auth_headers(viewer_token),
        )
        assert r.status_code == 403

    def test_unrelated_user_cannot_access_document(self):
        owner_token = register_and_login("owner4@test.com", "Owner")
        other_token = register_and_login("other@test.com", "Other")

        r = client.post("/api/documents", json={"title": "Private Doc"}, headers=auth_headers(owner_token))
        doc_id = r.json()["id"]

        r = client.get(f"/api/documents/{doc_id}", headers=auth_headers(other_token))
        assert r.status_code == 403

    def test_owner_can_revoke_access(self):
        owner_token = register_and_login("owner5@test.com", "Owner")
        editor_token = register_and_login("editor2@test.com", "Editor")

        r = client.post("/api/documents", json={"title": "Revoke Test"}, headers=auth_headers(owner_token))
        doc_id = r.json()["id"]

        r = client.post(
            f"/api/sharing/{doc_id}/share",
            json={"email": "editor2@test.com", "role": "editor"},
            headers=auth_headers(owner_token),
        )
        access_id = r.json()["id"]

        # Revoke
        r = client.delete(f"/api/sharing/{doc_id}/access/{access_id}", headers=auth_headers(owner_token))
        assert r.status_code == 204

        # Access should now be denied
        r = client.get(f"/api/documents/{doc_id}", headers=auth_headers(editor_token))
        assert r.status_code == 403

    def test_document_list_shows_owned_and_shared(self):
        owner_token = register_and_login("owner6@test.com", "Owner")
        shared_token = register_and_login("shared@test.com", "Shared")

        r = client.post("/api/documents", json={"title": "My Doc"}, headers=auth_headers(owner_token))
        doc_id = r.json()["id"]

        client.post(
            f"/api/sharing/{doc_id}/share",
            json={"email": "shared@test.com", "role": "editor"},
            headers=auth_headers(owner_token),
        )

        # Shared user's list should contain the document
        r = client.get("/api/documents", headers=auth_headers(shared_token))
        assert r.status_code == 200
        docs = r.json()
        assert any(d["id"] == doc_id for d in docs)
        shared_doc = next(d for d in docs if d["id"] == doc_id)
        assert shared_doc["is_owner"] is False