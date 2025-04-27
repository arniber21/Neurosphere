from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
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
import cv2
import numpy as np

# Import the GradCam functionality
from ml.GradCam import get_cam_overlay

# Initialize FastAPI
app = FastAPI()

# Configure CORS - allow the frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Default Vite dev server
        "http://localhost:3000",  # Alternative development port
        "http://localhost:4173",  # Vite preview
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:4173",
        os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MongoDB
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client.neurosphere
scans_collection = db.scans
visualizations_collection = db.visualizations

# Ensure storage directories exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("thumbnails", exist_ok=True)
os.makedirs("visualizations_html", exist_ok=True)
os.makedirs("heatmaps", exist_ok=True)  # Add directory for heatmaps

# Serve static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/thumbnails", StaticFiles(directory="thumbnails"), name="thumbnails")
app.mount("/heatmaps", StaticFiles(directory="heatmaps"), name="heatmaps")

# Helper function to format responses with proper headers
def create_json_response(content, status_code=200):
    return JSONResponse(
        content=content,
        status_code=status_code,
        headers={"Content-Type": "application/json"}
    )

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
@app.get("/api/auth/validate")
async def api_validate_user():
    return create_json_response({"isAuthenticated": True, "userId": None, "permissions": []})

# Function to generate a heatmap for an MRI scan
def generate_scan_heatmap(input_file_path, scan_id):
    try:
        # Create paths for the heatmap
        heatmap_path = os.path.join("heatmaps", f"{scan_id}_heatmap.jpg")
        
        # Use the GradCam functionality to generate the heatmap
        overlay = get_cam_overlay(input_file_path)
        
        # Save the heatmap
        cv2.imwrite(heatmap_path, overlay)
        
        # Return the relative URL for the heatmap
        return f"/heatmaps/{scan_id}_heatmap.jpg"
    except Exception as e:
        print(f"Error generating heatmap: {e}")
        return None

# Background task: process MRI scan
def process_scan_task(scan_id: str):
    try:
        # Get the scan data from the database
        scan_data = scans_collection.find_one({"_id": scan_id})
        if not scan_data:
            print(f"Scan {scan_id} not found")
            return
        
        # Get the file path from the database
        file_path = scan_data["file_url"].replace("/uploads/", "uploads/")
        
        stages = [("uploading", 10), ("processing", 50), ("building_3d_model", 75)]
        for stage, progress in stages:
            scans_collection.update_one({"_id": scan_id}, {"$set": {"stage": stage, "progress": progress}})
            import time; time.sleep(1)
        
        # Generate the heatmap
        heatmap_url = None
        if os.path.exists(file_path):
            heatmap_url = generate_scan_heatmap(file_path, scan_id)
        
        # Create a thumbnail of the original image
        thumbnail_path = os.path.join("thumbnails", f"{scan_id}.jpg")
        if os.path.exists(file_path):
            try:
                # Load the image and create a thumbnail
                img = cv2.imread(file_path)
                if img is not None:
                    img_resized = cv2.resize(img, (224, 224))
                    cv2.imwrite(thumbnail_path, img_resized)
            except Exception as e:
                print(f"Error creating thumbnail: {e}")
        
        # Finalize scan
        result = {
            "tumorDetected": True,
            "location": "Frontal lobe",
            "size": "2.3cm",
            "notes": "Tumor detected in the frontal lobe region.",
            "thumbnailUrl": f"/thumbnails/{scan_id}.jpg",
            "heatmapUrl": heatmap_url,  # Add the heatmap URL
            "updatedAt": datetime.utcnow()
        }
        scans_collection.update_one({"_id": scan_id}, {"$set": {"status": "completed", **result, "progress": 100, "stage": "completed"}})
    except Exception as e:
        print(f"Error in process_scan_task: {e}")
        # Update the scan status to failed
        scans_collection.update_one({"_id": scan_id}, {"$set": {"status": "failed", "error": str(e)}})

# Endpoint: Upload MRI scan
@app.post("/api/scans/upload")
async def upload_scan(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    metadata: str = Form(...)
):
    # Validate file extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "dcm"):
        raise HTTPException(status_code=400, detail="Invalid file type")
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
        "created_at": now,
        "status": "processing",
        "stage": "queued",
        "progress": 0,
        "metadata": meta_obj,
        "file_url": f"/uploads/{upload_name}",
        "estimated_completion_time": est_complete
    })
    background_tasks.add_task(process_scan_task, scan_id)
    return create_json_response({
        "scanId": scan_id,
        "status": "processing",
        "createdAt": now.isoformat() + "Z",
        "estimatedCompletionTime": est_complete.isoformat() + "Z"
    })

# Endpoint: List scans
@app.get("/api/scans")
def list_scans(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 10
):
    # no authentication: return all scans
    query = {}
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
    return create_json_response({"scans": scans, "total": total, "page": page, "totalPages": total_pages})

# Endpoint: Get scan details
@app.get("/api/scans/{scan_id}")
def get_scan_details(scan_id: str):
    # no authentication: fetch by id only
    doc = scans_collection.find_one({"_id": scan_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Scan not found")
    return create_json_response({
        "id": doc["_id"],
        "date": doc["created_at"].isoformat() + "Z",
        "status": doc["status"],
        "tumorDetected": doc.get("tumorDetected"),
        "location": doc.get("location"),
        "size": doc.get("size"),
        "notes": doc.get("notes"),
        "visualizationUrl": doc.get("visualizationId") and f"/api/visualizations/{doc.get('visualizationId')}",
        "originalImageUrl": doc.get("file_url"),
        "heatmapUrl": doc.get("heatmapUrl"),  # Include the heatmap URL
        "doctor": doc.get("doctor"),
        "createdAt": doc["created_at"].isoformat() + "Z",
        "updatedAt": doc.get("updatedAt") and doc.get("updatedAt").isoformat() + "Z"
    })

# Endpoint: Check scan status
@app.get("/api/scans/{scan_id}/status")
def check_scan_status(scan_id: str):
    # no authentication: fetch by id only
    doc = scans_collection.find_one({"_id": scan_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Scan not found")
    now = datetime.utcnow()
    est_remain = int((doc["estimated_completion_time"] - now).total_seconds()) if doc.get("estimated_completion_time") else None
    return create_json_response({
        "id": doc["_id"],
        "status": doc["status"],
        "progress": doc.get("progress"),
        "stage": doc.get("stage"),
        "estimatedTimeRemaining": est_remain
    })

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
    background_tasks: BackgroundTasks
):
    # no authentication: existence by id only
    if not scans_collection.find_one({"_id": scan_id}):
        raise HTTPException(status_code=404, detail="Scan not found")
    viz_id = str(uuid.uuid4())
    now = datetime.utcnow()
    est_complete = now + timedelta(minutes=5)
    visualizations_collection.insert_one({
        "_id": viz_id,
        "scan_id": scan_id,
        "created_at": now,
        "status": "processing",
        "params": params,
        "estimated_completion_time": est_complete
    })
    scans_collection.update_one({"_id": scan_id}, {"$set": {"visualizationId": viz_id}})
    background_tasks.add_task(generate_visualization_task, viz_id, scan_id, params)
    return create_json_response({
        "visualizationId": viz_id,
        "status": "processing",
        "estimatedCompletionTime": est_complete.isoformat() + "Z"
    })

# Endpoint: Get visualization HTML
@app.get("/api/visualizations/{viz_id}")
def get_visualization(viz_id: str):
    # no authentication: fetch by id only
    doc = visualizations_collection.find_one({"_id": viz_id})
    # if not doc or doc["status"] != "completed":
    #    raise HTTPException(status_code=404, detail="Visualization not ready")
    html_path = os.path.join("visualizations_html", f"{viz_id}.html")
    html_path = os.path.join("visualizations_html", "cells_in_primary_visual_cortex.html")
    print("reached")
    if not os.path.exists(html_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(html_path, media_type="text/html")

# Endpoint: User dashboard stats
@app.get("/api/users/stats")
def get_user_stats():
    # no authentication: global stats
    total_scans = scans_collection.count_documents({})
    completed_scans = scans_collection.count_documents({"status": "completed"})
    processing_scans = scans_collection.count_documents({"status": "processing"})
    tumor_detected = scans_collection.count_documents({"tumorDetected": True})
    
    # Get recent scans
    recent_cursor = scans_collection.find({}).sort("created_at", -1).limit(5)
    recent_scans = []
    for doc in recent_cursor:
        recent_scans.append({
            "id": doc["_id"],
            "date": doc["created_at"].isoformat() + "Z",
            "status": doc["status"],
            "tumorDetected": doc.get("tumorDetected")
        })
    
    return create_json_response({
        "totalScans": total_scans,
        "completedScans": completed_scans,
        "processingScans": processing_scans,
        "tumorDetectedCount": tumor_detected,
        "tumorDetectionRate": tumor_detected / completed_scans if completed_scans > 0 else 0,
        "recentScans": recent_scans
    })

# Add health check endpoint
@app.get("/api/health")
def health_check():
    return create_json_response({"status": "ok", "version": "2.0.0"})

# Endpoint to generate a heatmap for an MRI scan
@app.post("/api/mri/heatmap")
async def mri_heatmap(
    file: UploadFile = File(...)
):
    # Validate file extension
    if not file.filename.lower().endswith((".jpg", ".jpeg", ".png", ".dcm")):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Save uploaded file
    file_id = str(uuid.uuid4())
    input_path = f"uploads/{file_id}_input.jpg"
    
    with open(input_path, "wb") as f:
        f.write(await file.read())
    
    # Generate heatmap using GradCam
    try:
        # Use the GradCam functionality to generate the heatmap
        heatmap_path = f"heatmaps/{file_id}_heatmap.jpg"
        overlay = get_cam_overlay(input_path)
        cv2.imwrite(heatmap_path, overlay)
        
        return create_json_response({
            "heatmapUrl": f"/heatmaps/{file_id}_heatmap.jpg",
            "originalUrl": f"/uploads/{file_id}_input.jpg"
        })
    except Exception as e:
        print(f"Error generating heatmap: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate heatmap: {str(e)}")

# Root endpoint with basic info
@app.get("/")
def read_root():
    return create_json_response({
        "name": "Neurosphere API",
        "version": "2.0.0",
        "status": "running"
    })

# If running this script directly, start the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)