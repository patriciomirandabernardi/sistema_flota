from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import Base, engine
from app.models import vehiculo, sistema, tarea, usuario, orden  # noqa: F401 - asegura el registro de los modelos
from app.routers import vehiculos, catalogos, ordenes, usuarios, dashboard
from app.storage import asegurar_directorios

Base.metadata.create_all(bind=engine)

# Crea backend/uploads/facturas si todavía no existe.
asegurar_directorios()

app = FastAPI(title="Sistema de Flota Imcayper S.A.")

# Lista VIP fijada a mano para evitar problemas de variables de entorno en Windows
origenes_permitidos = [
    "http://localhost:5173",
    "http://140.191.1.137:8080",
    "http://140.191.1.137"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origenes_permitidos,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def manejar_errores_validacion(request: Request, exc: RequestValidationError):
    # Las reglas de negocio de los schemas (validadores que lanzan ValueError,
    # ej: kilometraje obligatorio en preventivos) se devuelven como 400 con un
    # mensaje legible en "detail", igual que el resto de los errores de negocio
    # de la API. Los errores de tipo/campos faltantes siguen siendo 422.
    errores_negocio = [e for e in exc.errors() if e.get("type") == "value_error"]
    if errores_negocio:
        mensaje = str(errores_negocio[0].get("msg", ""))
        if mensaje.startswith("Value error, "):
            mensaje = mensaje[len("Value error, "):]
        return JSONResponse(status_code=400, content={"detail": mensaje})
    return await request_validation_exception_handler(request, exc)


# Las facturas NO se sirven con StaticFiles: se entregan por el endpoint
# GET /ordenes/{id}/factura/pdf, que exige token de usuario autenticado.

app.include_router(vehiculos.router)
app.include_router(catalogos.router)
app.include_router(ordenes.router)
app.include_router(usuarios.router)
app.include_router(dashboard.router)


@app.get("/")
def read_root():
    return {"status": "ok", "mensaje": "Sistema de Gestión de Flota"}