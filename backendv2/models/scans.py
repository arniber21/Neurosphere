from pydantic import BaseModel
from datetime import datetime

class Scan(BaseModel):
    tumor_detected: bool
    location: str
    size: str
    notes: str
    visualization_url: str
    original_image_url: str
    doctor: str
    created_at: str = datetime.now().isoformat()
    stage: str
    progress: str