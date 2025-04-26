from pydantic import BaseModel
from datetime import datetime

class NueroData(BaseModel):
    name: str,
    scans: list[ScanInfo]
    
class ScanInfo:
    def __init__(self, date, status, tumor_detected, location, size, notes, visualization_url, original_image_url, doctor, created_at, stage, progress):
        self.date = date
        self.status = status
        self.tumor_detected = tumor_detected
        self.location = location
        self.size = size
        self.notes = notes
        self.visualization_url = visualization_url
        self.original_image_url = original_image_url
        self.doctor = doctor
        self.created_at = datatime.now().isoformat()
        self.stage = stage
        self.progress = progress