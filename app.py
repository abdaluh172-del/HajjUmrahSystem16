# -*- coding: utf-8 -*-
"""
Hajj & Umrah Sentiment Analysis System — Flask backend API.

Run in VS Code:
    1) python -m venv venv
    2) venv\\Scripts\\activate      (Windows)   or   source venv/bin/activate   (Mac/Linux)
    3) pip install -r requirements.txt
    4) python app.py
    -> API runs on http://localhost:5000

Endpoints:
    GET    /api/health
    POST   /api/analyze                body: {"text": "..."}
    GET    /api/comments               query: search, sentiment, category, sort, page, per_page
    POST   /api/comments               body: {"text": "...", "category": "..."}
    PUT    /api/comments/<id>          body: {"text": "..."}
    DELETE /api/comments/<id>
    GET    /api/comments/export        query: format=csv   (ADMIN ONLY)
    GET    /api/login-logs             query: search, sort, page, per_page (ADMIN ONLY)
    GET    /api/dashboard/stats
    POST   /api/auth/login             body: {"email": "...", "password": "..."}
    POST   /api/auth/signup            body: {"name": "...", "email": "...", "password": "..."}
    PUT    /api/me/comment-lang        body: {"comment_lang": "original"|"ar"|"en"}   (any signed-in account)
    POST   /api/auth/guest             (Continue as Guest — no credentials)
    POST   /api/auth/forgot-password   body: {"email": "..."}  (simulated — no email is actually sent)
    GET    /api/users
    POST   /api/users                  body: {"name","email","role","password"}
    PUT    /api/users/<id>             body: {"name","email","role"}
    DELETE /api/users/<id>

Roles (3 levels):
    admin -> the ONE fixed admin email only. Exclusive rights: users page
             (see registered emails), delete/edit comments, manage users.
             The admin role can never be granted to any other email.
    user  -> anyone who signs up. Can view everything AND add comments.
    guest -> "Continue as Guest" (no account). View only — cannot add
             comments until they create an account.
Fixed admin (cannot be deleted or demoted): see ADMIN_EMAIL below / README.
Admin-only endpoints (require "Authorization: Bearer <token>" from login):
    /api/users (all methods), PUT/DELETE /api/comments/<id>
Write endpoint (admin or registered user token required):
    POST /api/comments
Deployment: init_db() runs at import time, so the app works out of the box
under Gunicorn on Render — no manual database creation needed.

PERMANENT STORAGE (v10):
    Set the DATABASE_URL environment variable to a PostgreSQL connection
    string (e.g. from Neon / Supabase / any managed Postgres) and ALL data —
    user accounts, the admin account, comments and login logs — lives in
    that external database. It is completely independent of the app's
    filesystem, so nothing is ever lost on app shutdown, Restart or
    Redeploy on Render's free plan (no Persistent Disk needed).
    Without DATABASE_URL the app falls back to a local SQLite file, which
    is intended for local development only.
"""
import os
import io
import re
import csv
import sqlite3
import threading
import time
from datetime import datetime, timedelta, timezone

from functools import wraps

from flask import Flask, request, jsonify, g, Response, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
import joblib

from lexicon import find_keywords
from train_model import train_and_save, MODEL_PATH
from dataset import TRAIN_DATA
import external_sources  # v12: official-API fetchers (YouTube / Reddit / X)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# ---- Persistent storage for the database (v10: external PostgreSQL) ----
# All data — accounts (including the admin), comments and login logs — is
# stored in a real database, NEVER in variables or app memory.
#
#   * DATABASE_URL set (postgres://... or postgresql://...):
#       everything is stored in that external PostgreSQL database. Because
#       it lives OUTSIDE the app's filesystem, closing the app, Restart and
#       Redeploy on Render's free plan never touch it — no Persistent Disk
#       is required. This is the mode to use in production.
#   * DATABASE_URL not set:
#       local-development fallback — a SQLite file next to the code
#       (optionally at DATABASE_PATH). Do NOT rely on this on Render's
#       free plan: its filesystem is wiped on every redeploy.
DATABASE_URL = (os.environ.get("DATABASE_URL") or "").strip()
USE_POSTGRES = DATABASE_URL.startswith(("postgres://", "postgresql://"))
if USE_POSTGRES:
    import psycopg2
    import psycopg2.extras

DB_PATH = os.environ.get("DATABASE_PATH") or os.path.join(BASE_DIR, "hajj_umrah.db")
os.makedirs(os.path.dirname(os.path.abspath(DB_PATH)), exist_ok=True)
CATEGORIES = ["Services", "Crowd Management", "Transportation", "Food",
              "Staff Behavior", "Accommodation", "General"]

# ---- Roles & fixed admin account ----
# The system has exactly three roles:
#   admin -> full access — reserved EXCLUSIVELY for ADMIN_EMAIL, never assignable
#   user  -> registered account: view + add comments
#   guest -> no account: view only
VALID_ROLES = ("admin", "user", "guest")
ASSIGNABLE_ROLES = ("user", "guest")  # 'admin' can never be granted to anyone
ADMIN_EMAIL = "abdullah2222@ghjj.sa"  # fixed admin — cannot be deleted or demoted
ADMIN_PASSWORD = "A1231234"
ADMIN_NAME = "Abdullah Alharbi"  # display name of the fixed admin
# Previous default names — renamed automatically; a custom name set later
# through the users page is left untouched (credentials are never reset).
LEGACY_ADMIN_NAMES = ("Admin User", "عبدالله الحربي")
# Old admin emails from previous versions — migrated automatically to the new one.
LEGACY_ADMIN_EMAILS = ("abdullah1222@gmail.com", "admin@hajj.sa")
SECRET_KEY = os.environ.get("SECRET_KEY", "hajj-umrah-dev-secret-change-in-production")
TOKEN_MAX_AGE = 60 * 60 * 12  # 12 hours
_serializer = URLSafeTimedSerializer(SECRET_KEY, salt="auth-token")

app = Flask(__name__, static_folder="static", static_url_path="/static")


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

# ---- CORS (manual, no extra dependency required) ----
@app.after_request
def add_cors_headers(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    return resp


@app.route("/api/<path:_any>", methods=["OPTIONS"])
def options_handler(_any):
    return "", 204


# ---------------------------------------------------------------- #
# Database helpers — PostgreSQL (production) or SQLite (local dev).
# A tiny adapter keeps ONE code path: '?' placeholders + dict-style
# rows everywhere, translated to psycopg2's '%s' when on Postgres.
# ---------------------------------------------------------------- #
class _PgConnection:
    """Adapter that lets the sqlite3-style code run unchanged on PostgreSQL."""

    def __init__(self, conn):
        self._conn = conn

    def execute(self, sql, params=()):
        cur = self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql.replace("?", "%s"), tuple(params))
        return cur

    def commit(self):
        self._conn.commit()

    def close(self):
        self._conn.close()


def connect_db():
    """Open a connection to the configured database (Postgres or SQLite)."""
    if USE_POSTGRES:
        return _PgConnection(psycopg2.connect(DATABASE_URL))
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def db_insert(db, sql, params):
    """INSERT and return the new row id on both backends.

    SQLite exposes cursor.lastrowid; PostgreSQL needs RETURNING id."""
    if USE_POSTGRES:
        return db.execute(sql + " RETURNING id", params).fetchone()["id"]
    return db.execute(sql, params).lastrowid


def get_db():
    if "db" not in g:
        g.db = connect_db()
    return g.db


@app.teardown_appcontext
def close_db(_exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    # Column types differ slightly between the two engines; everything else
    # (queries, data, behavior) is identical.
    id_pk = "SERIAL PRIMARY KEY" if USE_POSTGRES else "INTEGER PRIMARY KEY AUTOINCREMENT"
    real_t = "DOUBLE PRECISION" if USE_POSTGRES else "REAL"
    conn = connect_db()
    conn.execute(f"""
        CREATE TABLE IF NOT EXISTS comments (
            id {id_pk},
            text TEXT NOT NULL,
            category TEXT NOT NULL,
            sentiment TEXT NOT NULL,
            confidence {real_t} NOT NULL,
            keywords TEXT,
            created_at TEXT NOT NULL,
            user_id INTEGER,
            user_name TEXT,
            rating INTEGER,
            status TEXT NOT NULL DEFAULT 'approved',
            likes INTEGER NOT NULL DEFAULT 0,
            source TEXT NOT NULL DEFAULT 'user',
            external_id TEXT
        )
    """)
    # ---- v12 migration: real reviews system ----
    # Older databases get the new columns added in place — existing data is
    # never touched. user_id/user_name attribute each review to its author;
    # rating is the 1..5 stars; status drives admin moderation
    # ('approved' shown to everyone / 'hidden' visible to the admin only);
    # likes is a cached counter; source tells where the comment came from
    # ('user' or an official API: 'youtube'/'reddit'/'x'); external_id
    # de-duplicates externally fetched comments.
    for coldef in ("user_id INTEGER", "user_name TEXT", "rating INTEGER",
                   "status TEXT NOT NULL DEFAULT 'approved'",
                   "likes INTEGER NOT NULL DEFAULT 0",
                   "source TEXT NOT NULL DEFAULT 'user'", "external_id TEXT"):
        if USE_POSTGRES:
            conn.execute(f"ALTER TABLE comments ADD COLUMN IF NOT EXISTS {coldef}")
        else:
            try:
                conn.execute(f"ALTER TABLE comments ADD COLUMN {coldef}")
            except sqlite3.OperationalError:
                pass  # column already exists
    # One like per account per comment (the Like button toggles it).
    conn.execute(f"""
        CREATE TABLE IF NOT EXISTS comment_likes (
            id {id_pk},
            comment_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    # ---- v12: remove the FAKE seeded comments ----
    # Earlier versions seeded the training sentences as sample comments.
    # Those are deleted once here (only rows that match a training sentence
    # AND have no author and came from no external source — i.e. exactly the
    # old seed rows). Real user reviews and fetched comments always carry an
    # author/source, so they can never be removed by this.
    seed_texts = [txt for txt, _lbl in TRAIN_DATA]
    if seed_texts:
        placeholders = ",".join("?" * len(seed_texts))
        conn.execute(
            f"DELETE FROM comments WHERE user_id IS NULL AND user_name IS NULL "
            f"AND source='user' AND text IN ({placeholders})",
            seed_texts,
        )
    conn.commit()
    conn.execute(f"""
        CREATE TABLE IF NOT EXISTS users (
            id {id_pk},
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'guest',
            comment_lang TEXT NOT NULL DEFAULT 'original',
            created_at TEXT NOT NULL
        )
    """)
    # v11 migration: per-user comments display language ('original'/'ar'/'en').
    # Databases created by older versions don't have the column yet — add it
    # without touching any existing data. Each user's choice is stored on
    # their OWN row, so it never affects anyone else and survives restarts,
    # redeploys and signing in from another device.
    if USE_POSTGRES:
        conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS "
                     "comment_lang TEXT NOT NULL DEFAULT 'original'")
    else:
        try:
            conn.execute("ALTER TABLE users ADD COLUMN "
                         "comment_lang TEXT NOT NULL DEFAULT 'original'")
        except sqlite3.OperationalError:
            pass  # column already exists
    # ---- Login audit log (v9) ----
    # Every sign-in attempt (and every signup, which signs the user in) is
    # recorded here PERMANENTLY: name, email, status ('success'/'failed') and
    # a full UTC timestamp (the UI splits it into date + time columns).
    # Rows live in the same database as users/comments — with DATABASE_URL
    # set that is an external PostgreSQL database, so restarts AND redeploys
    # never touch them. CREATE TABLE IF NOT EXISTS also migrates any database
    # created by an older version automatically.
    conn.execute(f"""
        CREATE TABLE IF NOT EXISTS login_logs (
            id {id_pk},
            name TEXT,
            email TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    # Always make sure the fixed admin account exists with role=admin,
    # regardless of what else is in the users table.
    admin_row = conn.execute("SELECT id, role FROM users WHERE lower(email)=?",
                             (ADMIN_EMAIL,)).fetchone()
    if admin_row is None:
        # Migrate an old seeded admin (if this DB predates the email change).
        legacy = None
        for old_email in LEGACY_ADMIN_EMAILS:
            legacy = conn.execute("SELECT id FROM users WHERE lower(email)=?",
                                  (old_email,)).fetchone()
            if legacy:
                break
        if legacy:
            conn.execute(
                "UPDATE users SET name=?, email=?, password_hash=?, role='admin' WHERE id=?",
                (ADMIN_NAME, ADMIN_EMAIL, generate_password_hash(ADMIN_PASSWORD), legacy["id"]),
            )
            print(f"Migrated fixed admin -> {ADMIN_EMAIL}")
        else:
            conn.execute(
                "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?,?,?,?,?)",
                (ADMIN_NAME, ADMIN_EMAIL, generate_password_hash(ADMIN_PASSWORD), "admin",
                 datetime.now(timezone.utc).isoformat()),
            )
            print(f"Seeded fixed admin -> email: {ADMIN_EMAIL}")
    elif admin_row["role"] != "admin":
        conn.execute("UPDATE users SET role='admin' WHERE id=?", (admin_row["id"],))
    # Rename old default admin names to the configured one. Anything else the
    # admin chose later stays as-is — startup never resets existing data.
    conn.execute(
        "UPDATE users SET name=? WHERE lower(email)=? AND name IN (%s)"
        % ",".join("?" * len(LEGACY_ADMIN_NAMES)),
        (ADMIN_NAME, ADMIN_EMAIL, *LEGACY_ADMIN_NAMES),
    )
    # Enforce: the admin role belongs to ADMIN_EMAIL only — demote anyone else.
    conn.execute("UPDATE users SET role='user' WHERE role='admin' AND lower(email)<>?",
                 (ADMIN_EMAIL,))
    # Every row in the users table is a registered account -> role 'user'.
    # (The 'guest' role is only the anonymous no-account mode; legacy DBs that
    # stored registered accounts as 'guest' are migrated to 'user'.)
    conn.execute("UPDATE users SET role='user' WHERE role NOT IN ('admin','user')")
    conn.commit()

    # v12: NO seeding of sample comments anymore — the comments table holds
    # only real user reviews and comments fetched from official APIs.
    conn.close()


# Create the database tables (comments + users + login_logs), seed data, and
# ensure the fixed admin exists — at IMPORT time, not just under `python app.py`.
# Render runs the app with Gunicorn (`gunicorn app:app`), which imports this
# module and never executes the `if __name__ == "__main__"` block; without
# this call the first request would crash with a "no such table" error.
# With DATABASE_URL set this connects to the external PostgreSQL database;
# CREATE TABLE IF NOT EXISTS means existing data is NEVER touched.
init_db()


# ---------------------------------------------------------------- #
# ML model loading (trains automatically the first time it's needed)
# ---------------------------------------------------------------- #
def load_model():
    model_path = os.path.join(BASE_DIR, MODEL_PATH)
    if not os.path.exists(model_path):
        print("No trained model found — training a fresh one now...")
        return train_and_save()
    return joblib.load(model_path)


MODEL = load_model()


def run_sentiment_analysis(text: str):
    probs = MODEL.predict_proba([text])[0]
    classes = list(MODEL.classes_)
    scores = {cls: round(float(p) * 100, 1) for cls, p in zip(classes, probs)}
    label = classes[int(probs.argmax())]
    confidence = scores[label]
    pos_hits, neg_hits = find_keywords(text)
    return {
        "label": label,
        "confidence": confidence,
        "scores": scores,
        "positive_keywords": pos_hits,
        "negative_keywords": neg_hits,
        "keywords": pos_hits + neg_hits,
    }


# ---------------------------------------------------------------- #
# Auth helpers (token-based, stateless)
# ---------------------------------------------------------------- #
def make_token(user_id: int) -> str:
    return _serializer.dumps({"uid": user_id})


def current_user():
    """Return the users row for the Bearer token in this request, or None."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    try:
        data = _serializer.loads(auth[7:].strip(), max_age=TOKEN_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None
    return get_db().execute("SELECT * FROM users WHERE id=?", (data.get("uid"),)).fetchone()


def api_error(msg_en: str, msg_ar: str, status: int, code: str = None):
    body = {"error": msg_en, "error_ar": msg_ar}
    if code:
        body["code"] = code
    return jsonify(body), status


def admin_required(fn):
    """Protect admin-only endpoints (users page + destructive operations).

    Double lock: the token's account must have role='admin' AND its email must
    be the fixed ADMIN_EMAIL — so admin rights can never belong to any other
    email, even if a database row were tampered with.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = current_user()
        if user is None or user["role"] != "admin" or not is_fixed_admin(user):
            return api_error("Admin access required",
                             "هذه العملية مخصصة لحساب الأدمن فقط", 403)
        return fn(*args, **kwargs)
    return wrapper


def write_required(fn):
    """Adding comments requires a registered account (user or admin token).

    Guests carry no token, so they can view comments but cannot write."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = current_user()
        if user is None or user["role"] not in ("admin", "user"):
            return api_error("Create an account to add comments",
                             "أنشئ حسابًا لتتمكن من إضافة التعليقات",
                             401, code="signup_required")
        return fn(*args, **kwargs)
    return wrapper


def is_fixed_admin(row) -> bool:
    return (row["email"] or "").lower() == ADMIN_EMAIL


def record_login(db, name, email, status):
    """Persist one sign-in attempt to the login_logs table (never deleted).

    status is 'success' or 'failed'. name may be empty when the email is
    unknown (a failed attempt for an address that has no account)."""
    db.execute(
        "INSERT INTO login_logs (name, email, status, created_at) VALUES (?,?,?,?)",
        (name or "", email, status, datetime.now(timezone.utc).isoformat()),
    )
    db.commit()


# ---------------------------------------------------------------- #
# Routes
# ---------------------------------------------------------------- #
@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "model_classes": list(MODEL.classes_)})


@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.get_json(force=True, silent=True) or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "text is required"}), 400
    result = run_sentiment_analysis(text)
    return jsonify(result)


@app.route("/api/comments", methods=["GET"])
def list_comments():
    """List comments/reviews, newest first (v12).

    Everyone sees only status='approved'. The admin can pass
    status=all|approved|hidden to run the moderation panel.
    Filters: search, sentiment, category, rating (1..5), source
    (user/youtube/reddit/x), date_from, date_to (YYYY-MM-DD).
    """
    db = get_db()
    me = current_user()
    is_admin = me is not None and me["role"] == "admin" and is_fixed_admin(me)
    search = request.args.get("search", "").strip()
    sentiment = request.args.get("sentiment", "all")
    category = request.args.get("category", "all")
    rating = request.args.get("rating", "all")
    source = request.args.get("source", "all")
    date_from = request.args.get("date_from", "").strip()
    date_to = request.args.get("date_to", "").strip()
    status = request.args.get("status", "all" if is_admin else "approved")
    sort = request.args.get("sort", "date")
    page = max(1, int(request.args.get("page", 1)))
    per_page = max(1, int(request.args.get("per_page", 10)))

    query = "SELECT * FROM comments WHERE 1=1"
    params = []
    if not is_admin:
        status = "approved"  # non-admins can never see hidden comments
    if status != "all":
        query += " AND status = ?"
        params.append(status)
    if search:
        # lower() on both sides -> case-insensitive search on SQLite AND Postgres
        query += " AND (lower(text) LIKE lower(?) OR lower(keywords) LIKE lower(?) OR lower(COALESCE(user_name,'')) LIKE lower(?))"
        params += [f"%{search}%", f"%{search}%", f"%{search}%"]
    if sentiment != "all":
        query += " AND sentiment = ?"
        params.append(sentiment)
    if category != "all":
        query += " AND category = ?"
        params.append(category)
    if rating != "all":
        query += " AND rating = ?"
        params.append(int(rating))
    if source != "all":
        query += " AND source = ?"
        params.append(source)
    # created_at is an ISO string, so plain string comparison sorts correctly.
    if date_from:
        query += " AND created_at >= ?"
        params.append(date_from)
    if date_to:
        query += " AND created_at <= ?"
        params.append(date_to + "T23:59:59.999999+00:00")

    if sort == "likes":
        order = "likes DESC, created_at DESC"
    elif sort == "confidence":
        order = "confidence DESC"
    else:
        order = "created_at DESC"  # default: newest first
    rows = db.execute(query + f" ORDER BY {order}", params).fetchall()
    total = len(rows)
    start = (page - 1) * per_page
    page_rows = [dict(r) for r in rows[start:start + per_page]]

    # Mark which of the returned comments the signed-in account already liked,
    # so the Like button can render its state.
    liked_ids = set()
    if me is not None and page_rows:
        ph = ",".join("?" * len(page_rows))
        liked = db.execute(
            f"SELECT comment_id FROM comment_likes WHERE user_id=? AND comment_id IN ({ph})",
            [me["id"]] + [r["id"] for r in page_rows]).fetchall()
        liked_ids = {r["comment_id"] for r in liked}
    for r in page_rows:
        r["liked_by_me"] = r["id"] in liked_ids

    return jsonify({
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": page_rows,
    })


@app.route("/api/comments/summary")
def comments_summary():
    """Overall rating summary for the reviews header (v12): average stars,
    review count and the 5..1 star distribution — approved comments only."""
    db = get_db()
    rows = db.execute(
        "SELECT rating FROM comments WHERE status='approved' AND rating IS NOT NULL").fetchall()
    ratings = [r["rating"] for r in rows]
    dist = {str(s): ratings.count(s) for s in (5, 4, 3, 2, 1)}
    total_all = db.execute(
        "SELECT COUNT(*) AS c FROM comments WHERE status='approved'").fetchone()["c"]
    return jsonify({
        "avg_rating": round(sum(ratings) / len(ratings), 2) if ratings else 0,
        "rated_count": len(ratings),
        "total_comments": total_all,
        "distribution": dist,
    })


@app.route("/api/insights")
def insights():
    """AI summary (v12): the most mentioned problems and strengths.

    Aggregates the extracted keywords of approved comments — keywords from
    negative comments become 'top problems', from positive ones
    'top strengths' — plus overall sentiment counts for the charts."""
    db = get_db()
    rows = db.execute(
        "SELECT sentiment, keywords FROM comments WHERE status='approved'").fetchall()
    problems, strengths = {}, {}
    counts = {"positive": 0, "negative": 0, "neutral": 0}
    for r in rows:
        counts[r["sentiment"]] = counts.get(r["sentiment"], 0) + 1
        bucket = strengths if r["sentiment"] == "positive" else (
            problems if r["sentiment"] == "negative" else None)
        if bucket is not None and r["keywords"]:
            for kw in r["keywords"].split(","):
                kw = kw.strip()
                if kw:
                    bucket[kw] = bucket.get(kw, 0) + 1
    top = lambda d: sorted(d.items(), key=lambda x: x[1], reverse=True)[:8]
    return jsonify({
        "top_problems": top(problems),
        "top_strengths": top(strengths),
        "counts": counts,
        "total": len(rows),
    })


@app.route("/api/comments", methods=["POST"])
@write_required
def add_comment():
    """Add a real review (v12): text + optional 1..5 star rating.

    The signed-in account is recorded as the author (user_id + user_name),
    the comment is analyzed by the AI model immediately, stored permanently
    in the database and shown newest-first."""
    data = request.get_json(force=True, silent=True) or {}
    text = (data.get("text") or "").strip()
    category = data.get("category") or "General"
    rating = data.get("rating")
    if not text:
        return jsonify({"error": "text is required"}), 400
    if rating is not None:
        try:
            rating = int(rating)
        except (TypeError, ValueError):
            return api_error("rating must be a number 1..5", "التقييم يجب أن يكون رقمًا من 1 إلى 5", 400)
        if not 1 <= rating <= 5:
            return api_error("rating must be between 1 and 5", "التقييم يجب أن يكون بين 1 و 5", 400)

    me = current_user()  # write_required guarantees a registered account
    result = run_sentiment_analysis(text)
    db = get_db()
    new_id = db_insert(
        db,
        "INSERT INTO comments (text, category, sentiment, confidence, keywords, created_at, "
        "user_id, user_name, rating, status, likes, source) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        (text, category, result["label"], result["confidence"],
         ",".join(result["keywords"]), datetime.now(timezone.utc).isoformat(),
         me["id"], me["name"], rating, "approved", 0, "user"),
    )
    db.commit()
    new_row = db.execute("SELECT * FROM comments WHERE id=?", (new_id,)).fetchone()
    return jsonify(dict(new_row)), 201


@app.route("/api/comments/<int:comment_id>/like", methods=["POST"])
@write_required
def toggle_like(comment_id):
    """Like / unlike a comment (v12). One like per account, toggled."""
    me = current_user()
    db = get_db()
    row = db.execute("SELECT id FROM comments WHERE id=?", (comment_id,)).fetchone()
    if not row:
        return jsonify({"error": "not found"}), 404
    existing = db.execute(
        "SELECT id FROM comment_likes WHERE comment_id=? AND user_id=?",
        (comment_id, me["id"])).fetchone()
    if existing:
        db.execute("DELETE FROM comment_likes WHERE id=?", (existing["id"],))
        liked = False
    else:
        db.execute("INSERT INTO comment_likes (comment_id, user_id, created_at) VALUES (?,?,?)",
                   (comment_id, me["id"], datetime.now(timezone.utc).isoformat()))
        liked = True
    # Keep the cached counter exact by recounting from the likes table.
    n = db.execute("SELECT COUNT(*) AS c FROM comment_likes WHERE comment_id=?",
                   (comment_id,)).fetchone()["c"]
    db.execute("UPDATE comments SET likes=? WHERE id=?", (n, comment_id))
    db.commit()
    return jsonify({"id": comment_id, "likes": n, "liked_by_me": liked})


@app.route("/api/comments/<int:comment_id>/status", methods=["PUT"])
@admin_required
def set_comment_status(comment_id):
    """Admin moderation (v12): approve or hide a comment.

    'hidden' keeps the comment in the database but removes it from every
    non-admin view; 'approved' publishes it again. (Deleting stays a
    separate, explicit admin action.)"""
    data = request.get_json(force=True, silent=True) or {}
    status = (data.get("status") or "").strip().lower()
    if status not in ("approved", "hidden"):
        return api_error("status must be 'approved' or 'hidden'",
                         "الحالة يجب أن تكون approved أو hidden", 400)
    db = get_db()
    row = db.execute("SELECT id FROM comments WHERE id=?", (comment_id,)).fetchone()
    if not row:
        return jsonify({"error": "not found"}), 404
    db.execute("UPDATE comments SET status=? WHERE id=?", (status, comment_id))
    db.commit()
    return jsonify(dict(db.execute("SELECT * FROM comments WHERE id=?", (comment_id,)).fetchone()))


@app.route("/api/comments/<int:comment_id>", methods=["PUT"])
@admin_required
def update_comment(comment_id):
    """Admin edit (v12): change the text (re-analyzed by the AI model) and
    optionally the rating, category or status. Author info never changes."""
    data = request.get_json(force=True, silent=True) or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "text is required"}), 400
    result = run_sentiment_analysis(text)
    db = get_db()
    db.execute(
        "UPDATE comments SET text=?, sentiment=?, confidence=?, keywords=? WHERE id=?",
        (text, result["label"], result["confidence"], ",".join(result["keywords"]), comment_id),
    )
    if data.get("rating") is not None:
        try:
            rating = int(data["rating"])
        except (TypeError, ValueError):
            rating = None
        if rating is not None and 1 <= rating <= 5:
            db.execute("UPDATE comments SET rating=? WHERE id=?", (rating, comment_id))
    if data.get("category"):
        db.execute("UPDATE comments SET category=? WHERE id=?", (data["category"], comment_id))
    if data.get("status") in ("approved", "hidden"):
        db.execute("UPDATE comments SET status=? WHERE id=?", (data["status"], comment_id))
    db.commit()
    row = db.execute("SELECT * FROM comments WHERE id=?", (comment_id,)).fetchone()
    if not row:
        return jsonify({"error": "not found"}), 404
    return jsonify(dict(row))


@app.route("/api/comments/<int:comment_id>", methods=["DELETE"])
@admin_required
def delete_comment(comment_id):
    db = get_db()
    db.execute("DELETE FROM comment_likes WHERE comment_id=?", (comment_id,))  # v12: clean its likes too
    db.execute("DELETE FROM comments WHERE id=?", (comment_id,))
    db.commit()
    return jsonify({"deleted": comment_id})


@app.route("/api/comments/export")
@admin_required  # v9: exporting data (CSV/JSON) is an admin-only tool now
def export_comments():
    fmt = request.args.get("format", "csv")
    db = get_db()
    rows = db.execute("SELECT * FROM comments ORDER BY created_at DESC").fetchall()

    if fmt == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["id", "text", "category", "sentiment", "confidence", "created_at",
                         "user_name", "rating", "status", "likes", "source"])  # v12 columns
        for r in rows:
            r = dict(r)
            writer.writerow([r["id"], r["text"], r["category"], r["sentiment"], r["confidence"],
                             r["created_at"], r.get("user_name") or "", r.get("rating") or "",
                             r.get("status") or "approved", r.get("likes") or 0, r.get("source") or "user"])
        return Response(
            output.getvalue(), mimetype="text/csv",
            headers={"Content-Disposition": "attachment;filename=comments.csv"},
        )
    return jsonify([dict(r) for r in rows])


def user_public(row):
    d = dict(row)
    d.pop("password_hash", None)
    d["fixed"] = is_fixed_admin(row)  # lets the UI mark the protected account without hardcoding its email
    d.setdefault("comment_lang", "original")  # v11: per-user comments display language
    return d


# ---- Authentication (simple, session-less: returns the user object) ---- #
VALID_COMMENT_LANGS = ("original", "ar", "en")


@app.route("/api/me/comment-lang", methods=["PUT"])
def set_comment_lang():
    """Save the signed-in account's comments display language (v11).

    Available to EVERY registered account — regular users AND the admin
    (guests carry no token). The choice is stored on the account's own row
    in the users table, so it is personal: one user's choice never affects
    anyone else. Like all data it lives in the permanent database, so it
    survives logout/login, app restarts and redeploys, and follows the
    account even from another device. Original comment text in the database
    is never modified — translation is display-only in the browser.
    """
    user = current_user()
    if user is None or user["role"] not in ("admin", "user"):
        return api_error("Sign in to save your comments language",
                         "سجّل الدخول لحفظ لغة عرض التعليقات", 401)
    data = request.get_json(force=True, silent=True) or {}
    lang = (data.get("comment_lang") or "").strip().lower()
    if lang not in VALID_COMMENT_LANGS:
        return api_error("comment_lang must be one of: original, ar, en",
                         "قيمة اللغة يجب أن تكون: original أو ar أو en", 400)
    db = get_db()
    db.execute("UPDATE users SET comment_lang=? WHERE id=?", (lang, user["id"]))
    db.commit()
    row = db.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
    return jsonify(user_public(row))


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE lower(email)=?", (email,)).fetchone()
    if not row or not check_password_hash(row["password_hash"], password):
        # Audit trail: failed attempts are stored too (with the account's name
        # when the email exists, empty otherwise).
        if email:
            record_login(db, row["name"] if row else "", email, "failed")
        return api_error("Invalid email or password",
                         "البريد الإلكتروني أو كلمة المرور غير صحيحة", 401)
    record_login(db, row["name"], row["email"], "success")
    return jsonify({"user": user_public(row), "token": make_token(row["id"])})


@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.get_json(force=True, silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not name:
        return api_error("Name is required", "الاسم مطلوب", 400)
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return api_error("Enter a valid email (e.g. name@example.com)",
                         "أدخل بريدًا إلكترونيًا صحيحًا (مثل name@example.com)", 400)
    if len(password) < 6:
        return api_error("Password must be at least 6 characters",
                         "كلمة المرور يجب أن تكون 6 أحرف على الأقل", 400)
    db = get_db()
    exists = db.execute("SELECT id FROM users WHERE lower(email)=?", (email,)).fetchone()
    if exists:
        return api_error("An account with this email already exists — sign in instead",
                         "هذا البريد مسجّل مسبقًا — سجّل الدخول بدلاً من ذلك", 409)
    # Every signup is a regular registered user; the admin role is never granted.
    new_id = db_insert(
        db,
        "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?,?,?,?,?)",
        (name, email, generate_password_hash(password), "user", datetime.now(timezone.utc).isoformat()),
    )
    db.commit()
    row = db.execute("SELECT * FROM users WHERE id=?", (new_id,)).fetchone()
    # Signing up signs the user in immediately, so it's recorded in the
    # login log as a successful sign-in as well.
    record_login(db, row["name"], row["email"], "success")
    return jsonify({"user": user_public(row), "token": make_token(row["id"])}), 201


@app.route("/api/auth/guest", methods=["POST"])
def guest_login():
    """'Continue as Guest' — returns a guest identity with no token.

    Guests can browse the dashboard, comments, analytics and reports and can
    run the analyzer, but they carry no token, so POST /api/comments (write)
    and every admin-only endpoint reject them until they create an account.
    """
    return jsonify({
        "user": {"id": None, "name": "Guest", "email": None, "role": "guest", "guest": True},
        "token": None,
    })


@app.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    # NOTE: no email server is configured, so this only confirms whether the
    # flow ran — it does not actually send an email. Wire up an SMTP/email
    # provider (e.g. Flask-Mail) here for real password-reset emails.
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    db = get_db()
    row = db.execute("SELECT id FROM users WHERE lower(email)=?", (email,)).fetchone()
    return jsonify({
        "message": "If this email is registered, a reset link would be sent to it."
        if row else "If this email is registered, a reset link would be sent to it."
    })


# ---- Users management ---- #
@app.route("/api/users", methods=["GET"])
@admin_required
def list_users():
    db = get_db()
    rows = db.execute("SELECT * FROM users ORDER BY created_at ASC").fetchall()
    return jsonify([user_public(r) for r in rows])


@app.route("/api/users", methods=["POST"])
@admin_required
def add_user():
    data = request.get_json(force=True, silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    role = data.get("role") or "user"
    password = data.get("password") or "changeme123"
    if not name or not email:
        return api_error("name and email are required", "الاسم والبريد مطلوبان", 400)
    if role not in ASSIGNABLE_ROLES:
        return api_error("role must be 'user' or 'guest' — the admin role can never be assigned",
                         "الصلاحية يجب أن تكون 'مستخدم' أو 'ضيف' — صلاحية الأدمن لا تُمنح لأحد", 400)
    db = get_db()
    if db.execute("SELECT id FROM users WHERE lower(email)=?", (email,)).fetchone():
        return jsonify({"error": "An account with this email already exists"}), 409
    new_id = db_insert(
        db,
        "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?,?,?,?,?)",
        (name, email, generate_password_hash(password), role, datetime.now(timezone.utc).isoformat()),
    )
    db.commit()
    row = db.execute("SELECT * FROM users WHERE id=?", (new_id,)).fetchone()
    return jsonify(user_public(row)), 201


@app.route("/api/users/<int:user_id>", methods=["PUT"])
@admin_required
def update_user(user_id):
    data = request.get_json(force=True, silent=True) or {}
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    if not row:
        return jsonify({"error": "not found"}), 404
    name = data.get("name", row["name"])
    email = (data.get("email") or row["email"]).strip().lower()
    role = data.get("role", row["role"])
    if is_fixed_admin(row):
        pass  # role checks for the fixed admin are below
    elif role not in ASSIGNABLE_ROLES:
        return api_error("role must be 'user' or 'guest' — the admin role can never be assigned",
                         "الصلاحية يجب أن تكون 'مستخدم' أو 'ضيف' — صلاحية الأدمن لا تُمنح لأحد", 400)
    if is_fixed_admin(row):
        # The fixed admin account cannot be demoted or have its email changed.
        if role != "admin":
            return jsonify({"error": "The primary admin account role cannot be changed"}), 403
        if email != ADMIN_EMAIL:
            return jsonify({"error": "The primary admin account email cannot be changed"}), 403
    db.execute("UPDATE users SET name=?, email=?, role=? WHERE id=?", (name, email, role, user_id))
    db.commit()
    row = db.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    return jsonify(user_public(row))


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    if row and is_fixed_admin(row):
        return jsonify({"error": "The primary admin account cannot be deleted"}), 403
    db.execute("DELETE FROM users WHERE id=?", (user_id,))
    db.commit()
    return jsonify({"deleted": user_id})


# ---- Login logs (admin-only, v9) ---- #
@app.route("/api/login-logs")
@admin_required
def list_login_logs():
    """All sign-in attempts — searchable and sortable, admin-only.

    Query params:
        search   -> matches name, email or status
        sort     -> date_desc (default) | date_asc | name | email | status
        page / per_page -> pagination (default 15 per page)
    """
    db = get_db()
    search = request.args.get("search", "").strip()
    sort = request.args.get("sort", "date_desc")
    page = max(1, int(request.args.get("page", 1)))
    per_page = max(1, int(request.args.get("per_page", 15)))

    query = "SELECT * FROM login_logs WHERE 1=1"
    params = []
    if search:
        query += " AND (lower(name) LIKE lower(?) OR lower(email) LIKE lower(?) OR lower(status) LIKE lower(?))"
        like = f"%{search}%"
        params += [like, like, like]

    # Whitelisted ORDER BY only — never interpolate user input directly.
    order = {
        "date_desc": "created_at DESC",
        "date_asc": "created_at ASC",
        "name": "lower(name) ASC, created_at DESC",
        "email": "lower(email) ASC, created_at DESC",
        "status": "status ASC, created_at DESC",
    }.get(sort, "created_at DESC")

    rows = db.execute(query + " ORDER BY " + order, params).fetchall()
    total = len(rows)
    start = (page - 1) * per_page
    return jsonify({
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [dict(r) for r in rows[start:start + per_page]],
    })


@app.route("/api/dashboard/stats")
def dashboard_stats():
    db = get_db()
    rows = db.execute("SELECT * FROM comments").fetchall()
    total = len(rows)
    pos = sum(1 for r in rows if r["sentiment"] == "positive")
    neg = sum(1 for r in rows if r["sentiment"] == "negative")
    neu = total - pos - neg

    by_category = {}
    for r in rows:
        c = by_category.setdefault(r["category"], {"total": 0, "positive": 0, "negative": 0, "neutral": 0})
        c["total"] += 1
        c[r["sentiment"]] = c.get(r["sentiment"], 0) + 1

    keyword_freq = {}
    for r in rows:
        if r["keywords"]:
            for kw in r["keywords"].split(","):
                kw = kw.strip()
                if kw:
                    keyword_freq[kw] = keyword_freq.get(kw, 0) + 1
    top_keywords = sorted(keyword_freq.items(), key=lambda x: x[1], reverse=True)[:12]

    return jsonify({
        "total": total, "positive": pos, "negative": neg, "neutral": neu,
        "positive_pct": round(pos / total * 100, 1) if total else 0,
        "negative_pct": round(neg / total * 100, 1) if total else 0,
        "neutral_pct": round(neu / total * 100, 1) if total else 0,
        "by_category": by_category,
        "top_keywords": top_keywords,
    })


# ---------------------------------------------------------------- #
# v12: External comments — ingestion + hourly auto-refresh
# (fetching itself lives in external_sources.py, official APIs only)
# ---------------------------------------------------------------- #
_external_state = {"last_run": None, "last_result": None}  # status info only — data goes to the DB
_external_lock = threading.Lock()


def ingest_external_comments():
    """Fetch from every configured official API and store NEW comments only.

    De-duplication: each platform item carries its own id (external_id);
    a comment whose external_id already exists is skipped, so refreshing
    hourly never creates duplicates. Every stored comment is analyzed by
    the AI model and keeps its source + author + original timestamp."""
    added = {"youtube": 0, "reddit": 0, "x": 0}
    skipped = 0
    items = external_sources.fetch_all()
    # Own connection: this can run in the background thread, outside a request.
    conn = connect_db()
    try:
        for it in items:
            if not it.get("external_id") or not it.get("text"):
                continue
            dup = conn.execute("SELECT id FROM comments WHERE external_id=?",
                               (it["external_id"],)).fetchone()
            if dup:
                skipped += 1
                continue
            result = run_sentiment_analysis(it["text"])
            conn.execute(
                "INSERT INTO comments (text, category, sentiment, confidence, keywords, "
                "created_at, user_id, user_name, rating, status, likes, source, external_id) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (it["text"], "General", result["label"], result["confidence"],
                 ",".join(result["keywords"]), it["created_at"],
                 None, it["author"], None, "approved", 0, it["source"], it["external_id"]),
            )
            added[it["source"]] = added.get(it["source"], 0) + 1
        conn.commit()
    finally:
        conn.close()
    info = {"added": added, "skipped_duplicates": skipped,
            "fetched": len(items), "at": datetime.now(timezone.utc).isoformat()}
    _external_state["last_run"] = info["at"]
    _external_state["last_result"] = info
    return info


def _auto_fetch_loop():
    """Background refresh every FETCH_INTERVAL_MINUTES (default 60 = hourly)."""
    interval = max(5, int(os.environ.get("FETCH_INTERVAL_MINUTES", "60"))) * 60
    while True:
        try:
            with _external_lock:
                ingest_external_comments()
        except Exception as e:  # the loop must survive anything
            print(f"[external] auto fetch failed: {e}")
        time.sleep(interval)


def start_auto_fetch():
    """Start the hourly refresh thread once — only when at least one source
    is configured and AUTO_FETCH_EXTERNAL isn't disabled."""
    if os.environ.get("AUTO_FETCH_EXTERNAL", "1") == "0":
        return
    if not any(external_sources.configured_sources().values()):
        return  # nothing configured — no thread needed
    t = threading.Thread(target=_auto_fetch_loop, daemon=True, name="external-fetch")
    t.start()
    print("[external] hourly auto-fetch started")


start_auto_fetch()


@app.route("/api/admin/fetch-external", methods=["POST"])
@admin_required
def admin_fetch_external():
    """Admin: fetch external comments NOW (in addition to the hourly refresh)."""
    with _external_lock:
        info = ingest_external_comments()
    return jsonify(info)


@app.route("/api/admin/external-status")
@admin_required
def admin_external_status():
    """Admin: which sources are configured, last refresh info and per-source counts."""
    db = get_db()
    counts = {}
    for row in db.execute("SELECT source, COUNT(*) AS c FROM comments GROUP BY source").fetchall():
        counts[row["source"]] = row["c"]
    return jsonify({
        "configured": external_sources.configured_sources(),
        "auto_fetch_enabled": os.environ.get("AUTO_FETCH_EXTERNAL", "1") != "0",
        "interval_minutes": max(5, int(os.environ.get("FETCH_INTERVAL_MINUTES", "60"))),
        "last_run": _external_state["last_run"],
        "last_result": _external_state["last_result"],
        "counts_by_source": counts,
    })


if __name__ == "__main__":
    # init_db() already ran at import time above (needed for Gunicorn/Render);
    # calling it again here is harmless — everything it does is idempotent.
    init_db()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
