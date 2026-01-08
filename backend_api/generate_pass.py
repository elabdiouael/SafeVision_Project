# FILE: backend_api/generate_pass.py
from passlib.context import CryptContext

# Configuration Hash
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

print("\n--- GENERATEUR DE HASH ---")
password = "123456"
hashed_password = pwd_context.hash(password)

print(f"Mot de passe: {password}")
print(f"Ton Hash (A COPIER): {hashed_password}")
print("--------------------------\n")