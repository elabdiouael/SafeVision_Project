from fastapi import APIRouter, HTTPException, File, UploadFile, Depends, status
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fpdf import FPDF
import joblib
import os
import csv
import uuid
from datetime import datetime
from app.schemas.intervention import InterventionCreate, PredictionResult
from app.core.security import create_access_token, verify_password, get_password_hash, SECRET_KEY, ALGORITHM
from jose import JWTError, jwt
from PIL import Image
import io
import re
import easyocr 
import numpy as np 
import cv2 

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

# --- 0. FAKE DATABASE (AUTHENTIFICATION) ---
# Mot de passe pour les deux est "123456"
# Hash: $2b$12$UVmCj2OLZowuQXxk.CXKoud0sI9JXywbsYAGUVUYo1FnNMGNlf8NW
FAKE_USERS_DB = {
    "admin": {
        "username": "admin",
        "full_name": "Chef de Projet",
        "role": "admin",
        "hashed_password": "$2b$12$UVmCj2OLZowuQXxk.CXKoud0sI9JXywbsYAGUVUYo1FnNMGNlf8NW", 
        "disabled": False,
    },
    "tech": {
        "username": "tech",
        "full_name": "Technicien Fibre",
        "role": "tech",
        "hashed_password": "$2b$12$UVmCj2OLZowuQXxk.CXKoud0sI9JXywbsYAGUVUYo1FnNMGNlf8NW",
        "disabled": False,
    }
}

# --- 1. CONFIGURATION PATHS ---
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(os.path.dirname(CURRENT_DIR))

MODEL_PATH = os.path.join(BASE_DIR, "data", "anomaly_model.pkl")
HISTORY_PATH = os.path.join(BASE_DIR, "data", "interventions_log.csv")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- 2. LOAD MODELS ---
try:
    model = joblib.load(MODEL_PATH)
    print(f"✅ API: Risk Model chargé")
except:
    model = None
    print(f"⚠️ API: Risk Model MAL9INAHCH")

print("⏳ Initialisation EasyOCR...")
reader = easyocr.Reader(['en', 'fr']) 
print("✅ EasyOCR Wajed!")

# --- 3. SECURITY HELPERS ---
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credentials invalid",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = FAKE_USERS_DB.get(username)
    if user is None:
        raise credentials_exception
    return user

# --- 4. LOGIN ENDPOINT ---
@router.post("/login")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = FAKE_USERS_DB.get(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["username"]})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": user["role"],
        "username": user["username"]
    }

# --- 5. CLASS PDF GENERATOR ---
class PDFReport(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'SafeVision - Rapport d\'Audit', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

# --- 6. HELPERS ---
def save_to_history(data, status, score):
    try:
        file_exists = os.path.isfile(HISTORY_PATH)
        with open(HISTORY_PATH, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            if not file_exists:
                writer.writerow(["Date", "Cable_m", "Temps_h", "Status", "Risk_Score", "Image_ID"])
            
            writer.writerow([
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                data.cable_metres,
                data.temps_heures,
                status,
                score,
                data.image_id if data.image_id else "N/A"
            ])
    except Exception as e:
        print(f"⚠️ CSV Error: {e}")

def preprocess_image(image_np):
    if len(image_np.shape) == 3:
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
    else:
        gray = image_np

    if np.mean(gray) < 127:
        gray = cv2.bitwise_not(gray)

    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresh

def extract_data_from_list(text_list):
    full_text = " ".join(text_list).lower()
    full_text = re.sub(r'\d{1,2}\s*[/-]\s*\d{1,2}\s*[/-]\s*\d{2,4}', ' ', full_text)
    full_text = re.sub(r'[|\-_:]', ' ', full_text)
    full_text = re.sub(r'\s+', ' ', full_text)
    
    print(f"🔍 OCR Cleaned: {full_text}")

    data = {"cable_metres": None, "temps_heures": None}

    # PLAN A: Unités
    strict_cable = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:m|metre)\b", full_text)
    if strict_cable:
        try: 
            val = float(strict_cable.group(1).replace(',', '.'))
            if not (2020 <= val <= 2030): data["cable_metres"] = val
        except: pass

    strict_time = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:h|heure)\b", full_text)
    if strict_time:
        try: data["temps_heures"] = float(strict_time.group(1).replace(',', '.'))
        except: pass

    # PLAN B: Mots-clés
    if data["cable_metres"] is None:
        cable_match = re.search(r"cable.*?(\d+(?:[.,]\d+)?)", full_text)
        if cable_match:
            try: 
                val = float(cable_match.group(1).replace(',', '.'))
                if val > 10 and not (2020 <= val <= 2030): data["cable_metres"] = val
            except: pass

    if data["temps_heures"] is None:
        time_match = re.search(r"(?:temps|duree).*?(\d+(?:[.,]\d+)?)", full_text)
        if time_match:
            try: 
                val = float(time_match.group(1).replace(',', '.'))
                if val < 24: data["temps_heures"] = val
            except: pass

    # PLAN C: Magnitude
    if data["cable_metres"] is None or data["temps_heures"] is None:
        all_numbers = re.findall(r"(\d+(?:[.,]\d+)?)", full_text)
        values = []
        for num in all_numbers:
            try: values.append(float(num.replace(',', '.')))
            except: pass
            
        for val in values:
            if 2020 <= val <= 2030: continue 
            if data["cable_metres"] is None and val > 40: data["cable_metres"] = val
            elif data["temps_heures"] is None and 0.5 <= val < 24: data["temps_heures"] = val

    return data, full_text

# --- 7. CORE ENDPOINTS ---

@router.get("/report/{image_id}")
def generate_report(image_id: str):
    target_row = None
    if os.path.exists(HISTORY_PATH):
        with open(HISTORY_PATH, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("Image_ID") == image_id:
                    target_row = row
                    break
    
    if not target_row:
        raise HTTPException(status_code=404, detail="ID introuvable")

    pdf = PDFReport()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    # Info Scan
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(0, 10, f"Réf Scan: {image_id}", 0, 1, 'L', fill=True)
    pdf.ln(5)
    
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(40, 10, "Date Audit:", 0, 0)
    pdf.set_font("Arial", '', 12)
    pdf.cell(0, 10, target_row["Date"], 0, 1)

    pdf.set_font("Arial", 'B', 12)
    pdf.cell(40, 10, "Statut:", 0, 0)
    status = target_row["Status"]
    if status == "NORMAL": pdf.set_text_color(0, 128, 0) 
    else: pdf.set_text_color(255, 0, 0) 
    
    pdf.cell(0, 10, status, 0, 1)
    pdf.set_text_color(0, 0, 0) 
    pdf.ln(5)

    pdf.set_font("Arial", 'B', 14)
    pdf.cell(0, 10, "Détails Techniques", 0, 1)
    pdf.set_font("Arial", '', 12)
    
    pdf.cell(50, 10, f"Longueur Câble:", 1)
    pdf.cell(0, 10, f"{target_row['Cable_m']} m", 1, 1)
    pdf.cell(50, 10, f"Temps Passé:", 1)
    pdf.cell(0, 10, f"{target_row['Temps_h']} h", 1, 1)
    pdf.ln(10)

    image_path = os.path.join(UPLOAD_DIR, image_id)
    if os.path.exists(image_path):
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(0, 10, "Preuve Visuelle", 0, 1)
        pdf.ln(5)
        try:
            pdf.image(image_path, x=10, w=100)
        except: pass
    
    report_filename = f"Rapport_{image_id}.pdf"
    report_path = os.path.join(UPLOAD_DIR, report_filename)
    pdf.output(report_path)

    return FileResponse(report_path, media_type='application/pdf', filename=report_filename)

@router.post("/predict", response_model=PredictionResult)
def predict_intervention(data: InterventionCreate, current_user: dict = Depends(get_current_user)):
    # 🔒 PROTECTED
    if data.temps_heures and data.temps_heures > 0:
        speed = data.cable_metres / data.temps_heures
        if speed < 10: 
            save_to_history(data, "ANOMALY", 0.99)
            return {"status": "ANOMALY", "risk_score": 0.99, "message": "🚨 Trop Lent!"}
        if speed > 500: 
            save_to_history(data, "ANOMALY", 0.99)
            return {"status": "ANOMALY", "risk_score": 0.99, "message": "🚨 Trop Rapide!"}

    if not model: 
        save_to_history(data, "NORMAL", 0.0)
        return {"status": "NORMAL", "risk_score": 0.0, "message": "✅ Validé (Règles)."}

    features = [[data.cable_metres, data.temps_heures]]
    prediction = model.predict(features)[0]
    try: score = round(float(model.decision_function(features)[0]), 4)
    except: score = 0.0
    
    status = "NORMAL" if prediction == 1 else "ANOMALY"
    msg = "✅ Validé par IA." if status == "NORMAL" else "🚨 ALERTE IA!"
    
    save_to_history(data, status, score)
    return {"status": status, "risk_score": score, "message": msg}

@router.get("/history")
def get_history(current_user: dict = Depends(get_current_user)):
    # 🔒 PROTECTED
    if not os.path.exists(HISTORY_PATH): return []
    try:
        with open(HISTORY_PATH, mode='r', encoding='utf-8') as f:
            return list(reversed(list(csv.DictReader(f))))
    except: return []

@router.post("/ocr")
async def analyze_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    # 🔒 PROTECTED
    try:
        file_ext = file.filename.split('.')[-1]
        unique_id = f"scan_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}"
        filename = f"{unique_id}.{file_ext}"
        file_location = os.path.join(UPLOAD_DIR, filename)

        image_content = await file.read()
        with open(file_location, "wb") as f_disk:
            f_disk.write(image_content)

        image = Image.open(io.BytesIO(image_content))
        image_np = np.array(image)
        processed_img = preprocess_image(image_np)
        
        result_list = reader.readtext(processed_img, detail=0)
        extracted_data, full_text = extract_data_from_list(result_list)
        
        return {
            "status": "success", "data": extracted_data, 
            "raw_text": full_text, "image_id": filename 
        }
    except Exception as e:
        print(f"❌ Error: {e}")
        return {"status": "error", "message": str(e)}

# --- NEW: STATS FOR DASHBOARD ---
@router.get("/stats")
def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    # 🔒 PROTECTED
    total = 0
    anomalies = 0
    total_cable = 0
    
    if os.path.exists(HISTORY_PATH):
        try:
            with open(HISTORY_PATH, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                rows = list(reader)
                total = len(rows)
                for row in rows:
                    if row["Status"] == "ANOMALY":
                        anomalies += 1
                    try: total_cable += float(row["Cable_m"])
                    except: pass
        except: pass
    
    success_rate = 100
    if total > 0:
        success_rate = round(((total - anomalies) / total) * 100, 1)

    return {
        "total_interventions": total,
        "anomalies_count": anomalies,
        "success_rate": success_rate,
        "total_cable_km": round(total_cable / 1000, 2)
    }