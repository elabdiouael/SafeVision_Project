from fastapi import APIRouter, HTTPException
import joblib
import os
import csv
from datetime import datetime
from app.schemas.intervention import InterventionCreate, PredictionResult

router = APIRouter()

# --- CONFIGURATION PATHS (CORRECTED) ---
# 1. Hna 7na f: .../backend_api/app/api
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# 2. Rej3na 2 d-darjat bach nwslou l: .../backend_api
BASE_DIR = os.path.dirname(os.path.dirname(CURRENT_DIR))

# 3. Db Path s7i7: .../backend_api/data/anomaly_model.pkl
MODEL_PATH = os.path.join(BASE_DIR, "data", "anomaly_model.pkl")
HISTORY_PATH = os.path.join(BASE_DIR, "data", "interventions_log.csv")

# --- CHARGEMENT MODEL ---
try:
    model = joblib.load(MODEL_PATH)
    print(f"✅ API: Model chargé depuis {MODEL_PATH}")
except Exception as e:
    print(f"⚠️ API: Erreur chargement model: {e}")
    model = None

# --- HELPER: SAUVEGARDER DANS CSV ---
def save_to_history(data: InterventionCreate, status: str, score: float):
    """Enregistre l'intervention dans un fichier CSV (Audit Log)"""
    file_exists = os.path.isfile(HISTORY_PATH)
    
    try:
        # encoding='utf-8' bach may-tkhbch m3a accents
        with open(HISTORY_PATH, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            # Header ila kan fichier jdid
            if not file_exists:
                writer.writerow(["Date", "Cable_m", "Temps_h", "Status", "Risk_Score"])
            
            # L-Ktbba d l-ligne
            writer.writerow([
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                data.cable_metres,
                data.temps_heures,
                status,
                score
            ])
    except Exception as e:
        print(f"⚠️ Erreur sauvegarde CSV: {e}")

# --- ENDPOINTS ---

@router.post("/predict", response_model=PredictionResult)
def predict_intervention(data: InterventionCreate):
    if not model:
        raise HTTPException(status_code=500, detail="Model AI introuvable. Verifiez le path.")

    # 1. Prediction AI
    features = [[data.cable_metres, data.temps_heures]]
    prediction = model.predict(features)[0]
    score = round(float(model.decision_function(features)[0]), 4)

    # 2. Interpretation Risk Manager
    if prediction == 1:
        status = "NORMAL"
        msg = "✅ Validé. Performance logique."
    else:
        status = "ANOMALY"
        msg = "🚨 ALERTE! Ratio Câble/Temps impossible."

    # 3. SAUVEGARDE (Memoire)
    save_to_history(data, status, score)

    return {"status": status, "risk_score": score, "message": msg}

@router.get("/history")
def get_history():
    """Jib l-historique kaml mn CSV"""
    if not os.path.exists(HISTORY_PATH):
        return []
    
    results = []
    try:
        with open(HISTORY_PATH, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                results.append(row)
        # N-reddouhom m9loubin (Jdid howa lowel)
        return list(reversed(results))
    except Exception as e:
        print(f"Erreur lecture history: {e}")
        return []