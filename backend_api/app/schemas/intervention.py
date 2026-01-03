from pydantic import BaseModel
from typing import Optional

class InterventionCreate(BaseModel):
    cable_metres: float
    temps_heures: float
    # ZIDNA HADI: ID dyal tswira (Optional 7it machi dima kayn scan)
    image_id: Optional[str] = None 

class PredictionResult(BaseModel):
    status: str
    risk_score: float
    message: str