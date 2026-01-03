from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # <-- HADI MOHIMA
import os
from app.api.endpoints import router

app = FastAPI(title="SafeVision API")

# --- CONFIG CORS (Bach Ionic yhder m3a Python) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIG STATIC FILES (Hada howa l-bab d 'uploads') ---
# Hna kanwriw l FastAPI fin ja dossier 'uploads'
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(CURRENT_DIR)
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

# Ila makanch dossier, nsaybouh
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Hna kngolo: Ay URL fih "/uploads", sir 9leb f dossier UPLOAD_DIR
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- ROUTER ---
app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "SafeVision API is running 🚀"}