from fastapi import APIRouter, HTTPException, File, UploadFile
from fastapi.responses import FileResponse # <-- Import Jdid
from fpdf import FPDF # <-- Import Jdid
import joblib
import os
import csv
import uuid
from datetime import datetime
from app.schemas.intervention import InterventionCreate, PredictionResult
from PIL import Image
import io
import re
import easyocr 
import numpy as np 
import cv2 

router = APIRouter()

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

print("⏳ Initialisation EasyOCR...")
reader = easyocr.Reader(['en', 'fr']) 
print("✅ EasyOCR Wajed!")

# --- 3. CLASS PDF GENERATOR (NEW) 📄 ---
class PDFReport(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'SafeVision - Rapport d\'Audit', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

# --- 4. HELPERS ---

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

# --- 5. ENDPOINTS ---

@router.get("/report/{image_id}")
def generate_report(image_id: str):
    # 1. Chercher info dans CSV
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

    # 2. Création PDF
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

    # Statut Coloré
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(40, 10, "Statut:", 0, 0)
    status = target_row["Status"]
    if status == "NORMAL": pdf.set_text_color(0, 128, 0) # Vert
    else: pdf.set_text_color(255, 0, 0) # Rouge
    
    pdf.cell(0, 10, status, 0, 1)
    pdf.set_text_color(0, 0, 0) # Reset Noir
    pdf.ln(5)

    # Données Techniques
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(0, 10, "Détails Techniques", 0, 1)
    pdf.set_font("Arial", '', 12)
    
    pdf.cell(50, 10, f"Longueur Câble:", 1)
    pdf.cell(0, 10, f"{target_row['Cable_m']} m", 1, 1)
    pdf.cell(50, 10, f"Temps Passé:", 1)
    pdf.cell(0, 10, f"{target_row['Temps_h']} h", 1, 1)
    pdf.ln(10)

    # Preuve Image
    image_path = os.path.join(UPLOAD_DIR, image_id)
    if os.path.exists(image_path):
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(0, 10, "Preuve Visuelle", 0, 1)
        pdf.ln(5)
        try:
            pdf.image(image_path, x=10, w=100)
        except: pass
    
    # Output
    report_filename = f"Rapport_{image_id}.pdf"
    report_path = os.path.join(UPLOAD_DIR, report_filename)
    pdf.output(report_path)

    return FileResponse(report_path, media_type='application/pdf', filename=report_filename)

@router.post("/predict", response_model=PredictionResult)
def predict_intervention(data: InterventionCreate):
    # Business Rules
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
def get_history():
    if not os.path.exists(HISTORY_PATH): return []
    try:
        with open(HISTORY_PATH, mode='r', encoding='utf-8') as f:
            return list(reversed(list(csv.DictReader(f))))
    except: return []

@router.post("/ocr")
async def analyze_image(file: UploadFile = File(...)):
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