from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io

app = FastAPI(title="Lobsense YOLOv8 AI Model Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("best2.pt")  # MODEL KAMU

@app.get("/")
def root():
    return {
        "status": "success",
        "message": "Lobsense YOLOv8 AI Model Server Running",
        "model": "best2.pt",
        "endpoint": "/predict (POST)"
    }

@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    img_bytes = await image.read()
    img = Image.open(io.BytesIO(img_bytes))

    results = model.predict(img, conf=0.40)[0]

    preds = []
    for box in results.boxes:
        cls_id = int(box.cls[0])
        preds.append({
            "class": model.names[cls_id],
            "confidence": float(box.conf[0]),
            "x": float(box.xywh[0][0]),
            "y": float(box.xywh[0][1]),
            "width": float(box.xywh[0][2]),
            "height": float(box.xywh[0][3]),
        })

    return {"predictions": preds}
