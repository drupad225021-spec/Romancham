import sys
import os
import base64
import glob
import math
import traceback
from io import BytesIO

# Ensure backend dir is on sys.path for local dev (may not exist on Vercel)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if os.path.isdir(BACKEND_DIR) and BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ─── Lightweight imports (always available) ───
import numpy as np
from PIL import Image

# ─── Heavy imports (may fail on Vercel serverless) ───
cv2 = None
mp = None
_import_errors = []

try:
    import cv2 as _cv2
    cv2 = _cv2
except Exception as e:
    _import_errors.append(f"cv2: {e}")

try:
    import mediapipe as _mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision
    mp = _mp
except Exception as e:
    mp = None
    mp_python = None
    mp_vision = None
    _import_errors.append(f"mediapipe: {e}")

if _import_errors:
    print(f"[api/index.py] Import warnings: {_import_errors}")

# ─── Metrics Engine (inlined, no external file dependency) ───

PERSONAS = [
    {"min": 0, "max": 0, "title": "Clean-Shaven / Smooth Skin",
     "description": "Smooth follicular surface. No visible facial hair filaments detected in the mandibular ROI.",
     "badge": "Level 0 • Clean Shaven", "color": "#94a3b8"},
    {"min": 1, "max": 2500, "title": "Light Stubble Coverage",
     "description": "Sparse follicular distribution with emerging low-density strand matrix.",
     "badge": "Level 1 • Stubble", "color": "#38bdf8"},
    {"min": 2501, "max": 6000, "title": "Medium Density Trim",
     "description": "Uniform facial coverage with clearly contoured jawline and cheek margins.",
     "badge": "Level 2 • Defined", "color": "#a855f7"},
    {"min": 6001, "max": 11000, "title": "Full Follicular Coverage",
     "description": "Dense follicle saturation across jaw, chin, and lower cheek areas.",
     "badge": "Level 3 • Full Beard", "color": "#10b981"},
    {"min": 11001, "max": 17000, "title": "High-Density Heavy Beard",
     "description": "Extensive multilayered follicle clustering with high volumetric mass.",
     "badge": "Level 4 • Heavy", "color": "#f59e0b"},
    {"min": 17001, "max": 999999, "title": "Maximum Volumetric Density",
     "description": "Peak follicular density with continuous edge coverage across the entire lower-face perimeter.",
     "badge": "Level 5 • Maximum", "color": "#ec4899"},
]

SCAN_LOGS = [
    "Calibrating optical follicle sensor...",
    "Isolating lower-face Euclidean manifold (cheeks & jaw)...",
    "Applying multi-scale Black Top-Hat transform...",
    "Analyzing follicular pigmentation contrast against skin...",
    "Eliminating skin pore background noise components...",
    "Executing Zhang-Suen morphological skeletonization...",
    "Calculating bilateral mandibular symmetry equilibrium...",
    "Computing follicle spatial distribution & density matrix...",
    "Synthesizing cyberpunk biometric HUD overlay...",
]


def calculate_beard_metrics(raw_hair_count, left_hairs, right_hairs, roi_area_px,
                            density_cm2=0.0, roi_area_cm2=100.0, is_face_detected=True):
    calibrated_count = max(0, int(raw_hair_count))
    if calibrated_count == 0:
        return {
            "hair_count": 0, "is_face_detected": is_face_detected, "is_clean_shaven": True,
            "symmetry": {"ratio": 1.0, "percentage": 100, "left_count": 0, "right_count": 0,
                         "description": "Uniform Smooth Dermal Matrix"},
            "density_equivalence": {"alpaca_power": 0.0, "unit": "Density Index",
                                    "wookiee_factor": 0.0, "label": "0.00 Index (Smooth)"},
            "beard_oil": {"microliters": 0.0, "drops": 0.0,
                          "recommendation": "0 µL (No facial hair detected)"},
            "shave_time": {"seconds": 0, "formatted": "0s", "cartridge_wear": 0.0,
                           "blade_risk": "None (Clean Shaven)"},
            "density_cm2": 0.0, "roi_area_cm2": roi_area_cm2,
            "carbon_sequestered_g": 0.0, "persona": PERSONAS[0], "scan_logs": SCAN_LOGS,
        }
    total_sides = left_hairs + right_hairs
    if total_sides > 0:
        ratio = round(left_hairs / max(1, right_hairs), 2)
        symmetry_pct = max(10, min(100, int(100 - abs(left_hairs - right_hairs) / float(total_sides) * 100)))
    else:
        ratio, symmetry_pct = 1.0, 95
    symmetry_desc = ("Symmetric Euclidean Balance" if 0.9 <= ratio <= 1.1
                     else ("Left-Sided Predominance" if ratio > 1.1 else "Right-Sided Predominance"))
    density_factor = round(calibrated_count / 8500.0, 2)
    oil_ul = round(calibrated_count * 0.022 + 15, 1)
    drops = round(oil_ul / 50.0, 1)
    shave_seconds = int(calibrated_count * 0.035 + 35)
    cartridges = round(calibrated_count / 4200.0, 1)
    density_rating = ("Low Density" if calibrated_count < 3000
                      else ("Medium Density" if calibrated_count < 8500 else "High Density"))
    persona = PERSONAS[1]
    for p in PERSONAS:
        if p["min"] <= calibrated_count <= p["max"]:
            persona = p
            break
    return {
        "hair_count": calibrated_count, "is_face_detected": is_face_detected, "is_clean_shaven": False,
        "symmetry": {"ratio": ratio, "percentage": symmetry_pct,
                     "left_count": left_hairs, "right_count": right_hairs, "description": symmetry_desc},
        "density_equivalence": {"alpaca_power": density_factor, "unit": "Density Index",
                                "wookiee_factor": round(density_factor * 0.38, 3),
                                "label": f"{density_factor} Index"},
        "beard_oil": {"microliters": oil_ul, "drops": drops,
                      "recommendation": f"{oil_ul} µL (~{drops} drops formulation)"},
        "shave_time": {"seconds": shave_seconds,
                       "formatted": f"{shave_seconds // 60}m {shave_seconds % 60}s",
                       "cartridge_wear": cartridges, "blade_risk": density_rating},
        "density_cm2": density_cm2, "roi_area_cm2": roi_area_cm2,
        "carbon_sequestered_g": round(calibrated_count * 0.008, 2),
        "persona": persona, "scan_logs": SCAN_LOGS,
    }


# ─── Lightweight PIL-based image analysis (works everywhere) ───

def analyze_image_pil(image_bytes: bytes):
    """Pure PIL/numpy analysis that works without cv2 or mediapipe."""
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    w, h = img.size
    gray = img.convert("L")
    np_gray = np.array(gray)

    lower_face = np_gray[int(h * 0.45):int(h * 0.95), :]
    avg_brightness = float(np.mean(np_gray))
    lower_brightness = float(np.mean(lower_face)) if lower_face.size > 0 else avg_brightness
    darkness_contrast = max(0.0, avg_brightness - lower_brightness)

    if darkness_contrast > 4.0 or lower_brightness < 170:
        is_beard = True
        estimated = int(min(22000, max(1400, darkness_contrast * 220 + 3800)))
    else:
        is_beard = False
        estimated = 0

    left = int(estimated * 0.51)
    right = estimated - left
    density = round(estimated / 110.0, 1) if estimated > 0 else 0.0

    bx, by, bw, bh = int(w * 0.15), int(h * 0.42), int(w * 0.70), int(h * 0.52)

    overlay_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    buf = BytesIO()
    overlay_img.save(buf, format="PNG")
    overlay_b64 = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"

    return {
        "hair_count": estimated, "left_hairs": left, "right_hairs": right,
        "roi_area_px": int(bw * bh * 0.7), "roi_area_cm2": 110.0,
        "density_cm2": density, "is_face_detected": True, "is_beard_present": is_beard,
        "overlay_mask_b64": overlay_b64, "heatmap_mask_b64": overlay_b64,
        "bounding_box": {"x": round(bx / w, 4), "y": round(by / h, 4),
                         "width": round(bw / w, 4), "height": round(bh / h, 4)},
        "roi_polygon": [{"x": 0.20, "y": 0.45}, {"x": 0.50, "y": 0.92}, {"x": 0.80, "y": 0.45}],
        "dimensions": {"width": w, "height": h},
    }


# ─── Try to use the full CV engine if available (local dev) ───

_full_engine = None
try:
    if cv2 is not None and not (os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")):
        from cv_engine import BeardCVEngine
        _full_engine = BeardCVEngine(model_path=os.path.join(BACKEND_DIR, "face_landmarker.task"))
        print("[api/index.py] Full BeardCVEngine loaded (local mode)")
except Exception as e:
    print(f"[api/index.py] BeardCVEngine not available, using PIL fallback: {e}")


def process_image(image_bytes: bytes):
    """Use full engine if available, otherwise PIL fallback."""
    if _full_engine is not None:
        return _full_engine.process_image(image_bytes)
    return analyze_image_pil(image_bytes)


# ─── FastAPI Application ───

app = FastAPI(
    title="Romancham API",
    description="Computer Vision Follicle Estimation & Beard Analytics Engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
@app.get("/api/health")
@app.get("/api/py/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Romancham AI Core",
        "engine_ready": True,
        "has_full_engine": _full_engine is not None,
        "import_warnings": _import_errors if _import_errors else None,
    }


@app.post("/analyze-beard")
@app.post("/api/analyze-beard")
@app.post("/api/py/analyze-beard")
async def analyze_beard(request: Request):
    content_type = request.headers.get("content-type", "")
    image_bytes = None

    if "multipart/form-data" in content_type:
        try:
            form = await request.form()
            file_obj = form.get("file")
            if file_obj and hasattr(file_obj, "read"):
                image_bytes = await file_obj.read()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read multipart form: {e}")
    else:
        try:
            body = await request.json()
            b64_str = body.get("image_base64") or body.get("image") or ""
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            if b64_str:
                image_bytes = base64.b64decode(b64_str)
        except Exception:
            pass

    if not image_bytes:
        raw_body = await request.body()
        if len(raw_body) > 100:
            image_bytes = raw_body

    if not image_bytes or len(image_bytes) < 100:
        raise HTTPException(status_code=400,
                            detail="No image provided or image data corrupt. Send multipart 'file' or JSON 'image_base64'.")

    try:
        cv_result = process_image(image_bytes)
        metrics = calculate_beard_metrics(
            raw_hair_count=cv_result["hair_count"],
            left_hairs=cv_result["left_hairs"],
            right_hairs=cv_result["right_hairs"],
            roi_area_px=cv_result["roi_area_px"],
            density_cm2=cv_result["density_cm2"],
            roi_area_cm2=cv_result["roi_area_cm2"],
            is_face_detected=cv_result["is_face_detected"],
        )
        return {
            "success": True,
            "metrics": metrics,
            "cv_details": {
                "bounding_box": cv_result["bounding_box"],
                "dimensions": cv_result["dimensions"],
                "roi_area_px": cv_result["roi_area_px"],
                "roi_polygon": cv_result["roi_polygon"],
            },
            "overlay_mask_b64": cv_result["overlay_mask_b64"],
            "heatmap_mask_b64": cv_result["heatmap_mask_b64"],
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Computer Vision processing failed: {str(e)}")


@app.get("/samples")
@app.get("/api/samples")
@app.get("/api/py/samples")
def get_samples():
    samples_list = []
    samples_dir = os.path.join(BACKEND_DIR, "samples")
    if os.path.isdir(samples_dir):
        for img_path in sorted(glob.glob(f"{samples_dir}/*.jpg") + glob.glob(f"{samples_dir}/*.png")):
            filename = os.path.basename(img_path)
            try:
                with open(img_path, "rb") as f:
                    b64 = f"data:image/jpeg;base64,{base64.b64encode(f.read()).decode('utf-8')}"
                samples_list.append({
                    "id": os.path.splitext(filename)[0],
                    "title": filename.replace("_", " ").replace(".jpg", "").replace(".png", "").title(),
                    "image_b64": b64,
                })
            except Exception:
                pass
    return {"samples": samples_list}
