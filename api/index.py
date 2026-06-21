import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS
FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://smart-student-mentor.vercel.app"
)

CORS_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

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

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    # TEMP test login
    if email == "test@test.com" and password == "123456":
        return jsonify({"message": "Login successful"})
    
    return jsonify({"error": "Invalid credentials"}), 401


# Vercel handler
def handler(request):
    return app(request.environ, start_response=None)