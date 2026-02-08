import os
import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, Request, status, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import text

# =====================================================
# 1. SETUP LOGGING & ENV
# =====================================================
# Configure Logging (Better than print statements)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Load Environment Variables
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR.parent / ".env"
load_dotenv(ENV_PATH)

# =====================================================
# 2. DATABASE IMPORTS
# =====================================================
from database import engine, Base, get_db
from models import (
    user_model,
    permission_model,
    library_management_models,
)

# =====================================================
# 3. CONTROLLER IMPORTS
# =====================================================
from controllers import (
    auth_controller, google_auth_controller, user_controller, role_controller,
    profile_controller, permission_controller, category_controller, subcategory_controller,
    language_controller, book_copy_controller, issue_controller, digital_access_controller,
    location_controller, log_controller, book_permission_controller, upload_controller,
    request_user_controller, public_user_controller, request_controller, book_read_controller,
    book_management_controller, password_controller, post_controller, donation_controller
)

# =====================================================
# 4. LIFESPAN MANAGER (Modern Startup/Shutdown)
# =====================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown events.
    Checks DB connection and creates tables before accepting requests.
    """
    logger.info("🔄 Starting Application...")
    
    # Check Database Connection
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        # Verify connection with a simple query
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("✅ Database connected & tables verified.")
    except Exception as e:
        logger.critical(f"❌ DATABASE CRITICAL ERROR: {str(e)}")
        # We don't exit here to allow debugging, but the app is likely unstable
    
    yield  # Application runs here
    
    logger.info("🛑 Application Shutting Down...")

# =====================================================
# 5. FASTAPI APP INIT
# =====================================================
app = FastAPI(
    title="BookNest Library API",
    version="6.2.0",
    description="Full-featured Library API (Local + Supabase Ready)",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan  # Injecting lifespan logic
)

# =====================================================
# 6. MIDDLEWARE CONFIGURATION
# =====================================================

# A. Trusted Host (Security Header)
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["*"] # Change to specific domain in production
)

# B. CORS Setup
origins = [
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:5174", "http://127.0.0.1:5174",
    "http://localhost:3000", "http://127.0.0.1:3000",
]

# Add FRONTEND_URL from env if it exists
env_frontend = os.getenv("FRONTEND_URL")
if env_frontend:
    origins.append(env_frontend)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# 7. STATIC FILES & DIRECTORIES
# =====================================================
static_dir = BASE_DIR / "static"
uploads_dir = static_dir / "uploads"
posts_dir = uploads_dir / "posts"

# Create directories if missing
for directory in [static_dir, uploads_dir, posts_dir]:
    directory.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

# =====================================================
# 8. EXCEPTION HANDLERS
# =====================================================
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_details = []
    try:
        for error in exc.errors():
            input_repr = error.get("input")
            # Safe input representation
            if isinstance(input_repr, bytes):
                input_repr = f"<bytes, len={len(input_repr)}>"
            elif input_repr and not isinstance(input_repr, (str, int, float, bool, list, dict)):
                input_repr = str(input_repr)

            error_details.append({
                "loc": error.get("loc"),
                "msg": error.get("msg"),
                "type": error.get("type"),
                "input_preview": str(input_repr)[:100] if input_repr else "N/A"
            })
        
        logger.warning(f"⚠️ Validation Error on {request.url.path}: {error_details}")

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=jsonable_encoder({"detail": error_details, "message": "Validation Failed"}),
        )
    except Exception as e:
        logger.error(f"Error inside validation handler: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error during validation."}
        )

# =====================================================
# 9. ROUTER REGISTRATION
# =====================================================
api_router = APIRouter(prefix="/api")

# -- Auth --
api_router.include_router(auth_controller.router, tags=["Authentication"])
api_router.include_router(google_auth_controller.router, tags=["Google Auth"])
api_router.include_router(password_controller.router, prefix="/auth", tags=["Password Reset"])

# -- Users & Roles --
api_router.include_router(profile_controller.router, prefix="/profile", tags=["Profile"])
api_router.include_router(user_controller.router, prefix="/users", tags=["Users"])
api_router.include_router(role_controller.router, prefix="/roles", tags=["Roles"])
api_router.include_router(permission_controller.router, prefix="/permissions", tags=["Permissions"])

# -- Library Resources --
api_router.include_router(category_controller.router, prefix="/categories", tags=["Categories"])
api_router.include_router(subcategory_controller.router, prefix="/subcategories", tags=["Subcategories"])
api_router.include_router(language_controller.router, prefix="/languages", tags=["Languages"])
api_router.include_router(location_controller.router, prefix="/locations", tags=["Locations"])
api_router.include_router(book_copy_controller.router, prefix="/copies", tags=["Book Copies"])
api_router.include_router(upload_controller.router, prefix="/upload", tags=["Uploads"])

# -- Core Operations --
api_router.include_router(issue_controller.router, prefix="/issues", tags=["Issues (Circulation)"])
api_router.include_router(request_controller.router, prefix="/requests", tags=["Requests (Admin)"])
api_router.include_router(request_user_controller.router, prefix="/restricted-requests", tags=["Requests (User)"])

# -- Access & Logs --
api_router.include_router(book_permission_controller.router, prefix="/book-permissions", tags=["Book Permissions"])
api_router.include_router(digital_access_controller.router, prefix="/digital-access", tags=["Digital Access"])
api_router.include_router(log_controller.router, prefix="/logs", tags=["System Logs"])

# -- Public & News --
api_router.include_router(public_user_controller.router, prefix="/public", tags=["Public Actions"])
api_router.include_router(book_read_controller.router, prefix="/books", tags=["Books (Read)"])
api_router.include_router(book_management_controller.router, prefix="/books", tags=["Books (Manage)"])
api_router.include_router(post_controller.router, prefix="/posts", tags=["Markaz News"])
api_router.include_router(donation_controller.router, tags=["Donations"])

# Register the aggregated router
app.include_router(api_router)

# =====================================================
# 10. UTILITY & SETUP ENDPOINTS
# =====================================================

@app.get("/", include_in_schema=False)
def root():
    return {"message": "Welcome to BookNest Library API. Visit /docs for Swagger UI."}

@app.get("/api/health", tags=["System"])
def health_check():
    """Simple Health Check"""
    return {"status": "ok", "version": app.version}

@app.get("/api/debug/nuke-issues", tags=["Debug"])
def nuke_issues(db: Session = Depends(get_db)):
    """
    ⚠️ DANGER: Deletes all issued books. 
    Ideally protect this with an Admin dependency.
    """
    try:
        from models.library_management_models import IssuedBook
        deleted_count = db.query(IssuedBook).delete()
        db.commit()
        logger.warning(f"⚠️ Nuked {deleted_count} issue records via API.")
        return {"message": f"Successfully deleted {deleted_count} corrupt issue records."}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to nuke issues: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/setup-permissions", tags=["System Setup"])
def setup_default_permissions(db: Session = Depends(get_db)):
    """
    Idempotent Setup: Creates default permissions if missing 
    and links them to Admin/SuperAdmin roles.
    """
    # Define Permissions Structure
    permission_groups = {
        "User Management": ["USER_VIEW", "USER_MANAGE"],
        "Library Management": ["BOOK_VIEW", "BOOK_MANAGE", "BOOK_ISSUE"],
        "Security & Roles": ["ROLE_VIEW", "ROLE_MANAGE", "ROLE_PERMISSION_ASSIGN", "PERMISSION_VIEW"],
        "Access Requests": ["REQUEST_VIEW", "REQUEST_MANAGE"],
        "System Audit": ["LOGS_VIEW"]
    }

    # Flatten and prepare descriptions
    permissions_to_sync = []
    for group, names in permission_groups.items():
        for name in names:
            desc = f"{group}: {name.replace('_', ' ').title()}"
            permissions_to_sync.append({"name": name, "description": desc})

    added_names = []
    all_db_permissions = []

    try:
        # 1. Ensure Permissions Exist
        for p_data in permissions_to_sync:
            db_perm = db.query(permission_model.Permission).filter_by(name=p_data["name"]).first()
            if not db_perm:
                db_perm = permission_model.Permission(name=p_data["name"], description=p_data["description"])
                db.add(db_perm)
                added_names.append(p_data["name"])
            all_db_permissions.append(db_perm)
        
        db.flush() # Sync ID creation

        # 2. Assign to Admin Role
        admin_roles = db.query(user_model.Role).filter(
            user_model.Role.name.in_(["Admin", "SuperAdmin", "Administrator"])
        ).all()

        role_msg = "No Admin role found."
        if admin_roles:
            for role in admin_roles:
                # Merge existing perms with new ones to prevent overwriting custom assignments
                current_perms = set(role.permissions)
                new_perms = set(all_db_permissions)
                role.permissions = list(current_perms.union(new_perms))
            role_msg = f"Updated permissions for roles: {[r.name for r in admin_roles]}"

        db.commit()
        return {
            "status": "Success",
            "new_permissions_added": len(added_names),
            "permissions_list": added_names,
            "role_update": role_msg
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Setup Permissions Failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

# =====================================================
# 11. MAIN ENTRY POINT
# =====================================================
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = "0.0.0.0"
    
    logger.info(f"🚀 Server starting on http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
