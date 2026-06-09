# Architecture Note

## Project Overview

DocFlow is a lightweight collaborative document workspace designed to solve a focused subset of the Google Docs workflow.

The objective was not to recreate Google Docs.

The objective was to identify the highest-value functionality, make deliberate scope decisions, and deliver a complete, production-oriented product slice within a constrained implementation window.

The final system supports:

* Rich-text document editing
* Document persistence
* File import
* Document sharing
* Access control
* Version history
* Deployment-ready infrastructure

while maintaining a strong emphasis on simplicity, correctness, and maintainability.

---

# Architecture Goals

The architecture was designed around five primary goals:

1. Fast delivery within a constrained timebox
2. Reliable document persistence
3. Clear access-control boundaries
4. Maintainable full-stack implementation
5. Future extensibility without requiring major rewrites

Every major technical decision was evaluated against those goals.

---

# Technology Stack

## Frontend

### React + TypeScript

React was selected because it provides:

* Fast iteration speed
* Strong ecosystem support
* Component-based architecture
* Predictable state management patterns

TypeScript was used to improve:

* Type safety
* Refactoring confidence
* API contract correctness
* Long-term maintainability

---

## Rich Text Editor

### Tiptap

Several editor options were evaluated:

* Draft.js
* Quill
* Tiptap

Tiptap was selected because:

* It uses ProseMirror internally
* Content is stored as structured JSON
* It has strong extensibility
* Rich-text functionality can be implemented quickly

Most importantly, Tiptap avoids treating documents as raw HTML strings.

---

## Backend

### FastAPI

FastAPI was selected because it provides:

* High developer productivity
* Automatic OpenAPI generation
* Strong typing through Pydantic
* Excellent integration with Python tooling
* Clean API development patterns

For an assessment emphasizing execution speed and engineering quality, FastAPI provided the best signal-to-effort ratio.

---

## Database

### SQLite (Development)

SQLite enables:

* Zero-configuration local setup
* Fast onboarding
* Easy evaluation

### PostgreSQL / Supabase (Production)

PostgreSQL was selected because:

* It is production proven
* Supports future indexing strategies
* Supports future search capabilities
* Integrates cleanly with SQLAlchemy

The application can switch between SQLite and PostgreSQL through environment configuration alone.

No application code changes are required.

---

## Authentication

### JWT Authentication

JWT was selected instead of session-based authentication because:

* It is stateless
* Works well with separated frontend/backend deployments
* Simplifies Vercel + Render hosting
* Avoids session synchronization requirements

Authentication tokens use expiration-based validation and are verified on every protected request.

---

# Document Storage Strategy

One of the most important architectural decisions was how documents are stored.

Two approaches were considered:

### Option 1

Store rendered HTML

### Option 2

Store structured editor JSON

The final implementation stores structured Tiptap JSON.

Example:

```json
{
  "type": "doc",
  "content": [...]
}
```

Reasons:

* Preserves formatting fidelity
* Easier versioning
* Easier future collaboration support
* Easier export support
* Better validation capabilities

Storing HTML would have been simpler initially but creates significantly more long-term complexity.

Structured content is the more maintainable approach.

---

# Access Control Design

Access enforcement is intentionally centralized.

Every protected document operation follows the same authorization flow:

1. Owner validation
2. Shared access lookup
3. Role validation

The frontend displays permission state but does not determine permission state.

All authorization decisions are enforced by the API.

This prevents UI manipulation from bypassing access controls.

---

## Sharing Model

The sharing model supports three roles:

### Owner

Can:

* Read
* Edit
* Share
* Revoke access
* Delete documents

### Editor

Can:

* Read
* Edit
* Save versions

### Viewer

Can:

* Read only

This role model was intentionally kept small.

More complex permission systems introduce substantial implementation complexity while providing little additional evaluation value for this assessment.

---

# Database Design

## Users

```text
users
```

Stores:

* User identity
* Authentication credentials
* Ownership relationships

---

## Documents

```text
documents
```

Stores:

* Title
* Structured content
* Ownership
* Timestamps

---

## Document Access

```text
document_access
```

Stores:

* Shared permissions
* Access role
* User-document relationships

A database-level unique constraint prevents duplicate sharing relationships.

This protects data integrity even under concurrent requests.

---

## Document Versions

```text
document_versions
```

Stores immutable document snapshots.

Each version records:

* Title
* Content snapshot
* Version number
* User
* Timestamp

Snapshots are intentionally immutable.

Historical versions should never change after creation.

---

# Reliability Considerations

Several implementation decisions were made to maximize correctness while keeping complexity appropriate for the scope.

---

## Structured Document Storage

Documents are stored as structured JSON instead of HTML.

Benefits:

* Formatting preservation
* Future diff support
* Easier export pipelines
* Reduced parsing complexity

---

## Authorization

Authorization is always enforced server-side.

Frontend controls improve UX but never determine permissions.

This eliminates a large category of security issues.

---

## Sharing Integrity

Document sharing relationships are protected through:

* Application validation
* Database constraints

This prevents:

* Duplicate access records
* Race-condition inconsistencies
* Permission drift

---

## File Validation

Uploads are validated using:

* Extension validation
* Content type validation
* File size limits

before processing begins.

This keeps the upload workflow predictable and secure.

---

# Prioritization Decisions

The assessment explicitly emphasized product judgment.

Because of that, functionality was prioritized according to:

**User value delivered per implementation hour.**

---

## Highest Priority

### Rich Text Editing

The editor is the primary product surface.

A document platform without a strong editing experience fails regardless of its other capabilities.

This was implemented first.

---

### Persistence

Documents must survive refreshes, logouts, and restarts.

Reliable persistence was treated as a foundational requirement.

---

### Sharing

Sharing is the primary collaboration mechanism.

Role enforcement was implemented at the API layer rather than only in the UI.

---

### Version History

Version history provides meaningful user value while remaining relatively low complexity.

This was chosen over more ambitious collaboration features.

---

# Intentional Scope Cuts

Several features were intentionally excluded.

The goal was depth over breadth.

---

## Real-Time Collaboration

Not implemented.

Reason:

Real-time editing requires:

* Operational transforms
* CRDT synchronization
* Conflict resolution
* Presence systems

These problems are large enough to justify dedicated projects.

Implementing a partial solution would create misleading collaboration behavior.

---

## DOCX Import

Not implemented.

Reason:

DOCX introduces:

* Style mapping
* Embedded media
* Table support
* Formatting inconsistencies

TXT and Markdown import provide the same evaluation signal with significantly less complexity.

---

## PDF Import

Not implemented.

Reason:

Reliable PDF extraction is inconsistent and introduces substantial edge cases.

---

## Comments and Suggestions

Not implemented.

Reason:

These features require additional collaboration models and workflow design.

They were intentionally deferred.

---

## Version Restore

Not implemented.

Reason:

Version viewing is straightforward.

Version restoration introduces product decisions:

* Should restoration overwrite current content?
* Should restoration create a branch?
* Should collaborators be notified?

Without clear requirements, implementing restore would introduce avoidable ambiguity.

---

# What I Would Build Next

Given an additional 2–4 hours, I would prioritize:

### 1. Version Restore

Natural extension of the version history system.

---

### 2. Markdown Export

Leverages the existing structured document model.

---

### 3. Search and Indexing

PostgreSQL full-text search with:

* Ranking
* Filtering
* Content previews

---

### 4. Link Sharing

Token-based sharing links with configurable permissions.

---

### 5. Activity Feed

Document activity history including:

* Last editor
* Sharing events
* Version events

---

# Final Reflection

The strongest solution to this assessment was not maximizing feature count.

It was identifying the most valuable subset of functionality, making deliberate tradeoffs, enforcing correctness in critical workflows, and delivering a complete product slice that could realistically serve as the foundation for a larger collaboration platform.

Every implementation decision was made with that objective in mind.
