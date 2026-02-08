import os
import uvicorn
from pathlib import Path
from dotenv import load_dotenv

from fastapi import FastAPI, APIRouter, Request, status, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

from sqlalchemy.orm import Session

# =====================================================
# 1. ENV LOAD (Render + Local Safe)
# =====================================================
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR.parent / ".env"
load_dotenv(ENV_PATH)

# =====================================================
# 2. DATABASE & MODELS (✅ FIXED IMPORTS)
# =====================================================
from library_backend.database import engine, Base, get_db

from library_backend.models import (
    user_model,
    permission_model,
    library_management_models,
)

# =====================================================
# 3. CONTROLLERS (✅ FIXED IMPORTS)
# =====================================================
from library_backend.controllers import (
    auth_controller,
    google_auth_controller,
    user_controller,
    role_controller,
    profile_controller,
    permission_controller,
    category_controller,
    subcategory_controller,
    language_controller,
    book_copy_controller,
    issue_controller,
    digital_access_controller,
    location_controller,
    log_controller,
    book_permission_controller,
    upload_controller,
    request_user_controller,
    public_user_controller,
    request_controller,
    book_read_controller,
    book_management_controller,
    password_controller,
    post_controller,
    donation_controller,
)

# =====================================================
# 4. SAFE DATABASE INIT
# =====================================================
print("🔍 Checking database connection & tables...")
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database connected & tables verified.")
except Exception as e:
    print("❌ DATABASE ERROR: App starting without DB.")
    print(f"Error Detail: {e}")

# =====================================================
# 5. FASTAPI APP INIT
# =====================================================
app = FastAPI(
    title="BookNest Library API",
    version="6.1.0",
    description="Full-featured Library API (Render + Supabase Ready)",
    docs_url="/docs",
    redoc_url="/redoc",
)

# =====================================================
# 6. CORS
# =====================================================
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

FRONTEND_URL = os.getenv("FRONTEND_URL")
if FRONTEND_URL:
    origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# 7. STATIC FILES
# =====================================================
static_dir = BASE_DIR / "static"
uploads_dir = static_dir / "uploads"
posts_dir = uploads_dir / "posts"

static_dir.mkdir(parents=True, exist_ok=True)
uploads_dir.mkdir(parents=True, exist_ok=True)
posts_dir.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

# =====================================================
# 8. VALIDATION ERROR HANDLER
# =====================================================
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for e in exc.errors():
        inp = e.get("input")
        if isinstance(inp, bytes):
            inp = f"<bytes length={len(inp)}>"
        errors.append({
            "loc": e.get("loc"),
            "msg": e.get("msg"),
            "type": e.get("type"),
            "input": str(inp)[:200]
        })

    print("⚠️ Validation Error:", errors)

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({"detail": errors}),
    )

# =====================================================
# 9. ROUTERS
# =====================================================
api_router = APIRouter(prefix="/api")

api_router.include_router(auth_controller.router, tags=["Auth"])
api_router.include_router(google_auth_controller.router, tags=["Google Auth"])
api_router.include_router(password_controller.router, prefix="/auth", tags=["Password"])

api_router.include_router(profile_controller.router, prefix="/profile", tags=["Profile"])
api_router.include_router(user_controller.router, prefix="/users", tags=["Users"])
api_router.include_router(role_controller.router, prefix="/roles", tags=["Roles"])
api_router.include_router(permission_controller.router, prefix="/permissions", tags=["Permissions"])

api_router.include_router(category_controller.router, prefix="/categories")
api_router.include_router(subcategory_controller.router, prefix="/subcategories")
api_router.include_router(language_controller.router, prefix="/languages")
api_router.include_router(location_controller.router, prefix="/locations")
api_router.include_router(book_copy_controller.router, prefix="/copies")
api_router.include_router(upload_controller.router, prefix="/upload")

api_router.include_router(issue_controller.router, prefix="/issues")
api_router.include_router(request_controller.router, prefix="/requests")
api_router.include_router(request_user_controller.router, prefix="/restricted-requests")

api_router.include_router(book_permission_controller.router, prefix="/book-permissions")
api_router.include_router(digital_access_controller.router, prefix="/digital-access")
api_router.include_router(log_controller.router, prefix="/logs")

api_router.include_router(public_user_controller.router, prefix="/public")
api_router.include_router(book_read_controller.router, prefix="/books")
api_router.include_router(book_management_controller.router, prefix="/books")
api_router.include_router(post_controller.router, prefix="/posts")
api_router.include_router(donation_controller.router, prefix="/donations")

app.include_router(api_router)

# =====================================================
# 10. HEALTH
# =====================================================
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "BookNest API"}

# =====================================================
# 11. ENTRY POINT (Local only)
# =====================================================
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "library_backend.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )
