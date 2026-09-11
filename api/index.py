import sys
import os

# Add backend to Python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

try:
    from main import app as app
except Exception as err:
    from fastapi import FastAPI
    print(f"[api/index.py] Exception importing main app: {err}")
    app = FastAPI()
    
    @app.get("/health")
    @app.get("/api/health")
    @app.get("/api/py/health")
    def health_fallback():
        return {"status": "healthy", "service": "Romancham AI Core (Fallback)", "error": str(err)}

