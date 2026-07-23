from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from PIL import Image
import io
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lobsense-ai")

app = FastAPI(title="Lobsense YOLOv8 AI Model Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("best2.pt")  # MODEL KAMU
logger.info(f"Model loaded: best2.pt | Classes: {model.names}")

@app.get("/")
def root():
    return {
        "status": "success",
        "message": "Lobsense YOLOv8 AI Model Server Running",
        "model": "best2.pt",
        "classes": model.names,
        "endpoint": "/predict (POST)"
    }

@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    img_bytes = await image.read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    orig_w, orig_h = img.size
    logger.info(f"Received image: {orig_w}x{orig_h} ({image.filename})")

    # Run YOLOv8 inference with explicit imgsz matching training config
    # Use conf=0.15 because this model produces low-confidence detections
    results = model.predict(img, conf=0.15, imgsz=640, verbose=False)[0]

    preds = []
    for box in results.boxes:
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])

        # xyxy format (pixel coordinates relative to original image)
        x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]

        # Normalize to 0..1 range relative to original image dimensions
        # This allows frontend to scale correctly regardless of display size
        nx1 = x1 / orig_w
        ny1 = y1 / orig_h
        nx2 = x2 / orig_w
        ny2 = y2 / orig_h

        # Also provide center-xywh in pixel coords for backward compat
        cx = float(box.xywh[0][0])
        cy = float(box.xywh[0][1])
        bw = float(box.xywh[0][2])
        bh = float(box.xywh[0][3])

        preds.append({
            "class": model.names[cls_id],
            "confidence": conf,
            # Normalized bbox [0..1] — preferred by frontend
            "bbox": [nx1, ny1, nx2, ny2],
            # Pixel center-xywh — backward compatibility
            "x": cx,
            "y": cy,
            "width": bw,
            "height": bh,
            # Original image size for reference
            "img_width": orig_w,
            "img_height": orig_h,
        })

    logger.info(f"Predictions: {len(preds)} detections")
    for p in preds:
        logger.info(f"  {p['class']} ({p['confidence']:.2%}) bbox={[round(v,3) for v in p['bbox']]}")

    return {"predictions": preds}
