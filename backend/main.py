from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import sys
import os
import base64
import glob

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from cv_engine import BeardCVEngine
from metrics_engine import calculate_beard_metrics

app = FastAPI(
    title="Romancham API",
    description="Computer Vision Follicle Estimation & Beard Analytics Engine",
    version="1.0.0"
)

# Enable CORS for Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize CV engine with model path relative to backend
engine = BeardCVEngine(model_path=os.path.join(BASE_DIR, "face_landmarker.task"))

class Base64ImagePayload(BaseModel):
    image_base64: str

@app.get("/health")
@app.get("/api/health")
@app.get("/api/py/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Romancham AI Core",
        "engine_ready": True,
        "has_landmarker": engine.landmarker is not None
    }

@app.post("/analyze-beard")
@app.post("/api/analyze-beard")
@app.post("/api/py/analyze-beard")
async def analyze_beard(request: Request):
    """
    Accepts either multipart file upload or JSON payload with base64 image.
    Processes image with MediaPipe Face Mesh and OpenCV morphological skeletonization.
    Returns hair count, cyberpunk overlay mask, heatmap, and biometric follicle analytics.
    """
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
        # Try raw body
        raw_body = await request.body()
        if len(raw_body) > 100:
            image_bytes = raw_body

    if not image_bytes or len(image_bytes) < 100:
        raise HTTPException(status_code=400, detail="No image provided or image data corrupt. Send multipart 'file' or JSON 'image_base64'.")

    try:
        # Run computer vision pipeline
        cv_result = engine.process_image(image_bytes)

        # Calculate biometric metrics
        metrics = calculate_beard_metrics(
            raw_hair_count=cv_result["hair_count"],
            left_hairs=cv_result["left_hairs"],
            right_hairs=cv_result["right_hairs"],
            roi_area_px=cv_result["roi_area_px"],
            density_cm2=cv_result["density_cm2"],
            roi_area_cm2=cv_result["roi_area_cm2"],
            is_face_detected=cv_result["is_face_detected"]
        )

        return {
            "success": True,
            "metrics": metrics,
            "cv_details": {
                "bounding_box": cv_result["bounding_box"],
                "dimensions": cv_result["dimensions"],
                "roi_area_px": cv_result["roi_area_px"],
                "roi_polygon": cv_result["roi_polygon"]
            },
            "overlay_mask_b64": cv_result["overlay_mask_b64"],
            "heatmap_mask_b64": cv_result["heatmap_mask_b64"]
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Computer Vision processing failed: {str(e)}")

@app.get("/samples")
@app.get("/api/samples")
@app.get("/api/py/samples")
def get_samples():
    """
    Returns preloaded sample bearded portraits so users can test immediately.
    """
    samples_dir = os.path.join(BASE_DIR, "samples")
    samples_list = []
    if os.path.exists(samples_dir):
        for img_path in glob.glob(f"{samples_dir}/*.jpg") + glob.glob(f"{samples_dir}/*.png"):
            filename = os.path.basename(img_path)
            try:
                with open(img_path, "rb") as f:
                    b64 = f"data:image/jpeg;base64,{base64.b64encode(f.read()).decode('utf-8')}"
                samples_list.append({
                    "id": os.path.splitext(filename)[0],
                    "title": filename.replace("_", " ").replace(".jpg", "").replace(".png", "").title(),
                    "image_b64": b64
                })
            except Exception:
                pass

    return {"samples": samples_list}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
