from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from . import models, database

router = APIRouter(tags=["Auth"])

# ============================================================
# 🔒 CONFIGURACIÓN DE SEGURIDAD
# ============================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "supersecretkey"  # ⚠️ Cámbialo en producción
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ============================================================
# 🔧 FUNCIONES AUXILIARES
# ============================================================

def get_password_hash(password: str):
    """Cifra una contraseña con bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    """Verifica una contraseña en texto plano con su hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict):
    """Crea un token JWT"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_db():
    """Dependencia de base de datos"""
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================
# 👤 REGISTRO DE USUARIO
# ============================================================

@router.post("/register")
def register(username: str, email: str, password: str, db: Session = Depends(get_db)):
    """Registro de nuevo usuario"""
    # Verificar si ya existe el nombre de usuario
    user_exists = db.query(models.User).filter(models.User.username == username).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")

    # Verificar si ya existe el correo
    email_exists = db.query(models.User).filter(models.User.email == email).first()
    if email_exists:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")

    # Crear usuario nuevo
    hashed_pw = get_password_hash(password)
    new_user = models.User(username=username, email=email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Usuario registrado correctamente ✅"}


# ============================================================
# 🔑 LOGIN DE USUARIO
# ============================================================

@router.post("/login")
def login(data: dict = Body(...), db: Session = Depends(get_db)):
    """
    Login de usuario (JSON):
    {
      "username": "hugo",
      "password": "12345"
    }
    """
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        raise HTTPException(status_code=400, detail="Faltan credenciales")

    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
