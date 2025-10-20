from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models, database
from .crud import router as crud_router
from .auth import router as auth_router

# Crear la base de datos y las tablas
models.Base.metadata.create_all(bind=database.engine)

# Inicializar la aplicación
app = FastAPI(title="FastAPI CRUD Project")

# 🟦 Habilitar CORS para permitir comunicación frontend-backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Puedes reemplazar "*" por ["http://127.0.0.1:5500"] si quieres más seguridad
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ruta principal
@app.get("/")
def home():
    return {"message": "API is running 🚀"}

# 🔗 Incluir routers
app.include_router(crud_router)
app.include_router(auth_router)
