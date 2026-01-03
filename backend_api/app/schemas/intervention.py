from pydantic import BaseModel

# Hada chenou kantsnaw mn l-App (Input)
class InterventionCreate(BaseModel):
    cable_metres: float
    temps_heures: float

    # Exemple bach yban f Documentation
    class Config:
        json_schema_extra = {
            "example": {
                "cable_metres": 100.0,
                "temps_heures": 5.0
            }
        }

# Hada chenou ghadi n-reddo (Output)
class PredictionResult(BaseModel):
    status: str      # "NORMAL" wla "ANOMALY"
    risk_score: float # Score: Koul ma kan negative, koul ma l-ghalat kbir
    message: str