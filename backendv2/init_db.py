"""
Initialize the MongoDB database with sample data for Neurosphere.
Run this script once to set up the database with test data.
"""

import os
import uuid
from datetime import datetime, timedelta
from pymongo import MongoClient
import random
import shutil

# Default MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client.neurosphere

# Clear existing collections
db.scans.drop()
db.visualizations.drop()

# Create sample directories if they don't exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("thumbnails", exist_ok=True)
os.makedirs("visualizations_html", exist_ok=True)

# Sample data
scan_statuses = ["completed", "processing"]
tumor_locations = ["Frontal lobe", "Temporal lobe", "Parietal lobe", "Occipital lobe", "Cerebellum"]
tumor_sizes = ["1.2cm", "1.8cm", "2.3cm", "3.1cm", "0.9cm"]

# Generate random dates within the last 3 months
def random_date():
    days_ago = random.randint(0, 90)
    return datetime.utcnow() - timedelta(days=days_ago)

# Create sample visualization HTML
def create_sample_visualization(viz_id):
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>3D Brain Visualization</title>
        <style>
            body {{
                margin: 0;
                padding: 0;
                overflow: hidden;
                background-color: #f0f0f0;
                font-family: Arial, sans-serif;
            }}
            #container {{
                width: 100%;
                height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }}
            #brain-model {{
                width: 100%;
                height: 80vh;
                background-color: #000;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
            }}
            #controls {{
                margin-top: 20px;
                display: flex;
                gap: 10px;
            }}
            .btn {{
                padding: 8px 16px;
                background-color: #4a5568;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }}
            .tumor {{
                color: #f56565;
                font-weight: bold;
            }}
        </style>
    </head>
    <body>
        <div id="container">
            <div id="brain-model">
                <div>
                    3D Brain Model <span class="tumor">(Visualization ID: {viz_id})</span>
                    <div style="font-size: 0.8rem; margin-top: 10px;">
                        This is a simulated visualization for demonstration purposes.
                    </div>
                </div>
            </div>
            <div id="controls">
                <button class="btn">Rotate</button>
                <button class="btn">Zoom</button>
                <button class="btn">Highlight Tumor</button>
                <button class="btn">Reset View</button>
            </div>
        </div>
        <script>
            // Simple demo script
            document.querySelectorAll('.btn').forEach(btn => {{
                btn.addEventListener('click', () => {{
                    alert('This is a demo visualization. In a real application, this would trigger 3D model interactions.');
                }});
            }});
        </script>
    </body>
    </html>
    """
    html_path = os.path.join("visualizations_html", f"{viz_id}.html")
    with open(html_path, "w") as f:
        f.write(html_content)
    return html_path

# Insert sample scans
scans = []
for i in range(15):
    # Determine status and related properties
    scan_id = str(uuid.uuid4())
    created_at = random_date()
    
    # 80% completed, 20% processing
    status = scan_statuses[0] if random.random() < 0.8 else scan_statuses[1]
    
    # Basic scan data
    scan = {
        "_id": scan_id,
        "created_at": created_at,
        "status": status,
        "stage": "completed" if status == "completed" else random.choice(["uploading", "processing", "building_3d_model"]),
        "progress": 100 if status == "completed" else random.randint(10, 90),
        "file_url": f"/uploads/{scan_id}_sample.jpg",
        "estimated_completion_time": created_at + timedelta(minutes=5)
    }
    
    # For completed scans, add result data
    if status == "completed":
        # 70% chance of tumor detected for completed scans
        tumor_detected = random.random() < 0.7
        
        if tumor_detected:
            scan.update({
                "tumorDetected": True,
                "location": random.choice(tumor_locations),
                "size": random.choice(tumor_sizes),
                "notes": f"Tumor detected in the {scan['location']} region. Recommended for additional clinical evaluation.",
                "thumbnailUrl": f"/thumbnails/{scan_id}.jpg",
                "updatedAt": created_at + timedelta(minutes=random.randint(3, 10))
            })
            
            # Create visualization for some completed scans with tumors
            if random.random() < 0.8:
                viz_id = str(uuid.uuid4())
                create_sample_visualization(viz_id)
                
                # Add visualization reference
                scan["visualizationId"] = viz_id
                
                # Add visualization record
                db.visualizations.insert_one({
                    "_id": viz_id,
                    "scan_id": scan_id,
                    "created_at": scan["updatedAt"],
                    "status": "completed",
                    "updated_at": scan["updatedAt"] + timedelta(minutes=2)
                })
        else:
            scan.update({
                "tumorDetected": False,
                "notes": "No tumor detected. Brain scan appears normal.",
                "thumbnailUrl": f"/thumbnails/{scan_id}.jpg",
                "updatedAt": created_at + timedelta(minutes=random.randint(3, 10))
            })
    
    scans.append(scan)
    
    # Create placeholder thumbnail image
    # In a real app, you would generate actual thumbnails
    # Here we'll just create placeholder files
    if status == "completed":
        with open(os.path.join("thumbnails", f"{scan_id}.jpg"), "w") as f:
            f.write("Placeholder thumbnail")

# Insert all scans
db.scans.insert_many(scans)

print(f"Initialized database with {len(scans)} sample scans")
print(f"- Completed: {len([s for s in scans if s['status'] == 'completed'])}")
print(f"- Processing: {len([s for s in scans if s['status'] == 'processing'])}")
print(f"- With tumor: {len([s for s in scans if s.get('tumorDetected') == True])}")
print(f"- Visualizations: {db.visualizations.count_documents({})}")
print("\nDatabase initialization complete.") 