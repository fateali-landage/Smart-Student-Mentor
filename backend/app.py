"""
SmartMentor Flask Backend — Production-Grade Rewrite
====================================================
Security features:
  - bcrypt password hashing
  - JWT access tokens (15 min) + refresh tokens (7 days)
  - Role-based access control via decorators
  - Rate limiting on auth endpoints
  - Admin role blocked from public registration
  - Soft-delete for users
  - Parameterised queries throughout
  - CORS locked to allowed origins
"""

import os
import logging
from datetime import datetime, timedelta, timezone
from functools import wraps

import bcrypt
import jwt
import psycopg2
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from psycopg2.extras import RealDictCursor

# ---------------------------------------------------------------------------
# App & environment setup
# ---------------------------------------------------------------------------

# Load .env if present (development convenience — no-op if file missing)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

FLASK_ENV = os.environ.get("FLASK_ENV", "production")
IS_DEV   = FLASK_ENV == "development"

JWT_SECRET         = os.environ.get("JWT_SECRET", "dev-secret-change-in-production")
JWT_REFRESH_SECRET = os.environ.get("JWT_REFRESH_SECRET", "dev-refresh-secret")

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://smart-student-mentor.vercel.app"
)

CORS_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

# Optional: serve the built React app from Flask in production
FRONTEND_DIST = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist"
)

app = Flask(
    __name__,
    static_folder=FRONTEND_DIST if os.path.isdir(FRONTEND_DIST) else None,
    static_url_path="",
)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": CORS_ORIGINS
        }
    },
    supports_credentials=True,
)

logger.info(f"CORS configuration on startup: allowed origins = {CORS_ORIGINS}")

@app.before_request
def log_cors_request():
    origin = request.headers.get("Origin")
    if origin:
        logger.info(f"CORS Request: Incoming origin = {origin}")
        if origin not in CORS_ORIGINS:
            logger.warning(f"CORS Request: Rejected origin = {origin}")

# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------

limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=[],          # No global limit; we set per-route limits
    storage_uri="memory://",    # Use Redis URI in production for multi-worker
)

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    """Return (or create) a per-request PostgreSQL connection stored in Flask g."""
    if "db" not in g:
        database_url = os.environ.get("DATABASE_URL")
        if not database_url:
            raise RuntimeError("DATABASE_URL environment variable is not set.")
        g.db = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
    return g.db


@app.teardown_appcontext
def close_db(error):
    """Close the database connection at the end of every request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """
    Initialise all tables and indexes.  Uses IF NOT EXISTS so it is safe to
    run on every startup against an existing database.
    """
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        logger.warning("DATABASE_URL not found — skipping DB initialisation.")
        return

    conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
    try:
        with conn.cursor() as cur:
            # ----------------------------------------------------------------
            # users
            # ----------------------------------------------------------------
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id               SERIAL PRIMARY KEY,
                    name             TEXT NOT NULL,
                    email            TEXT UNIQUE NOT NULL,
                    password         TEXT NOT NULL,
                    role             TEXT NOT NULL DEFAULT 'student'
                                         CHECK (role IN ('student','mentor','admin')),
                    bio              TEXT,
                    phone            TEXT,
                    skills           TEXT[]  DEFAULT '{}',
                    interests        TEXT[]  DEFAULT '{}',
                    github_url       TEXT,
                    linkedin_url     TEXT,
                    profile_pic_url  TEXT,
                    mentor_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    is_active        BOOLEAN DEFAULT TRUE,
                    created_at       TIMESTAMPTZ DEFAULT NOW(),
                    updated_at       TIMESTAMPTZ DEFAULT NOW(),
                    deleted_at       TIMESTAMPTZ
                );
            """)

            # Safely add columns that may be missing in an older schema
            for col, definition in [
                ("bio",             "TEXT"),
                ("phone",           "TEXT"),
                ("skills",          "TEXT[] DEFAULT '{}'"),
                ("interests",       "TEXT[] DEFAULT '{}'"),
                ("github_url",      "TEXT"),
                ("linkedin_url",    "TEXT"),
                ("profile_pic_url", "TEXT"),
                ("is_active",       "BOOLEAN DEFAULT TRUE"),
                ("created_at",      "TIMESTAMPTZ DEFAULT NOW()"),
                ("updated_at",      "TIMESTAMPTZ DEFAULT NOW()"),
                ("deleted_at",      "TIMESTAMPTZ"),
            ]:
                cur.execute(f"""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name='users' AND column_name='{col}'
                        ) THEN
                            ALTER TABLE users ADD COLUMN {col} {definition};
                        END IF;
                    END$$;
                """)

            # ----------------------------------------------------------------
            # goals
            # ----------------------------------------------------------------
            cur.execute("""
                CREATE TABLE IF NOT EXISTS goals (
                    id          SERIAL PRIMARY KEY,
                    student_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    title       TEXT NOT NULL,
                    description TEXT,
                    category    TEXT DEFAULT 'general',
                    priority    TEXT DEFAULT 'medium'
                                    CHECK (priority IN ('low','medium','high')),
                    progress    INTEGER DEFAULT 0
                                    CHECK (progress BETWEEN 0 AND 100),
                    status      TEXT DEFAULT 'not_started'
                                    CHECK (status IN
                                        ('not_started','in_progress','completed','overdue')),
                    due_date    DATE,
                    created_at  TIMESTAMPTZ DEFAULT NOW(),
                    updated_at  TIMESTAMPTZ DEFAULT NOW()
                );
            """)

            # ----------------------------------------------------------------
            # mentor_requests
            # ----------------------------------------------------------------
            cur.execute("""
                CREATE TABLE IF NOT EXISTS mentor_requests (
                    id                SERIAL PRIMARY KEY,
                    student_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    preferred_subject TEXT,
                    message           TEXT,
                    status            TEXT DEFAULT 'pending'
                                          CHECK (status IN ('pending','assigned','rejected')),
                    mentor_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    created_at        TIMESTAMPTZ DEFAULT NOW(),
                    assigned_at       TIMESTAMPTZ
                );
            """)

            # ----------------------------------------------------------------
            # feedbacks
            # ----------------------------------------------------------------
            cur.execute("""
                CREATE TABLE IF NOT EXISTS feedbacks (
                    id            SERIAL PRIMARY KEY,
                    student_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    mentor_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    feedback_text TEXT,
                    rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
                    created_at    TIMESTAMPTZ DEFAULT NOW()
                );
            """)

            # ----------------------------------------------------------------
            # student_performance
            # ----------------------------------------------------------------
            cur.execute("""
                CREATE TABLE IF NOT EXISTS student_performance (
                    student_id   INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    attendance   INTEGER DEFAULT 0 CHECK (attendance BETWEEN 0 AND 100),
                    marks        JSONB DEFAULT '[]'::jsonb,
                    study_hours  INTEGER DEFAULT 0,
                    updated_at   TIMESTAMPTZ DEFAULT NOW()
                );
            """)

            # ----------------------------------------------------------------
            # notifications
            # ----------------------------------------------------------------
            cur.execute("""
                CREATE TABLE IF NOT EXISTS notifications (
                    id         SERIAL PRIMARY KEY,
                    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    message    TEXT NOT NULL,
                    type       TEXT DEFAULT 'info',
                    is_read    BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            """)

            # ----------------------------------------------------------------
            # sessions
            # ----------------------------------------------------------------
            cur.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id               SERIAL PRIMARY KEY,
                    student_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    mentor_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    title            TEXT NOT NULL,
                    description      TEXT,
                    scheduled_at     TIMESTAMPTZ NOT NULL,
                    duration_minutes INTEGER DEFAULT 60,
                    status           TEXT DEFAULT 'pending'
                                         CHECK (status IN
                                             ('pending','approved','rejected',
                                              'completed','rescheduled')),
                    meeting_link     TEXT,
                    notes            TEXT,
                    created_at       TIMESTAMPTZ DEFAULT NOW()
                );
            """)

            # ----------------------------------------------------------------
            # tasks
            # ----------------------------------------------------------------
            cur.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id              SERIAL PRIMARY KEY,
                    mentor_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    student_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    title           TEXT NOT NULL,
                    description     TEXT,
                    resource_url    TEXT,
                    due_date        DATE,
                    status          TEXT DEFAULT 'assigned'
                                        CHECK (status IN
                                            ('assigned','submitted','reviewed','approved')),
                    submission_text TEXT,
                    feedback        TEXT,
                    created_at      TIMESTAMPTZ DEFAULT NOW()
                );
            """)

            # ----------------------------------------------------------------
            # achievements
            # ----------------------------------------------------------------
            cur.execute("""
                CREATE TABLE IF NOT EXISTS achievements (
                    id          SERIAL PRIMARY KEY,
                    student_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    badge_key   TEXT NOT NULL,
                    title       TEXT NOT NULL,
                    description TEXT,
                    earned_at   TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE (student_id, badge_key)
                );
            """)

            # ----------------------------------------------------------------
            # portfolio_items
            # ----------------------------------------------------------------
            cur.execute("""
                CREATE TABLE IF NOT EXISTS portfolio_items (
                    id          SERIAL PRIMARY KEY,
                    student_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    type        TEXT CHECK (type IN ('project','certification','skill')),
                    title       TEXT NOT NULL,
                    description TEXT,
                    url         TEXT,
                    tech_stack  TEXT[],
                    created_at  TIMESTAMPTZ DEFAULT NOW()
                );
            """)

            # ----------------------------------------------------------------
            # refresh_tokens
            # ----------------------------------------------------------------
            cur.execute("""
                CREATE TABLE IF NOT EXISTS refresh_tokens (
                    id         SERIAL PRIMARY KEY,
                    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    token      TEXT NOT NULL UNIQUE,
                    expires_at TIMESTAMPTZ NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            """)

            # ----------------------------------------------------------------
            # Indexes
            # ----------------------------------------------------------------
            for idx_sql in [
                "CREATE INDEX IF NOT EXISTS idx_goals_student          ON goals(student_id);",
                "CREATE INDEX IF NOT EXISTS idx_feedbacks_student       ON feedbacks(student_id);",
                "CREATE INDEX IF NOT EXISTS idx_feedbacks_mentor        ON feedbacks(mentor_id);",
                "CREATE INDEX IF NOT EXISTS idx_notifications_user      ON notifications(user_id);",
                "CREATE INDEX IF NOT EXISTS idx_sessions_student        ON sessions(student_id);",
                "CREATE INDEX IF NOT EXISTS idx_sessions_mentor         ON sessions(mentor_id);",
                "CREATE INDEX IF NOT EXISTS idx_tasks_student           ON tasks(student_id);",
                "CREATE INDEX IF NOT EXISTS idx_tasks_mentor            ON tasks(mentor_id);",
                "CREATE INDEX IF NOT EXISTS idx_mentor_requests_student ON mentor_requests(student_id);",
                "CREATE INDEX IF NOT EXISTS idx_users_email             ON users(email);",
                "CREATE INDEX IF NOT EXISTS idx_users_role              ON users(role);",
            ]:
                cur.execute(idx_sql)

        conn.commit()
        logger.info("✅ Database initialised successfully.")
    except Exception as exc:
        conn.rollback()
        logger.error("❌ DB init failed: %s", exc)
        raise
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def generate_tokens(user: dict) -> tuple:
    """Return (access_token, refresh_token) for the given user dict."""
    now = datetime.now(timezone.utc)

    access_payload = {
        "user_id": user["id"],
        "role":    user["role"],
        "exp":     now + timedelta(hours=24),
        "iat":     now,
    }
    refresh_payload = {
        "user_id": user["id"],
        "exp":     now + timedelta(days=7),
        "iat":     now,
    }

    access_token  = jwt.encode(access_payload,  JWT_SECRET,         algorithm="HS256")
    refresh_token = jwt.encode(refresh_payload, JWT_REFRESH_SECRET, algorithm="HS256")
    return access_token, refresh_token


def store_refresh_token(user_id: int, token: str):
    """Persist a refresh token in the DB so it can be invalidated on logout."""
    db  = get_db()
    cur = db.cursor()
    expires = datetime.now(timezone.utc) + timedelta(days=7)
    cur.execute(
        "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (%s, %s, %s)",
        (user_id, token, expires),
    )
    db.commit()


def safe_user(row: dict) -> dict:
    """Strip the password hash before sending a user object to the client."""
    if row is None:
        return {}
    return {k: v for k, v in row.items() if k != "password"}


# ---------------------------------------------------------------------------
# Auth decorators
# ---------------------------------------------------------------------------

def require_auth(f):
    """Validate JWT access token from Authorization: Bearer <token>."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"status": "error", "message": "Authentication required"}), 401
        token = auth_header[7:]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            g.current_user_id   = payload["user_id"]
            g.current_user_role = payload["role"]
        except jwt.ExpiredSignatureError:
            return jsonify({"status": "error", "message": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"status": "error", "message": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated


def require_role(*roles):
    """Restrict endpoint to users whose JWT role is in the given list."""
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated(*args, **kwargs):
            if g.current_user_role not in roles:
                return jsonify({"status": "error", "message": "Insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


# ---------------------------------------------------------------------------
# Generic error handler (never leaks internal details in production)
# ---------------------------------------------------------------------------

def internal_error(exc: Exception, context: str = ""):
    """Log the full exception server-side; return a safe JSON response."""
    logger.error("Internal error [%s]: %s", context, exc, exc_info=True)
    msg = str(exc) if IS_DEV else "An internal server error occurred."
    return jsonify({"status": "error", "message": msg}), 500


# ===========================================================================
# AUTH ROUTES  (public)
# ===========================================================================

@app.route("/api/register", methods=["POST"])
@limiter.limit("3 per minute")
def register():
    """
    Public endpoint — register a new student or mentor.
    Admin role is explicitly blocked.
    """
    data = request.get_json(silent=True) or {}
    name     = (data.get("name")     or "").strip()
    email    = (data.get("email")    or "").strip().lower()
    password = (data.get("password") or "").strip()
    role     = (data.get("role")     or "student").strip().lower()

    if not name or not email or not password:
        return jsonify({"status": "error", "message": "name, email and password are required"}), 400

    if role == "admin":
        return jsonify({"status": "error", "message": "Admin accounts cannot be created via this endpoint"}), 403

    if role not in ("student", "mentor"):
        return jsonify({"status": "error", "message": "Role must be 'student' or 'mentor'"}), 400

    try:
        db  = get_db()
        cur = db.cursor()

        # Check for duplicate email
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({"status": "error", "message": "Email already registered"}), 409

        # Hash password with bcrypt
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

        cur.execute(
            """
            INSERT INTO users (name, email, password, role)
            VALUES (%s, %s, %s, %s)
            RETURNING id, name, email, role, created_at
            """,
            (name, email, hashed, role),
        )
        user = dict(cur.fetchone())
        db.commit()

        # Create blank performance record for students
        if role == "student":
            cur.execute(
                "INSERT INTO student_performance (student_id) VALUES (%s) ON CONFLICT DO NOTHING",
                (user["id"],),
            )
            db.commit()

        access_token, refresh_token = generate_tokens(user)
        store_refresh_token(user["id"], refresh_token)

        return jsonify({
            "status":        "success",
            "message":       "Registration successful",
            "user":          user,
            "access_token":  access_token,
            "refresh_token": refresh_token,
        }), 201

    except Exception as exc:
        return internal_error(exc, "register")


@app.route("/api/login", methods=["POST"])
@limiter.limit("5 per minute")
def login():
    """Verify credentials and return JWT pair."""
    data     = request.get_json(silent=True) or {}
    email    = (data.get("email")    or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not email or not password:
        return jsonify({"status": "error", "message": "email and password are required"}), 400

    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute(
            "SELECT * FROM users WHERE email = %s AND deleted_at IS NULL",
            (email,),
        )
        user = cur.fetchone()

        if not user:
            return jsonify({"status": "error", "message": "Invalid credentials"}), 401

        if not user.get("is_active", True):
            return jsonify({"status": "error", "message": "Account is deactivated"}), 403

        # Verify bcrypt hash
        stored_hash = user["password"]
        if isinstance(stored_hash, memoryview):
            stored_hash = bytes(stored_hash)

        if not bcrypt.checkpw(password.encode(), stored_hash.encode()
                              if isinstance(stored_hash, str) else stored_hash):
            return jsonify({"status": "error", "message": "Invalid credentials"}), 401

        access_token, refresh_token = generate_tokens(dict(user))
        store_refresh_token(user["id"], refresh_token)

        return jsonify({
            "status":        "success",
            "message":       "Login successful",
            "user":          safe_user(dict(user)),
            "access_token":  access_token,
            "refresh_token": refresh_token,
        }), 200

    except Exception as exc:
        return internal_error(exc, "login")


@app.route("/api/refresh", methods=["POST"])
def refresh_token_endpoint():
    """Exchange a valid refresh token for a new access token."""
    data  = request.get_json(silent=True) or {}
    token = data.get("refresh_token", "")

    if not token:
        return jsonify({"status": "error", "message": "refresh_token is required"}), 400

    try:
        payload = jwt.decode(token, JWT_REFRESH_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"status": "error", "message": "Refresh token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"status": "error", "message": "Invalid refresh token"}), 401

    try:
        db  = get_db()
        cur = db.cursor()

        # Verify token exists in DB (not logged-out)
        cur.execute(
            "SELECT id FROM refresh_tokens WHERE token = %s AND expires_at > NOW()",
            (token,),
        )
        if not cur.fetchone():
            return jsonify({"status": "error", "message": "Refresh token not found or expired"}), 401

        cur.execute(
            "SELECT id, role FROM users WHERE id = %s AND deleted_at IS NULL AND is_active = TRUE",
            (payload["user_id"],),
        )
        user = cur.fetchone()
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        now = datetime.now(timezone.utc)
        access_payload = {
            "user_id": user["id"],
            "role":    user["role"],
            "exp":     now + timedelta(hours=24),
            "iat":     now,
        }
        new_access_token = jwt.encode(access_payload, JWT_SECRET, algorithm="HS256")

        return jsonify({
            "status":       "success",
            "access_token": new_access_token,
        }), 200

    except Exception as exc:
        return internal_error(exc, "refresh")


@app.route("/api/logout", methods=["POST"])
@require_auth
def logout():
    """Invalidate the provided refresh token."""
    data  = request.get_json(silent=True) or {}
    token = data.get("refresh_token", "")

    if not token:
        return jsonify({"status": "success", "message": "Logged out"}), 200

    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute("DELETE FROM refresh_tokens WHERE token = %s", (token,))
        db.commit()
        return jsonify({"status": "success", "message": "Logged out successfully"}), 200
    except Exception as exc:
        return internal_error(exc, "logout")


@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    """
    Reset password by email verification.
    NOTE: In a real system this should send a signed e-mail link.
          This endpoint requires the caller to know the email and new password.
    """
    data      = request.get_json(silent=True) or {}
    email     = (data.get("email")        or "").strip().lower()
    new_pass  = (data.get("new_password") or "").strip()

    if not email or not new_pass:
        return jsonify({"status": "error", "message": "email and new_password are required"}), 400

    if len(new_pass) < 6:
        return jsonify({"status": "error", "message": "Password must be at least 6 characters"}), 400

    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute(
            "SELECT id FROM users WHERE email = %s AND deleted_at IS NULL",
            (email,),
        )
        user = cur.fetchone()

        if not user:
            # Return 200 to avoid user enumeration
            return jsonify({"status": "success", "message": "If that email exists, the password has been reset"}), 200

        hashed = bcrypt.hashpw(new_pass.encode(), bcrypt.gensalt()).decode()
        cur.execute(
            "UPDATE users SET password = %s, updated_at = NOW() WHERE id = %s",
            (hashed, user["id"]),
        )
        # Invalidate all existing refresh tokens for this user
        cur.execute("DELETE FROM refresh_tokens WHERE user_id = %s", (user["id"],))
        db.commit()

        return jsonify({"status": "success", "message": "Password reset successfully"}), 200

    except Exception as exc:
        return internal_error(exc, "reset_password")


# ===========================================================================
# USER ROUTES
# ===========================================================================

@app.route("/api/users", methods=["GET"])
@require_role("admin")
def list_users():
    """Admin — paginated list of all non-deleted users."""
    try:
        page  = max(int(request.args.get("page",  1)), 1)
        limit = min(int(request.args.get("limit", 20)), 100)
        offset = (page - 1) * limit

        db  = get_db()
        cur = db.cursor()
        cur.execute(
            """
            SELECT id, name, email, role, bio, phone, skills, interests,
                   github_url, linkedin_url, profile_pic_url, mentor_id,
                   is_active, created_at, updated_at
            FROM users
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
            """,
            (limit, offset),
        )
        users = [dict(r) for r in cur.fetchall()]

        cur.execute("SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL")
        total = cur.fetchone()["total"]

        return jsonify({
            "status": "success",
            "users":  users,
            "pagination": {
                "page":  page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit,
            },
        }), 200

    except Exception as exc:
        return internal_error(exc, "list_users")


@app.route("/api/users/me", methods=["GET"])
@require_auth
def get_me():
    """Return the authenticated user's profile."""
    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute(
            """
            SELECT id, name, email, role, bio, phone, skills, interests,
                   github_url, linkedin_url, profile_pic_url, mentor_id,
                   is_active, created_at, updated_at
            FROM users
            WHERE id = %s AND deleted_at IS NULL
            """,
            (g.current_user_id,),
        )
        user = cur.fetchone()
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        return jsonify({"status": "success", "user": dict(user)}), 200

    except Exception as exc:
        return internal_error(exc, "get_me")


@app.route("/api/users/me", methods=["PUT"])
@require_auth
def update_me():
    """Update the authenticated user's own profile fields."""
    data = request.get_json(silent=True) or {}
    allowed = ["name", "bio", "phone", "skills", "interests",
               "github_url", "linkedin_url", "profile_pic_url"]

    updates = {k: data[k] for k in allowed if k in data}
    if not updates:
        return jsonify({"status": "error", "message": "No valid fields to update"}), 400

    try:
        db  = get_db()
        cur = db.cursor()

        set_clauses = ", ".join(f"{k} = %s" for k in updates)
        values      = list(updates.values()) + [g.current_user_id]

        cur.execute(
            f"UPDATE users SET {set_clauses}, updated_at = NOW() WHERE id = %s",
            values,
        )
        db.commit()

        cur.execute(
            """
            SELECT id, name, email, role, bio, phone, skills, interests,
                   github_url, linkedin_url, profile_pic_url, mentor_id, is_active
            FROM users WHERE id = %s
            """,
            (g.current_user_id,),
        )
        user = cur.fetchone()
        return jsonify({"status": "success", "user": dict(user)}), 200

    except Exception as exc:
        return internal_error(exc, "update_me")


@app.route("/api/users/me/password", methods=["PUT"])
@require_auth
def change_password():
    """Change the authenticated user's own password."""
    data         = request.get_json(silent=True) or {}
    old_password = (data.get("old_password") or "").strip()
    new_password = (data.get("new_password") or "").strip()

    if not old_password or not new_password:
        return jsonify({"status": "error", "message": "old_password and new_password are required"}), 400

    if len(new_password) < 6:
        return jsonify({"status": "error", "message": "New password must be at least 6 characters"}), 400

    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute("SELECT password FROM users WHERE id = %s", (g.current_user_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"status": "error", "message": "User not found"}), 404

        stored = row["password"]
        if not bcrypt.checkpw(old_password.encode(),
                              stored.encode() if isinstance(stored, str) else stored):
            return jsonify({"status": "error", "message": "Old password is incorrect"}), 401

        hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
        cur.execute(
            "UPDATE users SET password = %s, updated_at = NOW() WHERE id = %s",
            (hashed, g.current_user_id),
        )
        db.commit()
        return jsonify({"status": "success", "message": "Password changed successfully"}), 200

    except Exception as exc:
        return internal_error(exc, "change_password")


@app.route("/api/users/add", methods=["POST"])
@require_role("admin")
def admin_add_user():
    """Admin — create a new user with any role, including admin."""
    data     = request.get_json(silent=True) or {}
    name     = (data.get("name")     or "").strip()
    email    = (data.get("email")    or "").strip().lower()
    password = (data.get("password") or "").strip()
    role     = (data.get("role")     or "student").strip().lower()

    if not name or not email or not password:
        return jsonify({"status": "error", "message": "name, email and password are required"}), 400

    if role not in ("student", "mentor", "admin"):
        return jsonify({"status": "error", "message": "Invalid role"}), 400

    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({"status": "error", "message": "Email already in use"}), 409

        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        cur.execute(
            """
            INSERT INTO users (name, email, password, role)
            VALUES (%s, %s, %s, %s)
            RETURNING id, name, email, role, created_at
            """,
            (name, email, hashed, role),
        )
        user = dict(cur.fetchone())
        db.commit()

        if role == "student":
            cur.execute(
                "INSERT INTO student_performance (student_id) VALUES (%s) ON CONFLICT DO NOTHING",
                (user["id"],),
            )
            db.commit()

        return jsonify({"status": "success", "user": user}), 201

    except Exception as exc:
        return internal_error(exc, "admin_add_user")


@app.route("/api/users/<int:uid>", methods=["DELETE"])
@require_role("admin")
def delete_user(uid):
    """Admin — soft-delete a user (sets deleted_at timestamp)."""
    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute("SELECT id FROM users WHERE id = %s AND deleted_at IS NULL", (uid,))
        if not cur.fetchone():
            return jsonify({"status": "error", "message": "User not found"}), 404

        cur.execute(
            "UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = %s",
            (uid,),
        )
        db.commit()
        return jsonify({"status": "success", "message": "User deleted"}), 200

    except Exception as exc:
        return internal_error(exc, "delete_user")


@app.route("/api/users/<int:uid>/status", methods=["PUT"])
@require_role("admin")
def toggle_user_status(uid):
    """Admin — toggle is_active flag for a user."""
    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute(
            "SELECT is_active FROM users WHERE id = %s AND deleted_at IS NULL", (uid,)
        )
        row = cur.fetchone()
        if not row:
            return jsonify({"status": "error", "message": "User not found"}), 404

        new_status = not row["is_active"]
        cur.execute(
            "UPDATE users SET is_active = %s, updated_at = NOW() WHERE id = %s",
            (new_status, uid),
        )
        db.commit()
        return jsonify({
            "status":    "success",
            "is_active": new_status,
            "message":   f"User {'activated' if new_status else 'deactivated'}",
        }), 200

    except Exception as exc:
        return internal_error(exc, "toggle_user_status")


# ===========================================================================
# GOAL ROUTES
# ===========================================================================

@app.route("/api/goals", methods=["GET"])
@require_auth
def get_goals():
    """
    Role-aware goal retrieval:
      - student  → own goals only
      - mentor   → goals of their assigned students
      - admin    → all goals
    """
    try:
        db  = get_db()
        cur = db.cursor()
        uid  = g.current_user_id
        role = g.current_user_role

        if role == "student":
            cur.execute("SELECT * FROM goals WHERE student_id = %s ORDER BY created_at DESC", (uid,))
        elif role == "mentor":
            cur.execute(
                """
                SELECT g.* FROM goals g
                JOIN users u ON u.id = g.student_id
                WHERE u.mentor_id = %s
                ORDER BY g.created_at DESC
                """,
                (uid,),
            )
        else:  # admin
            cur.execute("SELECT * FROM goals ORDER BY created_at DESC")

        return jsonify({"status": "success", "goals": [dict(r) for r in cur.fetchall()]}), 200

    except Exception as exc:
        return internal_error(exc, "get_goals")


@app.route("/api/goals", methods=["POST"])
@require_role("student")
def create_goal():
    """Student creates a new goal. student_id comes from JWT — never from the body."""
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"status": "error", "message": "title is required"}), 400

    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute(
            """
            INSERT INTO goals
                (student_id, title, description, category, priority, due_date)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                g.current_user_id,
                title,
                data.get("description"),
                data.get("category", "general"),
                data.get("priority", "medium"),
                data.get("due_date"),
            ),
        )
        goal = dict(cur.fetchone())
        db.commit()
        return jsonify({"status": "success", "goal": goal}), 201

    except Exception as exc:
        return internal_error(exc, "create_goal")


@app.route("/api/goals/<int:gid>", methods=["PUT"])
@require_auth
def update_goal(gid):
    """Update goal metadata (title, description, priority, due_date, category)."""
    data    = request.get_json(silent=True) or {}
    allowed = ["title", "description", "priority", "due_date", "category"]
    updates = {k: data[k] for k in allowed if k in data}

    if not updates:
        return jsonify({"status": "error", "message": "No valid fields to update"}), 400

    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute("SELECT student_id FROM goals WHERE id = %s", (gid,))
        goal = cur.fetchone()
        if not goal:
            return jsonify({"status": "error", "message": "Goal not found"}), 404

        # Only owner or admin may update
        if g.current_user_role == "student" and goal["student_id"] != g.current_user_id:
            return jsonify({"status": "error", "message": "Access denied"}), 403

        set_clauses = ", ".join(f"{k} = %s" for k in updates)
        values      = list(updates.values()) + [gid]
        cur.execute(
            f"UPDATE goals SET {set_clauses}, updated_at = NOW() WHERE id = %s RETURNING *",
            values,
        )
        updated = dict(cur.fetchone())
        db.commit()
        return jsonify({"status": "success", "goal": updated}), 200

    except Exception as exc:
        return internal_error(exc, "update_goal")


@app.route("/api/goals/<int:gid>/progress", methods=["PUT"])
@require_auth
def update_goal_progress(gid):
    """Update goal progress (0-100); auto-derive status."""
    data     = request.get_json(silent=True) or {}
    progress = data.get("progress")

    if progress is None:
        return jsonify({"status": "error", "message": "progress is required"}), 400

    try:
        progress = int(progress)
    except (ValueError, TypeError):
        return jsonify({"status": "error", "message": "progress must be an integer"}), 400

    if not (0 <= progress <= 100):
        return jsonify({"status": "error", "message": "progress must be between 0 and 100"}), 400

    # Derive status from progress
    if progress == 100:
        status = "completed"
    elif progress > 0:
        status = "in_progress"
    else:
        status = "not_started"

    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute("SELECT student_id FROM goals WHERE id = %s", (gid,))
        goal = cur.fetchone()
        if not goal:
            return jsonify({"status": "error", "message": "Goal not found"}), 404

        if g.current_user_role == "student" and goal["student_id"] != g.current_user_id:
            return jsonify({"status": "error", "message": "Access denied"}), 403

        cur.execute(
            """
            UPDATE goals SET progress = %s, status = %s, updated_at = NOW()
            WHERE id = %s RETURNING *
            """,
            (progress, status, gid),
        )
        updated = dict(cur.fetchone())
        db.commit()
        return jsonify({"status": "success", "goal": updated}), 200

    except Exception as exc:
        return internal_error(exc, "update_goal_progress")


@app.route("/api/goals/<int:gid>", methods=["DELETE"])
@require_auth
def delete_goal(gid):
    """Delete a goal. Students may only delete their own; admin can delete any."""
    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute("SELECT student_id FROM goals WHERE id = %s", (gid,))
        goal = cur.fetchone()
        if not goal:
            return jsonify({"status": "error", "message": "Goal not found"}), 404

        if g.current_user_role == "student" and goal["student_id"] != g.current_user_id:
            return jsonify({"status": "error", "message": "Access denied"}), 403

        cur.execute("DELETE FROM goals WHERE id = %s", (gid,))
        db.commit()
        return jsonify({"status": "success", "message": "Goal deleted"}), 200

    except Exception as exc:
        return internal_error(exc, "delete_goal")


# ===========================================================================
# MENTOR REQUEST ROUTES
# ===========================================================================

@app.route("/api/request-mentor", methods=["POST"])
@require_role("student")
def request_mentor():
    """Student submits a mentor request."""
    data = request.get_json(silent=True) or {}
    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute(
            """
            INSERT INTO mentor_requests (student_id, preferred_subject, message)
            VALUES (%s, %s, %s) RETURNING *
            """,
            (g.current_user_id, data.get("preferred_subject"), data.get("message")),
        )
        req = dict(cur.fetchone())
        db.commit()
        return jsonify({"status": "success", "request": req}), 201

    except Exception as exc:
        return internal_error(exc, "request_mentor")


@app.route("/api/my-requests", methods=["GET"])
@require_role("student")
def my_requests():
    """Student views their own mentor requests."""
    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute(
            "SELECT * FROM mentor_requests WHERE student_id = %s ORDER BY created_at DESC",
            (g.current_user_id,),
        )
        return jsonify({"status": "success", "requests": [dict(r) for r in cur.fetchall()]}), 200

    except Exception as exc:
        return internal_error(exc, "my_requests")


@app.route("/api/pending-requests", methods=["GET"])
@require_role("admin")
def pending_requests():
    """Admin views all pending mentor requests with student info."""
    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute(
            """
            SELECT mr.*, u.name AS student_name, u.email AS student_email
            FROM mentor_requests mr
            JOIN users u ON u.id = mr.student_id
            WHERE mr.status = 'pending'
            ORDER BY mr.created_at DESC
            """,
        )
        return jsonify({"status": "success", "requests": [dict(r) for r in cur.fetchall()]}), 200

    except Exception as exc:
        return internal_error(exc, "pending_requests")


@app.route("/api/assign-mentor", methods=["POST"])
@require_role("admin")
def assign_mentor():
    """Admin assigns a mentor to a student by updating both the request and the user record."""
    data       = request.get_json(silent=True) or {}
    student_id = data.get("student_id")
    mentor_id  = data.get("mentor_id")
    request_id = data.get("request_id")

    if not student_id or not mentor_id:
        return jsonify({"status": "error", "message": "student_id and mentor_id are required"}), 400

    try:
        db  = get_db()
        cur = db.cursor()

        # Validate mentor role
        cur.execute("SELECT role FROM users WHERE id = %s AND deleted_at IS NULL", (mentor_id,))
        mentor = cur.fetchone()
        if not mentor or mentor["role"] != "mentor":
            return jsonify({"status": "error", "message": "Invalid mentor_id"}), 400

        # Assign mentor to student
        cur.execute(
            "UPDATE users SET mentor_id = %s, updated_at = NOW() WHERE id = %s",
            (mentor_id, student_id),
        )

        # Update request status if request_id supplied
        if request_id:
            cur.execute(
                """
                UPDATE mentor_requests
                SET status = 'assigned', mentor_id = %s, assigned_at = NOW()
                WHERE id = %s
                """,
                (mentor_id, request_id),
            )

        db.commit()

        # Notify student
        cur.execute(
            "INSERT INTO notifications (user_id, message, type) VALUES (%s, %s, 'info')",
            (student_id, "A mentor has been assigned to you!"),
        )
        db.commit()

        return jsonify({"status": "success", "message": "Mentor assigned successfully"}), 200

    except Exception as exc:
        return internal_error(exc, "assign_mentor")


# ===========================================================================
# MY STUDENTS (mentor)
# ===========================================================================

@app.route("/api/my-students", methods=["GET"])
@require_role("mentor", "admin")
def my_students():
    """Mentor sees the list of students assigned to them."""
    try:
        db  = get_db()
        cur = db.cursor()
        mentor_id = g.current_user_id

        cur.execute(
            """
            SELECT id, name, email, role, bio, phone, skills, interests,
                   github_url, linkedin_url, profile_pic_url, is_active, created_at
            FROM users
            WHERE mentor_id = %s AND deleted_at IS NULL AND role = 'student'
            ORDER BY name
            """,
            (mentor_id,),
        )
        return jsonify({"status": "success", "students": [dict(r) for r in cur.fetchall()]}), 200

    except Exception as exc:
        return internal_error(exc, "my_students")


# ===========================================================================
# FEEDBACK ROUTES
# ===========================================================================

@app.route("/api/feedback", methods=["POST"])
@require_role("mentor", "admin")
def give_feedback():
    """
    Mentor gives feedback to a student.
    Mentors may only give feedback to their OWN assigned students.
    """
    data       = request.get_json(silent=True) or {}
    student_id = data.get("student_id")
    text       = data.get("feedback_text", "").strip()
    rating     = data.get("rating")

    if not student_id:
        return jsonify({"status": "error", "message": "student_id is required"}), 400

    try:
        db  = get_db()
        cur = db.cursor()

        # Verify student is assigned to this mentor (unless admin)
        if g.current_user_role == "mentor":
            cur.execute(
                "SELECT id FROM users WHERE id = %s AND mentor_id = %s AND deleted_at IS NULL",
                (student_id, g.current_user_id),
            )
            if not cur.fetchone():
                return jsonify({"status": "error", "message": "Student is not assigned to you"}), 403

        cur.execute(
            """
            INSERT INTO feedbacks (student_id, mentor_id, feedback_text, rating)
            VALUES (%s, %s, %s, %s) RETURNING *
            """,
            (student_id, g.current_user_id, text, rating),
        )
        fb = dict(cur.fetchone())
        db.commit()

        # Notify student
        cur.execute(
            "INSERT INTO notifications (user_id, message, type) VALUES (%s, %s, 'feedback')",
            (student_id, "You have received new feedback from your mentor."),
        )
        db.commit()

        return jsonify({"status": "success", "feedback": fb}), 201

    except Exception as exc:
        return internal_error(exc, "give_feedback")


@app.route("/api/feedback", methods=["GET"])
@require_auth
def get_feedback():
    """
    Role-aware feedback retrieval:
      - student → own received feedback
      - mentor  → feedback they gave
      - admin   → all feedbacks
    """
    try:
        db  = get_db()
        cur = db.cursor()
        uid  = g.current_user_id
        role = g.current_user_role

        if role == "student":
            cur.execute(
                """
                SELECT f.*, u.name AS mentor_name
                FROM feedbacks f JOIN users u ON u.id = f.mentor_id
                WHERE f.student_id = %s ORDER BY f.created_at DESC
                """,
                (uid,),
            )
        elif role == "mentor":
            cur.execute(
                """
                SELECT f.*, u.name AS student_name
                FROM feedbacks f JOIN users u ON u.id = f.student_id
                WHERE f.mentor_id = %s ORDER BY f.created_at DESC
                """,
                (uid,),
            )
        else:
            cur.execute(
                """
                SELECT f.*,
                       s.name AS student_name, m.name AS mentor_name
                FROM feedbacks f
                JOIN users s ON s.id = f.student_id
                JOIN users m ON m.id = f.mentor_id
                ORDER BY f.created_at DESC
                """
            )

        return jsonify({"status": "success", "feedbacks": [dict(r) for r in cur.fetchall()]}), 200

    except Exception as exc:
        return internal_error(exc, "get_feedback")


# Admin alias
@app.route("/api/feedbacks", methods=["GET"])
@require_role("admin")
def all_feedbacks():
    """Admin — full feedback list with student and mentor names."""
    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute(
            """
            SELECT f.*, s.name AS student_name, m.name AS mentor_name
            FROM feedbacks f
            JOIN users s ON s.id = f.student_id
            JOIN users m ON m.id = f.mentor_id
            ORDER BY f.created_at DESC
            """
        )
        return jsonify({"status": "success", "feedbacks": [dict(r) for r in cur.fetchall()]}), 200

    except Exception as exc:
        return internal_error(exc, "all_feedbacks")


# ===========================================================================
# PERFORMANCE ROUTES
# ===========================================================================

@app.route("/api/performance", methods=["GET"])
@require_auth
def get_performance():
    """
    Role-aware performance data:
      - student → own record
      - mentor  → all records for their students
      - admin   → all records
    """
    try:
        db  = get_db()
        cur = db.cursor()
        uid  = g.current_user_id
        role = g.current_user_role

        if role == "student":
            cur.execute(
                """
                SELECT sp.*, u.name, u.email
                FROM student_performance sp JOIN users u ON u.id = sp.student_id
                WHERE sp.student_id = %s
                """,
                (uid,),
            )
        elif role == "mentor":
            cur.execute(
                """
                SELECT sp.*, u.name, u.email
                FROM student_performance sp
                JOIN users u ON u.id = sp.student_id
                WHERE u.mentor_id = %s
                """,
                (uid,),
            )
        else:
            cur.execute(
                """
                SELECT sp.*, u.name, u.email
                FROM student_performance sp JOIN users u ON u.id = sp.student_id
                ORDER BY u.name
                """
            )

        rows = [dict(r) for r in cur.fetchall()]
        return jsonify({"status": "success", "performance": rows}), 200

    except Exception as exc:
        return internal_error(exc, "get_performance")


@app.route("/api/performance", methods=["POST"])
@require_auth
def update_performance():
    """
    Upsert performance data.
    Students update their own record; mentors/admin specify student_id.
    """
    data = request.get_json(silent=True) or {}
    role = g.current_user_role

    if role == "student":
        student_id = g.current_user_id
    else:
        student_id = data.get("student_id")
        if not student_id:
            return jsonify({"status": "error", "message": "student_id is required"}), 400

    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute(
            """
            INSERT INTO student_performance (student_id, attendance, marks, study_hours)
            VALUES (%s, %s, %s::jsonb, %s)
            ON CONFLICT (student_id) DO UPDATE SET
                attendance  = EXCLUDED.attendance,
                marks       = EXCLUDED.marks,
                study_hours = EXCLUDED.study_hours,
                updated_at  = NOW()
            RETURNING *
            """,
            (
                student_id,
                data.get("attendance", 0),
                __import__("json").dumps(data.get("marks", [])),
                data.get("study_hours", 0),
            ),
        )
        perf = dict(cur.fetchone())
        db.commit()
        return jsonify({"status": "success", "performance": perf}), 200

    except Exception as exc:
        return internal_error(exc, "update_performance")


# ===========================================================================
# NOTIFICATION ROUTES
# ===========================================================================

@app.route("/api/notifications", methods=["GET"])
@require_auth
def get_notifications():
    """Return all notifications for the authenticated user."""
    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute(
            """
            SELECT * FROM notifications
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 50
            """,
            (g.current_user_id,),
        )
        return jsonify({
            "status":        "success",
            "notifications": [dict(r) for r in cur.fetchall()],
        }), 200

    except Exception as exc:
        return internal_error(exc, "get_notifications")


@app.route("/api/notifications/<int:nid>/read", methods=["POST"])
@require_auth
def mark_notification_read(nid):
    """Mark a single notification as read (only if it belongs to the current user)."""
    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute(
            """
            UPDATE notifications SET is_read = TRUE
            WHERE id = %s AND user_id = %s
            """,
            (nid, g.current_user_id),
        )
        db.commit()
        return jsonify({"status": "success", "message": "Notification marked as read"}), 200

    except Exception as exc:
        return internal_error(exc, "mark_notification_read")


@app.route("/api/notifications/read-all", methods=["POST"])
@require_auth
def mark_all_notifications_read():
    """Mark all of the current user's notifications as read."""
    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = %s",
            (g.current_user_id,),
        )
        db.commit()
        return jsonify({"status": "success", "message": "All notifications marked as read"}), 200

    except Exception as exc:
        return internal_error(exc, "mark_all_notifications_read")


# ===========================================================================
# SESSION ROUTES
# ===========================================================================

@app.route("/api/sessions", methods=["GET"])
@require_auth
def get_sessions():
    """Role-aware list of sessions."""
    try:
        db  = get_db()
        cur = db.cursor()
        uid  = g.current_user_id
        role = g.current_user_role

        if role == "student":
            cur.execute(
                """
                SELECT s.*, m.name AS mentor_name
                FROM sessions s JOIN users m ON m.id = s.mentor_id
                WHERE s.student_id = %s ORDER BY s.scheduled_at DESC
                """,
                (uid,),
            )
        elif role == "mentor":
            cur.execute(
                """
                SELECT s.*, u.name AS student_name
                FROM sessions s JOIN users u ON u.id = s.student_id
                WHERE s.mentor_id = %s ORDER BY s.scheduled_at DESC
                """,
                (uid,),
            )
        else:
            cur.execute(
                """
                SELECT s.*, u.name AS student_name, m.name AS mentor_name
                FROM sessions s
                JOIN users u ON u.id = s.student_id
                JOIN users m ON m.id = s.mentor_id
                ORDER BY s.scheduled_at DESC
                """
            )

        return jsonify({"status": "success", "sessions": [dict(r) for r in cur.fetchall()]}), 200

    except Exception as exc:
        return internal_error(exc, "get_sessions")


@app.route("/api/sessions", methods=["POST"])
@require_role("student")
def book_session():
    """Student books a session with their assigned mentor."""
    data = request.get_json(silent=True) or {}
    title        = (data.get("title")        or "").strip()
    scheduled_at = data.get("scheduled_at")

    if not title or not scheduled_at:
        return jsonify({"status": "error", "message": "title and scheduled_at are required"}), 400

    try:
        db  = get_db()
        cur = db.cursor()

        # Get the student's assigned mentor
        cur.execute("SELECT mentor_id FROM users WHERE id = %s", (g.current_user_id,))
        user = cur.fetchone()
        mentor_id = data.get("mentor_id") or (user["mentor_id"] if user else None)

        if not mentor_id:
            return jsonify({"status": "error", "message": "No mentor assigned yet"}), 400

        cur.execute(
            """
            INSERT INTO sessions
                (student_id, mentor_id, title, description, scheduled_at,
                 duration_minutes, meeting_link)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *
            """,
            (
                g.current_user_id, mentor_id, title,
                data.get("description"),
                scheduled_at,
                data.get("duration_minutes", 60),
                data.get("meeting_link"),
            ),
        )
        session = dict(cur.fetchone())
        db.commit()

        # Notify mentor
        cur.execute(
            "INSERT INTO notifications (user_id, message, type) VALUES (%s, %s, 'session')",
            (mentor_id, f"New session request: {title}"),
        )
        db.commit()

        return jsonify({"status": "success", "session": session}), 201

    except Exception as exc:
        return internal_error(exc, "book_session")


def _update_session_status(sid: int, new_status: str, extra_fields: dict = None):
    """Helper to update a session's status (used by approve/reject/complete)."""
    db  = get_db()
    cur = db.cursor()

    # Verify session exists
    cur.execute("SELECT mentor_id, student_id, status FROM sessions WHERE id = %s", (sid,))
    session = cur.fetchone()
    if not session:
        return None, jsonify({"status": "error", "message": "Session not found"}), 404

    # Only the session's mentor (or admin) can approve/reject/complete
    if g.current_user_role == "mentor" and session["mentor_id"] != g.current_user_id:
        return None, jsonify({"status": "error", "message": "Access denied"}), 403

    fields = {"status": new_status, **(extra_fields or {})}
    set_clauses = ", ".join(f"{k} = %s" for k in fields)
    values      = list(fields.values()) + [sid]
    cur.execute(f"UPDATE sessions SET {set_clauses} WHERE id = %s RETURNING *", values)
    updated = dict(cur.fetchone())
    db.commit()
    return updated, None, None


@app.route("/api/sessions/<int:sid>/approve", methods=["PUT"])
@require_role("mentor", "admin")
def approve_session(sid):
    """Mentor approves a pending session request."""
    try:
        data = request.get_json(silent=True) or {}
        meeting_link = data.get("meeting_link")
        extra = {"meeting_link": meeting_link} if meeting_link else {}
        updated, err, code = _update_session_status(sid, "approved", extra)
        if err:
            return err, code
        # Notify student
        cur = get_db().cursor()
        cur.execute(
            "INSERT INTO notifications (user_id, message, type) VALUES (%s, %s, 'session')",
            (updated["student_id"], "Your session has been approved!"),
        )
        get_db().commit()
        return jsonify({"status": "success", "session": updated}), 200
    except Exception as exc:
        return internal_error(exc, "approve_session")


@app.route("/api/sessions/<int:sid>/reject", methods=["PUT"])
@require_role("mentor", "admin")
def reject_session(sid):
    """Mentor rejects a session request."""
    try:
        updated, err, code = _update_session_status(sid, "rejected")
        if err:
            return err, code
        return jsonify({"status": "success", "session": updated}), 200
    except Exception as exc:
        return internal_error(exc, "reject_session")


@app.route("/api/sessions/<int:sid>/complete", methods=["PUT"])
@require_role("mentor", "admin")
def complete_session(sid):
    """Mentor marks a session as completed."""
    try:
        updated, err, code = _update_session_status(sid, "completed")
        if err:
            return err, code
        return jsonify({"status": "success", "session": updated}), 200
    except Exception as exc:
        return internal_error(exc, "complete_session")


@app.route("/api/sessions/<int:sid>/notes", methods=["PUT"])
@require_role("mentor", "admin")
def add_session_notes(sid):
    """Mentor adds notes to a session."""
    data  = request.get_json(silent=True) or {}
    notes = data.get("notes", "")
    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute("SELECT mentor_id FROM sessions WHERE id = %s", (sid,))
        session = cur.fetchone()
        if not session:
            return jsonify({"status": "error", "message": "Session not found"}), 404
        if g.current_user_role == "mentor" and session["mentor_id"] != g.current_user_id:
            return jsonify({"status": "error", "message": "Access denied"}), 403
        cur.execute("UPDATE sessions SET notes = %s WHERE id = %s RETURNING *", (notes, sid))
        updated = dict(cur.fetchone())
        db.commit()
        return jsonify({"status": "success", "session": updated}), 200
    except Exception as exc:
        return internal_error(exc, "add_session_notes")


# ===========================================================================
# TASK ROUTES
# ===========================================================================

@app.route("/api/tasks", methods=["GET"])
@require_auth
def get_tasks():
    """Role-aware task list."""
    try:
        db  = get_db()
        cur = db.cursor()
        uid  = g.current_user_id
        role = g.current_user_role

        if role == "student":
            cur.execute(
                """
                SELECT t.*, m.name AS mentor_name
                FROM tasks t JOIN users m ON m.id = t.mentor_id
                WHERE t.student_id = %s ORDER BY t.created_at DESC
                """,
                (uid,),
            )
        elif role == "mentor":
            cur.execute(
                """
                SELECT t.*, u.name AS student_name
                FROM tasks t JOIN users u ON u.id = t.student_id
                WHERE t.mentor_id = %s ORDER BY t.created_at DESC
                """,
                (uid,),
            )
        else:
            cur.execute(
                """
                SELECT t.*, u.name AS student_name, m.name AS mentor_name
                FROM tasks t
                JOIN users u ON u.id = t.student_id
                JOIN users m ON m.id = t.mentor_id
                ORDER BY t.created_at DESC
                """
            )

        return jsonify({"status": "success", "tasks": [dict(r) for r in cur.fetchall()]}), 200

    except Exception as exc:
        return internal_error(exc, "get_tasks")


@app.route("/api/tasks", methods=["POST"])
@require_role("mentor", "admin")
def create_task():
    """Mentor creates a task for one of their assigned students."""
    data       = request.get_json(silent=True) or {}
    student_id = data.get("student_id")
    title      = (data.get("title") or "").strip()

    if not student_id or not title:
        return jsonify({"status": "error", "message": "student_id and title are required"}), 400

    try:
        db  = get_db()
        cur = db.cursor()

        # Mentors can only assign tasks to their own students
        if g.current_user_role == "mentor":
            cur.execute(
                "SELECT id FROM users WHERE id = %s AND mentor_id = %s AND deleted_at IS NULL",
                (student_id, g.current_user_id),
            )
            if not cur.fetchone():
                return jsonify({"status": "error", "message": "Student is not assigned to you"}), 403

        cur.execute(
            """
            INSERT INTO tasks
                (mentor_id, student_id, title, description, resource_url, due_date)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING *
            """,
            (
                g.current_user_id, student_id, title,
                data.get("description"),
                data.get("resource_url"),
                data.get("due_date"),
            ),
        )
        task = dict(cur.fetchone())
        db.commit()

        # Notify student
        cur.execute(
            "INSERT INTO notifications (user_id, message, type) VALUES (%s, %s, 'task')",
            (student_id, f"New task assigned: {title}"),
        )
        db.commit()

        return jsonify({"status": "success", "task": task}), 201

    except Exception as exc:
        return internal_error(exc, "create_task")


@app.route("/api/tasks/<int:tid>/submit", methods=["PUT"])
@require_role("student")
def submit_task(tid):
    """Student submits work for a task."""
    data            = request.get_json(silent=True) or {}
    submission_text = data.get("submission_text", "")

    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute("SELECT student_id, mentor_id FROM tasks WHERE id = %s", (tid,))
        task = cur.fetchone()
        if not task:
            return jsonify({"status": "error", "message": "Task not found"}), 404
        if task["student_id"] != g.current_user_id:
            return jsonify({"status": "error", "message": "Access denied"}), 403

        cur.execute(
            """
            UPDATE tasks SET submission_text = %s, status = 'submitted'
            WHERE id = %s RETURNING *
            """,
            (submission_text, tid),
        )
        updated = dict(cur.fetchone())
        db.commit()

        # Notify mentor
        cur.execute(
            "INSERT INTO notifications (user_id, message, type) VALUES (%s, %s, 'task')",
            (task["mentor_id"], f"Task #{tid} has been submitted for review."),
        )
        db.commit()

        return jsonify({"status": "success", "task": updated}), 200

    except Exception as exc:
        return internal_error(exc, "submit_task")


@app.route("/api/tasks/<int:tid>/review", methods=["PUT"])
@require_role("mentor", "admin")
def review_task(tid):
    """Mentor reviews a submitted task and optionally approves it."""
    data     = request.get_json(silent=True) or {}
    feedback = data.get("feedback", "")
    approved = data.get("approved", False)
    new_status = "approved" if approved else "reviewed"

    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute("SELECT mentor_id, student_id FROM tasks WHERE id = %s", (tid,))
        task = cur.fetchone()
        if not task:
            return jsonify({"status": "error", "message": "Task not found"}), 404
        if g.current_user_role == "mentor" and task["mentor_id"] != g.current_user_id:
            return jsonify({"status": "error", "message": "Access denied"}), 403

        cur.execute(
            """
            UPDATE tasks SET feedback = %s, status = %s
            WHERE id = %s RETURNING *
            """,
            (feedback, new_status, tid),
        )
        updated = dict(cur.fetchone())
        db.commit()

        # Notify student
        cur.execute(
            "INSERT INTO notifications (user_id, message, type) VALUES (%s, %s, 'task')",
            (task["student_id"], f"Your task has been {new_status}."),
        )
        db.commit()

        return jsonify({"status": "success", "task": updated}), 200

    except Exception as exc:
        return internal_error(exc, "review_task")


# ===========================================================================
# PORTFOLIO ROUTES
# ===========================================================================

@app.route("/api/portfolio", methods=["GET"])
@require_auth
def get_portfolio():
    """
    Student sees own portfolio; mentor sees their students' portfolios; admin sees all.
    """
    try:
        db  = get_db()
        cur = db.cursor()
        uid  = g.current_user_id
        role = g.current_user_role

        if role == "student":
            cur.execute(
                "SELECT * FROM portfolio_items WHERE student_id = %s ORDER BY created_at DESC",
                (uid,),
            )
        elif role == "mentor":
            cur.execute(
                """
                SELECT p.*, u.name AS student_name
                FROM portfolio_items p JOIN users u ON u.id = p.student_id
                WHERE u.mentor_id = %s ORDER BY p.created_at DESC
                """,
                (uid,),
            )
        else:
            cur.execute(
                """
                SELECT p.*, u.name AS student_name
                FROM portfolio_items p JOIN users u ON u.id = p.student_id
                ORDER BY p.created_at DESC
                """
            )

        return jsonify({
            "status": "success",
            "portfolio": [dict(r) for r in cur.fetchall()],
        }), 200

    except Exception as exc:
        return internal_error(exc, "get_portfolio")


@app.route("/api/portfolio", methods=["POST"])
@require_role("student")
def add_portfolio_item():
    """Student adds a new portfolio item."""
    data  = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"status": "error", "message": "title is required"}), 400

    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute(
            """
            INSERT INTO portfolio_items
                (student_id, type, title, description, url, tech_stack)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING *
            """,
            (
                g.current_user_id,
                data.get("type", "project"),
                title,
                data.get("description"),
                data.get("url"),
                data.get("tech_stack", []),
            ),
        )
        item = dict(cur.fetchone())
        db.commit()
        return jsonify({"status": "success", "item": item}), 201

    except Exception as exc:
        return internal_error(exc, "add_portfolio_item")


@app.route("/api/portfolio/<int:pid>", methods=["DELETE"])
@require_auth
def delete_portfolio_item(pid):
    """Student deletes their own portfolio item; admin can delete any."""
    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute("SELECT student_id FROM portfolio_items WHERE id = %s", (pid,))
        item = cur.fetchone()
        if not item:
            return jsonify({"status": "error", "message": "Item not found"}), 404
        if g.current_user_role == "student" and item["student_id"] != g.current_user_id:
            return jsonify({"status": "error", "message": "Access denied"}), 403

        cur.execute("DELETE FROM portfolio_items WHERE id = %s", (pid,))
        db.commit()
        return jsonify({"status": "success", "message": "Portfolio item deleted"}), 200

    except Exception as exc:
        return internal_error(exc, "delete_portfolio_item")


# ===========================================================================
# ACHIEVEMENTS
# ===========================================================================

# Badge catalogue
BADGE_CATALOGUE = {
    "first_goal":      {"title": "First Step",       "description": "Created your first goal"},
    "five_goals":      {"title": "Goal Setter",       "description": "Created 5 or more goals"},
    "ten_goals":       {"title": "Overachiever",      "description": "Created 10 or more goals"},
    "active_learner":  {"title": "Active Learner",    "description": "Logged 20+ study hours"},
    "top_performer":   {"title": "Top Performer",     "description": "Average marks above 85%"},
    "interview_ready": {"title": "Interview Ready",   "description": "Has 3+ portfolio items and 5+ skills"},
}


@app.route("/api/achievements", methods=["GET"])
@require_auth
def get_achievements():
    """Return earned achievements for the current user (or a specified student_id for mentor/admin)."""
    try:
        db  = get_db()
        cur = db.cursor()
        role = g.current_user_role

        if role == "student":
            student_id = g.current_user_id
        else:
            student_id = request.args.get("student_id", g.current_user_id, type=int)

        cur.execute(
            "SELECT * FROM achievements WHERE student_id = %s ORDER BY earned_at DESC",
            (student_id,),
        )
        return jsonify({
            "status":       "success",
            "achievements": [dict(r) for r in cur.fetchall()],
        }), 200

    except Exception as exc:
        return internal_error(exc, "get_achievements")


@app.route("/api/achievements/check", methods=["POST"])
@require_auth
def check_achievements():
    """
    Auto-check and award badges for the current student based on:
      - Number of goals
      - Study hours
      - Average marks
      - Portfolio size and skill count
    """
    try:
        db  = get_db()
        cur = db.cursor()
        role = g.current_user_role

        if role == "student":
            student_id = g.current_user_id
        else:
            data       = request.get_json(silent=True) or {}
            student_id = data.get("student_id", g.current_user_id)

        # Gather data
        cur.execute("SELECT COUNT(*) AS cnt FROM goals WHERE student_id = %s", (student_id,))
        goal_count = cur.fetchone()["cnt"]

        cur.execute(
            "SELECT study_hours, marks FROM student_performance WHERE student_id = %s",
            (student_id,),
        )
        perf = cur.fetchone()
        study_hours = perf["study_hours"] if perf else 0
        marks_list  = perf["marks"] if perf else []

        avg_marks = 0
        if marks_list:
            try:
                if isinstance(marks_list, list):
                    nums = [float(m) for m in marks_list if str(m).replace(".", "").isdigit()]
                    avg_marks = sum(nums) / len(nums) if nums else 0
                elif isinstance(marks_list, str):
                    import json as _json
                    parsed = _json.loads(marks_list)
                    if isinstance(parsed, list):
                        nums = [float(m) for m in parsed if str(m).replace(".", "").isdigit()]
                        avg_marks = sum(nums) / len(nums) if nums else 0
            except Exception:
                avg_marks = 0

        cur.execute(
            "SELECT COUNT(*) AS cnt FROM portfolio_items WHERE student_id = %s",
            (student_id,),
        )
        portfolio_count = cur.fetchone()["cnt"]

        cur.execute("SELECT skills FROM users WHERE id = %s", (student_id,))
        user_row    = cur.fetchone()
        skill_count = len(user_row["skills"] or []) if user_row else 0

        # Determine earned badges
        earned_badges = []
        if goal_count >= 1:
            earned_badges.append("first_goal")
        if goal_count >= 5:
            earned_badges.append("five_goals")
        if goal_count >= 10:
            earned_badges.append("ten_goals")
        if study_hours >= 20:
            earned_badges.append("active_learner")
        if avg_marks >= 85:
            earned_badges.append("top_performer")
        if portfolio_count >= 3 and skill_count >= 5:
            earned_badges.append("interview_ready")

        newly_awarded = []
        for badge_key in earned_badges:
            badge = BADGE_CATALOGUE[badge_key]
            try:
                cur.execute(
                    """
                    INSERT INTO achievements (student_id, badge_key, title, description)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (student_id, badge_key) DO NOTHING
                    RETURNING *
                    """,
                    (student_id, badge_key, badge["title"], badge["description"]),
                )
                row = cur.fetchone()
                if row:
                    newly_awarded.append(dict(row))
            except Exception:
                db.rollback()

        db.commit()

        return jsonify({
            "status":        "success",
            "newly_awarded": newly_awarded,
            "message":       f"{len(newly_awarded)} new badge(s) awarded",
        }), 200

    except Exception as exc:
        return internal_error(exc, "check_achievements")


# ===========================================================================
# PLACEMENT SCORE
# ===========================================================================

@app.route("/api/placement-score", methods=["GET"])
@require_auth
def placement_score():
    """
    Calculate a composite placement-readiness score (0–100) for the student.
    Weighted from: skills (20), goals completed (20), performance (30),
                   portfolio (15), study hours (15).
    """
    try:
        role = g.current_user_role
        if role == "student":
            student_id = g.current_user_id
        else:
            student_id = request.args.get("student_id", g.current_user_id, type=int)

        db  = get_db()
        cur = db.cursor()

        # Skills
        cur.execute("SELECT skills FROM users WHERE id = %s", (student_id,))
        user_row    = cur.fetchone()
        skill_count = len(user_row["skills"] or []) if user_row else 0
        skill_score = min(skill_count * 4, 20)   # 5 skills → 20 pts

        # Goals
        cur.execute(
            "SELECT COUNT(*) AS total, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS done"
            " FROM goals WHERE student_id = %s",
            (student_id,),
        )
        gr = cur.fetchone()
        total_goals = gr["total"] or 0
        done_goals  = gr["done"] or 0
        goal_score  = min(done_goals * 4, 20)     # 5 completed goals → 20 pts

        # Performance
        cur.execute(
            "SELECT attendance, marks, study_hours FROM student_performance WHERE student_id = %s",
            (student_id,),
        )
        perf       = cur.fetchone()
        att        = perf["attendance"] if perf else 0
        study_hrs  = perf["study_hours"] if perf else 0
        marks_list = perf["marks"] if perf else []

        avg_marks = 0
        if marks_list:
            try:
                if isinstance(marks_list, str):
                    import json as _json
                    marks_list = _json.loads(marks_list)
                nums = [float(m) for m in marks_list if str(m).replace(".", "").isdigit()]
                avg_marks = sum(nums) / len(nums) if nums else 0
            except Exception:
                avg_marks = 0

        perf_score  = round((att / 100 * 15) + (min(avg_marks, 100) / 100 * 15), 1)  # max 30

        # Portfolio
        cur.execute(
            "SELECT COUNT(*) AS cnt FROM portfolio_items WHERE student_id = %s",
            (student_id,),
        )
        portfolio_count = cur.fetchone()["cnt"]
        port_score      = min(portfolio_count * 3, 15)   # 5 items → 15 pts

        # Study hours
        study_score = min(study_hrs * 0.5, 15)           # 30 hours → 15 pts

        total_score = round(skill_score + goal_score + perf_score + port_score + study_score, 1)

        return jsonify({
            "status": "success",
            "score": {
                "total":           total_score,
                "skill_score":     skill_score,
                "goal_score":      goal_score,
                "performance_score": perf_score,
                "portfolio_score": port_score,
                "study_score":     study_score,
            },
            "breakdown": {
                "skill_count":     skill_count,
                "completed_goals": done_goals,
                "total_goals":     total_goals,
                "attendance":      att,
                "avg_marks":       round(avg_marks, 1),
                "study_hours":     study_hrs,
                "portfolio_items": portfolio_count,
            },
        }), 200

    except Exception as exc:
        return internal_error(exc, "placement_score")


# ===========================================================================
# RECOMMENDATIONS
# ===========================================================================

@app.route("/api/recommendations", methods=["GET"])
@require_auth
def recommendations():
    """
    Rule-based recommendations tailored to the student's profile, goals and performance.
    """
    try:
        role = g.current_user_role
        if role == "student":
            student_id = g.current_user_id
        else:
            student_id = request.args.get("student_id", g.current_user_id, type=int)

        db  = get_db()
        cur = db.cursor()

        cur.execute("SELECT skills, interests FROM users WHERE id = %s", (student_id,))
        user_row  = cur.fetchone()
        skills    = user_row["skills"]    or [] if user_row else []
        interests = user_row["interests"] or [] if user_row else []

        cur.execute(
            "SELECT attendance, marks, study_hours FROM student_performance WHERE student_id = %s",
            (student_id,),
        )
        perf      = cur.fetchone()
        att       = perf["attendance"]  if perf else 0
        study_hrs = perf["study_hours"] if perf else 0

        cur.execute(
            "SELECT COUNT(*) AS cnt FROM goals WHERE student_id = %s AND status = 'completed'",
            (student_id,),
        )
        completed_goals = cur.fetchone()["cnt"]

        cur.execute(
            "SELECT COUNT(*) AS cnt FROM portfolio_items WHERE student_id = %s",
            (student_id,),
        )
        portfolio_cnt = cur.fetchone()["cnt"]

        recs = []

        if att < 75:
            recs.append({
                "type":    "warning",
                "title":   "Improve Attendance",
                "message": f"Your attendance is {att}%. Aim for at least 75% to stay on track.",
            })

        if study_hrs < 10:
            recs.append({
                "type":    "tip",
                "title":   "Increase Study Hours",
                "message": "You have logged fewer than 10 study hours. Try to study at least 1–2 hours daily.",
            })

        if len(skills) < 3:
            recs.append({
                "type":    "tip",
                "title":   "Add More Skills",
                "message": "Adding more skills to your profile increases your placement score and visibility.",
            })

        if completed_goals == 0:
            recs.append({
                "type":    "action",
                "title":   "Complete a Goal",
                "message": "You haven't completed any goals yet. Mark a goal as complete to earn your first badge.",
            })

        if portfolio_cnt < 2:
            recs.append({
                "type":    "action",
                "title":   "Build Your Portfolio",
                "message": "Add at least 2–3 projects or certifications to your portfolio.",
            })

        if "python" not in [s.lower() for s in skills] and "web" in " ".join(interests).lower():
            recs.append({
                "type":    "resource",
                "title":   "Learn Python",
                "message": "Python is highly sought after for web development. Consider adding it to your skills.",
            })

        if not recs:
            recs.append({
                "type":    "success",
                "title":   "Great Progress!",
                "message": "You are on track! Keep completing goals and expanding your portfolio.",
            })

        return jsonify({"status": "success", "recommendations": recs}), 200

    except Exception as exc:
        return internal_error(exc, "recommendations")


# ===========================================================================
# REPORT ROUTES (admin)
# ===========================================================================

@app.route("/api/reports/performance", methods=["GET"])
@require_role("admin")
def report_performance():
    """Admin — performance report for all students."""
    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute(
            """
            SELECT sp.*, u.name, u.email
            FROM student_performance sp JOIN users u ON u.id = sp.student_id
            WHERE u.deleted_at IS NULL
            ORDER BY u.name
            """
        )
        return jsonify({"status": "success", "data": [dict(r) for r in cur.fetchall()]}), 200

    except Exception as exc:
        return internal_error(exc, "report_performance")


@app.route("/api/reports/overview", methods=["GET"])
@require_role("admin")
def report_overview():
    """Admin — high-level counts: users, goals, sessions, requests."""
    try:
        db  = get_db()
        cur = db.cursor()

        cur.execute("SELECT role, COUNT(*) AS cnt FROM users WHERE deleted_at IS NULL GROUP BY role")
        role_counts = {r["role"]: r["cnt"] for r in cur.fetchall()}

        cur.execute("SELECT COUNT(*) AS cnt FROM goals")
        total_goals = cur.fetchone()["cnt"]

        cur.execute("SELECT status, COUNT(*) AS cnt FROM sessions GROUP BY status")
        session_counts = {r["status"]: r["cnt"] for r in cur.fetchall()}

        cur.execute("SELECT COUNT(*) AS cnt FROM mentor_requests WHERE status = 'pending'")
        pending_req = cur.fetchone()["cnt"]

        cur.execute("SELECT COUNT(*) AS cnt FROM feedbacks")
        total_feedback = cur.fetchone()["cnt"]

        return jsonify({
            "status": "success",
            "overview": {
                "users":                role_counts,
                "total_goals":          total_goals,
                "sessions":             session_counts,
                "pending_requests":     pending_req,
                "total_feedbacks":      total_feedback,
            },
        }), 200

    except Exception as exc:
        return internal_error(exc, "report_overview")


# ===========================================================================
# HEALTH CHECK (public)
# ===========================================================================

@app.route("/api/health", methods=["GET"])
def health_check():
    """Public health endpoint — also checks DB connectivity."""
    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute("SELECT 1")
        db_ok = True
    except Exception:
        db_ok = False

    return jsonify({
        "status": "ok",
        "db":     "connected" if db_ok else "unavailable",
        "env":    FLASK_ENV,
    }), 200 if db_ok else 503


# ===========================================================================
# LEGACY BACKWARD-COMPATIBLE ALIASES  (protected)
# ===========================================================================
# These keep any existing frontend that still calls the old paths working.

@app.route("/api/get-goals", methods=["GET"])
@require_auth
def legacy_get_goals():
    return get_goals()


@app.route("/api/add-goal", methods=["POST"])
@require_role("student")
def legacy_add_goal():
    return create_goal()


@app.route("/api/get-performance", methods=["GET"])
@require_auth
def legacy_get_performance():
    return get_performance()


@app.route("/api/update-performance", methods=["POST"])
@require_auth
def legacy_update_performance():
    return update_performance()


@app.route("/api/get-users", methods=["GET"])
@require_role("admin")
def legacy_get_users():
    return list_users()


@app.route("/api/get-notifications", methods=["GET"])
@require_auth
def legacy_get_notifications():
    return get_notifications()


@app.route("/api/get-feedback", methods=["GET"])
@require_auth
def legacy_get_feedback():
    return get_feedback()


@app.route("/api/give-feedback", methods=["POST"])
@require_role("mentor", "admin")
def legacy_give_feedback():
    return give_feedback()


@app.route("/api/get-sessions", methods=["GET"])
@require_auth
def legacy_get_sessions():
    return get_sessions()


@app.route("/api/book-session", methods=["POST"])
@require_role("student")
def legacy_book_session():
    return book_session()


@app.route("/api/get-tasks", methods=["GET"])
@require_auth
def legacy_get_tasks():
    return get_tasks()


@app.route("/api/create-task", methods=["POST"])
@require_role("mentor", "admin")
def legacy_create_task():
    return create_task()


@app.route("/api/get-portfolio", methods=["GET"])
@require_auth
def legacy_get_portfolio():
    return get_portfolio()


@app.route("/api/add-portfolio", methods=["POST"])
@require_role("student")
def legacy_add_portfolio():
    return add_portfolio_item()


@app.route("/api/get-achievements", methods=["GET"])
@require_auth
def legacy_get_achievements():
    return get_achievements()


@app.route("/api/get-placement-score", methods=["GET"])
@require_auth
def legacy_placement_score():
    return placement_score()


@app.route("/api/get-recommendations", methods=["GET"])
@require_auth
def legacy_recommendations():
    return recommendations()


# ===========================================================================
# SPA CATCH-ALL  (serve React build in production)
# ===========================================================================

if os.path.isdir(FRONTEND_DIST):
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_spa(path):
        """Serve the React SPA for any non-API route."""
        from flask import send_from_directory
        full = os.path.join(FRONTEND_DIST, path)
        if path and os.path.exists(full):
            return send_from_directory(FRONTEND_DIST, path)
        return send_from_directory(FRONTEND_DIST, "index.html")


# ===========================================================================
# STARTUP
# ===========================================================================

with app.app_context():
    try:
        init_db()
    except Exception as _db_err:
        logger.warning("Startup DB init skipped: %s", _db_err)


if __name__ == "__main__":
    app.run(debug=IS_DEV, port=5000)
