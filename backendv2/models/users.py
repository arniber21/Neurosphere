from pydantic import BaseModel
from typing import List
from models.scans import Scan

class NeurospherePerson(BaseModel):
    name: str
    num_appointments: int
    num_brain_tumors: int
    last_appointment: str
    files: List[Scan]