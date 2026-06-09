from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, documents, sharing, versions, upload
from app.database import engine, Base

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="DocFlow API", version="1.0.0")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(sharing.router, prefix="/api/sharing", tags=["sharing"])
app.include_router(versions.router, prefix="/api/versions", tags=["versions"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])


@app.get("/health")
def health():
    return {"status": "ok"}