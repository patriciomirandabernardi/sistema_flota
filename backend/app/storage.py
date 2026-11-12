"""
Ubicación centralizada de los archivos subidos por los usuarios.

Se usa una ruta absoluta derivada de la posición de este archivo (y no una
ruta relativa como "uploads/facturas") para que funcione sin importar desde
qué carpeta se haya ejecutado uvicorn.
"""
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BACKEND_DIR / "uploads"
FACTURAS_DIR = UPLOADS_DIR / "facturas"

# Prefijo público con el que se sirven las facturas (ver app.mount en main.py)
FACTURAS_URL_PREFIX = "/facturas"


def asegurar_directorios() -> None:
    """Crea la carpeta de facturas si todavía no existe."""
    FACTURAS_DIR.mkdir(parents=True, exist_ok=True)
