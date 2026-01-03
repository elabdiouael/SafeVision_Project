from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router

app = FastAPI(
    title="SafeVision AI",
    description="Systeme de detection d'anomalies pour Kyntus",
    version="1.0"
)

# CORS: Bach Ionic y9der yhder m3ana bla machakim
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # F Production, dima dir l-IP dyalek exact
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Kan-branchiw les câbles (Router)
app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"status": "Online 🟢", "message": "Risk Manager AI is Watching You"}