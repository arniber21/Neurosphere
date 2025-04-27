from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pymongo.mongo_client import MongoClient
import os
import uuid
import json
from datetime import datetime, timedelta
from typing import Optional
import httpx
from clerk_backend_api import Clerk
from clerk_backend_api.jwks_helpers import authenticate_request, AuthenticateRequestOptions

# Initialize FastAPI
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    # Allow only the frontend origin and enable credentials
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MongoDB
mongo_uri = f"mongodb+srv://{os.getenv('MONGO_USERNAME')}:{os.getenv('MONGO_PASSWORD')}@cluster0.5pxx9.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(mongo_uri)
db = client.neurosphere
scans_collection = db.scans
visualizations_collection = db.visualizations

# Ensure storage directories exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("thumbnails", exist_ok=True)
os.makedirs("visualizations_html", exist_ok=True)

# Serve static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/thumbnails", StaticFiles(directory="thumbnails"), name="thumbnails")

# Dependency: Clerk authentication
def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    token = auth_header.split(" ", 1)[1]
    # Initialize Clerk SDK
    clerk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))
    # Build an httpx.Request for verification
    httpx_req = httpx.Request(request.method, str(request.url), headers=dict(request.headers))
    # Configure authorized parties
    authorized_parties = os.getenv("CLERK_AUTHORIZED_PARTIES", "").split(",") if os.getenv("CLERK_AUTHORIZED_PARTIES") else []
    auth_options = AuthenticateRequestOptions(authorized_parties=authorized_parties)
    # Authenticate
    state = clerk.authenticate_request(httpx_req, auth_options)
    if not state.is_signed_in:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    return state.payload  # payload contains claims (e.g., sub for user_id)

# Endpoint: Validate user session
def validate_user(current_payload = Depends(get_current_user)):
    return {
        "isAuthenticated": True,
        "userId": current_payload.sub,
        "permissions": ["read:scans", "write:scans"]
    }

@app.get("/api/auth/validate")
async def api_validate_user(current_payload = Depends(get_current_user)):
    return validate_user(current_payload)

# Background task: process CT scan
def process_scan_task(scan_id: str):
    stages = [("uploading", 10), ("processing", 50), ("building_3d_model", 75)]
    for stage, progress in stages:
        scans_collection.update_one({"_id": scan_id}, {"$set": {"stage": stage, "progress": progress}})
        import time; time.sleep(1)
    # Finalize scan
    result = {
        "tumorDetected": True,
        "location": "Frontal lobe",
        "size": "2.3cm",
        "notes": "Tumor detected in the frontal lobe region.",
        "thumbnailUrl": f"/thumbnails/{scan_id}.jpg",
        "updatedAt": datetime.utcnow()
    }
    scans_collection.update_one({"_id": scan_id}, {"$set": {"status": "completed", **result, "progress": 100, "stage": "completed"}})

# Endpoint: Upload CT scan
@app.post("/api/scans/upload")
async def upload_scan(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    metadata: str = Form(...),
    current_payload = Depends(get_current_user)
):
    # Validate file extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "dcm"):
        raise HTTPException(status_code=400, detail="Invalid file type")
    user_id = current_payload.sub
    scan_id = str(uuid.uuid4())
    # Save file locally
    upload_name = f"{scan_id}_{file.filename}"
    upload_path = os.path.join("uploads", upload_name)
    contents = await file.read()
    with open(upload_path, "wb") as f:
        f.write(contents)
    # Parse metadata JSON
    try:
        meta_obj = json.loads(metadata)
    except:
        raise HTTPException(status_code=400, detail="Invalid metadata JSON")
    now = datetime.utcnow()
    est_complete = now + timedelta(minutes=5)
    scans_collection.insert_one({
        "_id": scan_id,
        "user_id": user_id,
        "created_at": now,
        "status": "processing",
        "stage": "queued",
        "progress": 0,
        "metadata": meta_obj,
        "file_url": f"/uploads/{upload_name}",
        "estimated_completion_time": est_complete
    })
    background_tasks.add_task(process_scan_task, scan_id)
    return {
        "scanId": scan_id,
        "status": "processing",
        "createdAt": now.isoformat() + "Z",
        "estimatedCompletionTime": est_complete.isoformat() + "Z"
    }

# Endpoint: List scans
@app.get("/api/scans")
def list_scans(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    current_payload = Depends(get_current_user)
):
    user_id = current_payload.sub
    query = {"user_id": user_id}
    if status:
        query["status"] = status
    total = scans_collection.count_documents(query)
    total_pages = (total + limit - 1) // limit
    cursor = scans_collection.find(query).sort("created_at", -1).skip((page-1)*limit).limit(limit)
    scans = []
    for doc in cursor:
        scans.append({
            "id": doc["_id"],
            "date": doc["created_at"].isoformat() + "Z",
            "status": doc["status"],
            "tumorDetected": doc.get("tumorDetected"),
            "location": doc.get("location"),
            "size": doc.get("size"),
            "thumbnailUrl": doc.get("thumbnailUrl")
        })
    return {"scans": scans, "total": total, "page": page, "totalPages": total_pages}

# Endpoint: Get scan details
@app.get("/api/scans/{scan_id}")
def get_scan_details(scan_id: str, current_payload = Depends(get_current_user)):
    user_id = current_payload.sub
    doc = scans_collection.find_one({"_id": scan_id, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {
        "id": doc["_id"],
        "date": doc["created_at"].isoformat() + "Z",
        "status": doc["status"],
        "tumorDetected": doc.get("tumorDetected"),
        "location": doc.get("location"),
        "size": doc.get("size"),
        "notes": doc.get("notes"),
        "visualizationUrl": doc.get("visualizationId") and f"/api/visualizations/{doc.get('visualizationId')}",
        "originalImageUrl": doc.get("file_url"),
        "doctor": doc.get("doctor"),
        "createdAt": doc["created_at"].isoformat() + "Z",
        "updatedAt": doc.get("updatedAt") and doc.get("updatedAt").isoformat() + "Z"
    }

# Endpoint: Check scan status
@app.get("/api/scans/{scan_id}/status")
def check_scan_status(scan_id: str, current_payload = Depends(get_current_user)):
    user_id = current_payload.sub
    doc = scans_collection.find_one({"_id": scan_id, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Scan not found")
    now = datetime.utcnow()
    est_remain = int((doc["estimated_completion_time"] - now).total_seconds()) if doc.get("estimated_completion_time") else None
    return {
        "id": doc["_id"],
        "status": doc["status"],
        "progress": doc.get("progress"),
        "stage": doc.get("stage"),
        "estimatedTimeRemaining": est_remain
    }

# Background task: generate 3D visualization
def generate_visualization_task(viz_id: str, scan_id: str, params: dict):
    import time
    for step in range(1, 4):
        visualizations_collection.update_one({"_id": viz_id}, {"$set": {"status": "processing", "progress": step * 30}})
        time.sleep(1)
    html_content = f"<html><body><h1>3D Visualization for {scan_id}</h1></body></html>"
    html_path = os.path.join("visualizations_html", f"{viz_id}.html")
    with open(html_path, "w") as f:
        f.write(html_content)
    visualizations_collection.update_one({"_id": viz_id}, {"$set": {"status": "completed", "updated_at": datetime.utcnow()}})

# Endpoint: Generate 3D model
@app.post("/api/scans/{scan_id}/visualize")
def generate_visualization(
    scan_id: str,
    params: dict,
    background_tasks: BackgroundTasks,
    current_payload = Depends(get_current_user)
):
    user_id = current_payload.sub
    if not scans_collection.find_one({"_id": scan_id, "user_id": user_id}):
        raise HTTPException(status_code=404, detail="Scan not found")
    viz_id = str(uuid.uuid4())
    now = datetime.utcnow()
    est_complete = now + timedelta(minutes=5)
    visualizations_collection.insert_one({
        "_id": viz_id,
        "scan_id": scan_id,
        "user_id": user_id,
        "created_at": now,
        "status": "processing",
        "params": params,
        "estimated_completion_time": est_complete
    })
    scans_collection.update_one({"_id": scan_id}, {"$set": {"visualizationId": viz_id}})
    background_tasks.add_task(generate_visualization_task, viz_id, scan_id, params)
    return {
        "visualizationId": viz_id,
        "status": "processing",
        "estimatedCompletionTime": est_complete.isoformat() + "Z"
    }

# Endpoint: Get visualization HTML
@app.get("/api/visualizations/{viz_id}")
def get_visualization(viz_id: str, current_payload = Depends(get_current_user)):
    user_id = current_payload.sub
    doc = visualizations_collection.find_one({"_id": viz_id, "user_id": user_id})
    if not doc or doc["status"] != "completed":
        raise HTTPException(status_code=404, detail="Visualization not ready")
    html_path = os.path.join("visualizations_html", f"{viz_id}.html")
    if not os.path.exists(html_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(html_path, media_type="text/html")

# Endpoint: User dashboard stats
@app.get("/api/users/stats")
def get_user_stats(current_payload = Depends(get_current_user)):
    user_id = current_payload.sub
    now = datetime.utcnow()
    total_scans = scans_collection.count_documents({"user_id": user_id})
    first_day = datetime(now.year, now.month, 1)
    scans_this_month = scans_collection.count_documents({"user_id": user_id, "created_at": {"$gte": first_day}})
    tumors_detected = scans_collection.count_documents({"user_id": user_id, "tumorDetected": True})
    tumor_percentage = int((tumors_detected / total_scans * 100)) if total_scans else 0
    last_scan = scans_collection.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    if last_scan:
        last_date = last_scan["created_at"]
        days_ago = (now - last_date).days
        last_date_str = last_date.isoformat() + "Z"
    else:
        last_date_str = None
        days_ago = None
    return {
        "totalScans": total_scans,
        "scansThisMonth": scans_this_month,
        "tumorsDetected": tumors_detected,
        "tumorPercentage": tumor_percentage,
        "lastScanDate": last_date_str,
        "lastScanDaysAgo": days_ago
    }

# Stub for MRI heatmap AI model
def generate_mri_heatmap(input_path: str, output_path: str):
    """
    Call your AI model here to generate the MRI heatmap from input_path and write it to output_path.
    """
    # TODO: integrate your AI model inference here
    pass

# Endpoint: Generate MRI heatmap
@app.post("/api/mri/heatmap")
async def mri_heatmap(
    file: UploadFile = File(...),
    current_payload = Depends(get_current_user)
):
    # Validate file extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "dcm"):
        raise HTTPException(status_code=400, detail="Invalid file type")
    # Save input MRI image
    input_filename = f"mri_input_{uuid.uuid4()}.{ext}"
    input_path = os.path.join("uploads", input_filename)
    contents = await file.read()
    with open(input_path, "wb") as f:
        f.write(contents)
    # Prepare output path for heatmap
    output_filename = f"mri_heatmap_{uuid.uuid4()}.png"
    output_path = os.path.join("uploads", output_filename)
    # Generate heatmap via AI model stub
    generate_mri_heatmap(input_path, output_path)
    # Return the resulting heatmap image
    return FileResponse(output_path, media_type="image/png")