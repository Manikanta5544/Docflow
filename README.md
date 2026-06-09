# DocFlow — Collaborative Document Workspace

A lightweight, production-oriented collaborative document editor built as part of the Ajaia AI-Native Full Stack Developer Assessment.

DocFlow focuses on the core document collaboration workflow: creating documents, editing rich text, importing content, sharing with collaborators, maintaining version history, and enforcing access permissions.

---

## Live Demo

**Frontend:** https://[docflow-git-main-manikanta5544s-projects.vercel.app](https://docflow-git-main-manikanta5544s-projects.vercel.app)

**Backend API:** https://[https://docflow-s627.onrender.com](https://docflow-s627.onrender.com)

Replace the URLs above with your deployed environments.

---

# Demo Credentials

| Account | Email                                           | Password    | Role   |
| ------- | ----------------------------------------------- | ----------- | ------ |
| Alice   | [owner@docflow.dev](mailto:owner@docflow.dev)   | password123 | Owner  |
| Bob     | [editor@docflow.dev](mailto:editor@docflow.dev) | password123 | Editor |
| Carol   | [viewer@docflow.dev](mailto:viewer@docflow.dev) | password123 | Viewer |

The seeded environment includes a sample document owned by Alice and shared with Bob as an editor.

This allows reviewers to immediately test ownership, sharing, editing permissions, and access control flows.

---

# Key Features

## Authentication

* User registration
* User login
* JWT-based authentication
* Protected application routes
* Persistent sessions

---

## Document Management

* Create documents
* Rename documents
* Delete documents
* Rich text editing
* Auto-save support
* Persistent document storage

---

## Rich Text Editing

Built using Tiptap.

Supported formatting:

* Bold
* Italic
* Underline
* Headings (H1–H3)
* Bullet Lists
* Numbered Lists
* Undo / Redo

Document content is stored as structured editor JSON rather than raw HTML.

This preserves formatting fidelity and provides a better foundation for future versioning, export, and collaboration features.

---

## File Import

Supported file types:

| Type  | Supported |
| ----- | --------- |
| .txt  | ✅         |
| .md   | ✅         |
| .docx | ❌         |
| .pdf  | ❌         |

Import behavior:

* Upload file
* Parse content
* Convert to Tiptap document structure
* Create editable document automatically

Markdown headings and lists are converted into rich text blocks.

Unsupported file types are rejected with clear validation messages.

---

## Sharing

Document owners can share documents with registered users by email.

Supported roles:

### Owner

* Full control
* Share access
* Revoke access
* Delete documents

### Editor

* Read documents
* Edit documents
* Save versions

### Viewer

* Read-only access

Sharing protections:

* Cannot share with yourself
* Duplicate sharing prevented
* Ownership enforced server-side
* Role permissions enforced server-side

---

## Version History

Users can manually create document snapshots.

Capabilities:

* Save version
* Browse version history
* View historical content

Version entries include:

* Version number
* Document title
* Timestamp
* User who saved the version

Version restore was intentionally left out of scope to prioritize correctness over partially implemented functionality.

---

## Persistence

Data persists across refreshes and application restarts.

Supported databases:

### Development

SQLite

### Production

PostgreSQL / Supabase

The application automatically adapts based on the configured `DATABASE_URL`.

---

## Automated Testing

The project includes integration tests covering the most security-sensitive workflow in the system.

Covered scenarios:

* Document creation
* Sharing permissions
* Viewer restrictions
* Access revocation
* Ownership enforcement
* Shared document visibility

Run tests:

```bash
pytest tests/ -v
```

---

# Environment Variables

## Backend

Create a `.env` file inside the backend directory.

Development:

```env
DATABASE_URL=sqlite:///./docflow.db

SECRET_KEY=replace-with-a-long-random-secret

ALLOWED_ORIGINS=http://localhost:5173
```

Production:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME

SECRET_KEY=your-production-secret

ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
```

---

## Frontend

Create a `.env` file inside the frontend directory.

Development:

```env
VITE_API_URL=http://localhost:8000/api
```

Production:

```env
VITE_API_URL=https://your-backend-domain.onrender.com/api
```

---

# Local Development

## Prerequisites

* Python 3.11+
* Node.js 18+
* npm
* Git

Optional:

* PostgreSQL

SQLite is used by default.

---

## Backend Setup

```bash
cd backend

pip install -r requirements.txt

cp .env.example .env

python seed.py

uvicorn app.main:app --reload --port 8000
```

API:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Application:

```text
http://localhost:5173
```

---

# Production Deployment

## Backend (Render)

Build Command:

```bash
pip install -r requirements.txt && python seed.py
```

Start Command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Required Environment Variables:

```env
DATABASE_URL=
SECRET_KEY=
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
```

---

## Frontend (Vercel)

Framework Preset:

```text
Vite
```

Environment Variables:

```env
VITE_API_URL=https://your-backend-domain.onrender.com/api
```

---

## Database (Supabase)

1. Create project
2. Obtain PostgreSQL connection string
3. Configure DATABASE_URL
4. Deploy backend

Tables are automatically created by SQLAlchemy on startup.

---

# Security & Reliability

* Passwords stored using bcrypt hashing
* JWT authentication
* Server-side authorization enforcement
* Role-based access control
* Duplicate sharing protection through application logic and database constraints
* File type validation
* File size validation
* Structured document storage
* Integration-tested permission flows
* Environment-based configuration

---

# Project Structure

```text
docflow/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── documents.py
│   │   │   ├── sharing.py
│   │   │   ├── upload.py
│   │   │   └── versions.py
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── tests/
│   │   └── test_sharing.py
│   ├── seed.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── .env.example
└── docs/
|    ├── ARCHITECTURE.md
|    ├── AI_WORKFLOW.md
|    └── SUBMISSION.md
└── README.md
```

---

# Known Scope Decisions

The objective was not to recreate Google Docs.

The objective was to deliver the strongest coherent product slice within the assessment constraints.

Intentionally excluded:

* Real-time collaboration
* Operational transforms
* CRDT synchronization
* DOCX import
* PDF import
* Comments
* Suggestion mode
* Link sharing
* Version restore

These decisions were made to maximize product quality, reliability, and implementation depth within the allotted time.

---

# Future Improvements

Given an additional 2–4 hours:

1. Version Restore
2. Markdown Export
3. Search & Indexing
4. Link Sharing
5. Activity Feed
6. Real-time Presence Indicators

---

Built for the Ajaia AI-Native Full Stack Developer Assessment.
