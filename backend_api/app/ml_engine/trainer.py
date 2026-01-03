import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os

# 1. Hna kan-wrriw l python fin 7na (Chemins absolus)
# Bach may-telfch bin dossier data w dossier app
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(os.path.dirname(CURRENT_DIR)) # Rej3na lor b 2
DATA_DIR = os.path.join(BASE_DIR, "data")

# N-creyiw dossier data ila makanche
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

DATA_PATH = os.path.join(DATA_DIR, "interventions_history.csv")
MODEL_PATH = os.path.join(DATA_DIR, "anomaly_model.pkl")

def generate_and_train():
    print("🤖 Bdina l-Process...")

    # --- PARTIE 1: Création d Data (Simulation) ---
    # Ila mal9ach data, y-sawbha
    if not os.path.exists(DATA_PATH):
        print("⚠️ Data makaynach. Kan-gaddou simulation...")
        data = []
        for _ in range(1000):
            # Normal: 100m kaydar f ~5h
            cable = np.random.normal(100, 20)
            time = (cable / 20) + np.random.normal(0.5, 0.2)
            
            # Anomalies (Ghalat): 5% d l-merrat
            if np.random.random() < 0.05:
                cable = cable * 5  # Bzaf d cable f we9t 9sir!
                
            data.append([cable, time])
        
        df = pd.DataFrame(data, columns=["cable_metres", "temps_heures"])
        df.to_csv(DATA_PATH, index=False)
        print("✅ Fichier CSV t-creya.")
    else:
        print("✅ Data déjà kayna, an-khdmou biha.")
        df = pd.read_csv(DATA_PATH)

    # --- PARTIE 2: Training (L-ma39oul) ---
    print("🧠 Kan-trainiw l-Model...")
    # IsolationForest: Algorithme wa3er l "Detecter l-ghrib"
    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    model.fit(df[["cable_metres", "temps_heures"]])

    # --- PARTIE 3: Sauvegarde ---
    joblib.dump(model, MODEL_PATH)
    print(f"🚀 Model enregistré f: {MODEL_PATH}")

if __name__ == "__main__":
    generate_and_train()