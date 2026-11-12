# Manual de Despliegue - Sistema de Flota Imcayper S.A.

Esta guía explica cómo instalar y dejar funcionando de forma permanente el
Sistema de Gestión de Flota en una PC o servidor con **Windows** dentro de la
red local de la fábrica, de modo que cualquier usuario conectado a esa red
(por ejemplo Miguel) pueda acceder escribiendo la IP local de esa PC en su
navegador (ej: `http://192.168.1.50`).

> **Nota técnica importante antes de empezar:** el pedido original de este
> despliegue sugería usar **Waitress** como servidor de producción para la
> API. Sin embargo, Waitress es un servidor **WSGI** (para frameworks como
> Flask o Django), y este backend está construido con **FastAPI**, que usa el
> protocolo **ASGI**. Waitress **no puede ejecutar una aplicación FastAPI
> directamente** — no es compatible.
>
> La alternativa técnicamente correcta y ampliamente recomendada por los
> propios documentos oficiales de FastAPI es ejecutar **Uvicorn** (el mismo
> servidor que usamos en desarrollo) también en producción, sin el flag
> `--reload`, y dejarlo correr de forma persistente como un Servicio de
> Windows (con NSSM). Uvicorn es un servidor productivo real, no solo una
> herramienta de desarrollo — lo único que cambia entre desarrollo y
> producción es cómo se lo arranca y supervisa, no el servidor en sí. Esta
> guía sigue ese enfoque.

---

## 1. Requisitos Previos

Instalar en la PC que actuará como servidor:

1. **Python 3.11 o superior** — [https://www.python.org/downloads/](https://www.python.org/downloads/)
   - Durante la instalación, tildar la casilla **"Add Python to PATH"**.
2. **Node.js 18 LTS o superior** — [https://nodejs.org/](https://nodejs.org/)
   - Esto instala automáticamente `npm`.
3. **Git** (opcional, solo si el código se va a clonar desde un repositorio en
   lugar de copiarse manualmente por USB/red).

Verificar las instalaciones abriendo PowerShell y ejecutando:

```powershell
python --version
node --version
npm --version
```

---

## 2. Configuración del Backend (API - FastAPI)

Todos los comandos de esta sección se ejecutan dentro de la carpeta
`sistema_flota/backend`.

### 2.1. Crear el entorno virtual e instalar dependencias

```powershell
cd sistema_flota\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

> Si PowerShell bloquea la activación del entorno virtual por políticas de
> ejecución de scripts, ejecutar una vez (como administrador):
> `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### 2.2. Configurar variables de entorno de producción

El sistema ya está preparado para leer dos configuraciones sensibles desde
variables de entorno, con valores de desarrollo por defecto que **no deben
usarse en producción**:

| Variable | Qué controla | Valor por defecto (dev) |
|---|---|---|
| `SECRET_KEY` | Clave usada para firmar los tokens JWT de login | `SECRET_KEY_TEMPORAL` |
| `ALLOWED_ORIGINS` | Orígenes (URLs) autorizados a llamar a la API (CORS) | `http://localhost:5173` |

**Generar una clave secreta segura** (ejecutar una sola vez y guardar el
resultado):

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

**Definir las variables de entorno de forma permanente** (nivel de sistema,
para que persistan incluso después de reiniciar la PC):

```powershell
[System.Environment]::SetEnvironmentVariable("SECRET_KEY", "PEGAR_AQUI_LA_CLAVE_GENERADA", "Machine")
[System.Environment]::SetEnvironmentVariable("ALLOWED_ORIGINS", "http://192.168.1.50", "Machine")
```

Reemplazar `192.168.1.50` por la IP real que tendrá la PC servidora dentro de
la red de la fábrica (ver sección 3.1 para saber cómo obtenerla). Si el
frontend se va a servir por el puerto 80 (el default HTTP, sin especificarlo
en la URL), no hace falta agregar el puerto en `ALLOWED_ORIGINS`.

> Después de definir variables de entorno a nivel de "Machine", hay que
> **cerrar y volver a abrir** la terminal (o reiniciar la PC) para que el
> proceso de Python las vea.

### 2.3. Levantar la API con Uvicorn en modo producción

Con el entorno virtual activado, ejecutar:

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000
```

- `--host 0.0.0.0` hace que la API escuche en todas las interfaces de red de
  la PC (no solo `localhost`), permitiendo que otras computadoras de la red
  local se conecten usando la IP de esta PC.
- `--port 8000` es el puerto donde quedará escuchando la API.
- **No** usar el flag `--reload` en producción (ese modo es solo para
  desarrollo, ya que reinicia el servidor ante cada cambio de archivo y
  consume más recursos).

Para verificar que funciona, desde otra PC de la misma red abrir en el
navegador: `http://192.168.1.50:8000/` (reemplazando por la IP real) y debería
responder `{"status": "ok", ...}`.

---

## 3. Configuración del Frontend (React)

Todos los comandos de esta sección se ejecutan dentro de la carpeta
`sistema_flota/frontend`.

### 3.1. Obtener la IP local de la PC servidora

```powershell
ipconfig
```

Buscar la "Dirección IPv4" del adaptador de red conectado (Ethernet o
Wi-Fi), por ejemplo `192.168.1.50`. Esa es la IP que los demás usuarios de la
fábrica usarán para acceder al sistema, y también la que hay que usar en la
configuración de abajo.

### 3.2. Apuntar el frontend a la API de producción

El cliente de Axios (`src/api/client.ts`) ya está preparado para leer la URL
del backend desde una variable de entorno de Vite (`VITE_API_URL`), con
`http://localhost:8000` como valor de respaldo para desarrollo.

Crear un archivo llamado `.env.production` en la raíz de
`sistema_flota/frontend` (junto a `package.json`) con el siguiente contenido:

```
VITE_API_URL=http://192.168.1.50:8000
```

Reemplazando `192.168.1.50` por la IP real obtenida en el paso 3.1. Vite
toma automáticamente este archivo cuando se ejecuta `npm run build`.

### 3.3. Generar los archivos estáticos de producción

```powershell
npm install
npm run build
```

Esto genera la carpeta `dist/` dentro de `sistema_flota/frontend`, con los
archivos HTML/CSS/JS ya optimizados y listos para servir. Esta carpeta es
"self-contained": no necesita Node.js para funcionar, solo un servidor web
que entregue sus archivos.

### 3.4. Servir la carpeta `dist` con `serve`

Instalar `serve` de forma global (una sola vez en la PC servidora):

```powershell
npm install -g serve
```

Levantar el sitio en el puerto 80 (el puerto HTTP estándar, para que los
usuarios no tengan que escribir ningún puerto en el navegador):

```powershell
serve -s dist -l 80
```

- `-s dist` indica que sirva el contenido de la carpeta `dist` en modo
  "Single Page Application" (redirige todas las rutas a `index.html`,
  necesario porque usamos `react-router-dom`).
- `-l 80` indica el puerto de escucha.

> Si el puerto 80 ya está en uso por otro servicio de Windows (IIS, Skype,
> etc.), usar otro puerto libre (ej: `-l 8080`) y los usuarios deberán
> escribir `http://192.168.1.50:8080` en el navegador.

Con esto, cualquier PC de la red local podrá acceder al sistema completo
escribiendo `http://192.168.1.50` (o el puerto elegido) en su navegador.

---

## 4. Arranque Automático (Servicios de Windows)

Los dos procesos de arriba (`uvicorn` para el backend y `serve` para el
frontend) solo corren mientras la ventana de PowerShell donde los lanzaste
esté abierta. Para que sigan funcionando después de reiniciar la PC o cerrar
sesión, hay que convertirlos en **Servicios de Windows** usando **NSSM**
(*Non-Sucking Service Manager*), una herramienta gratuita diseñada
específicamente para esto.

### 4.1. Instalar NSSM

Descargar desde [https://nssm.cc/download](https://nssm.cc/download),
descomprimir, y copiar `nssm.exe` (la versión de 64 bits, carpeta `win64`) a
una ubicación fija, por ejemplo `C:\nssm\nssm.exe`.

### 4.2. Crear el servicio del Backend

```powershell
C:\nssm\nssm.exe install FlotaBackend
```

Se abre una ventana gráfica. Completar:
- **Path:** ruta completa a `uvicorn.exe` dentro del entorno virtual, por
  ejemplo `C:\ruta\sistema_flota\backend\venv\Scripts\uvicorn.exe`
- **Startup directory:** `C:\ruta\sistema_flota\backend`
- **Arguments:** `main:app --host 0.0.0.0 --port 8000`

Luego iniciar el servicio:

```powershell
nssm start FlotaBackend
```

### 4.3. Crear el servicio del Frontend

```powershell
C:\nssm\nssm.exe install FlotaFrontend
```

Completar:
- **Path:** ruta completa a `serve.cmd` (normalmente en
  `C:\Users\<usuario>\AppData\Roaming\npm\serve.cmd`, o ejecutar `where serve`
  en PowerShell para encontrarla)
- **Startup directory:** `C:\ruta\sistema_flota\frontend`
- **Arguments:** `-s dist -l 80`

Luego iniciar el servicio:

```powershell
nssm start FlotaFrontend
```

### 4.4. Verificación final

Ambos servicios ahora aparecerán en el Administrador de Servicios de Windows
(`services.msc`) como **"FlotaBackend"** y **"FlotaFrontend"**, configurados
por defecto para iniciar automáticamente con el sistema. Si la PC se
reinicia (por un corte de luz, una actualización de Windows, etc.), el
sistema volverá a estar disponible sin que nadie tenga que abrir nada
manualmente.

Para reiniciar cualquiera de los dos servicios tras un cambio de
configuración:

```powershell
nssm restart FlotaBackend
nssm restart FlotaFrontend
```

> **Alternativa a NSSM:** si el equipo ya usa **PM2** (más común en entornos
> Linux/Node, pero también disponible en Windows vía `npm install -g pm2` y
> `pm2-windows-startup`), puede usarse en lugar de NSSM para gestionar ambos
> procesos. NSSM es la opción más simple aquí porque no requiere una segunda
> instalación de Node.js para gestionar el proceso de Python.

---

## 5. Resumen de Puertos y URLs

| Servicio | Puerto | URL de acceso |
|---|---|---|
| Backend (API) | 8000 | `http://192.168.1.50:8000` |
| Frontend (App web) | 80 | `http://192.168.1.50` |

Los usuarios de la fábrica solo necesitan conocer la URL del **Frontend**
(`http://192.168.1.50`); el backend es consumido internamente por la
aplicación web y no requiere que nadie lo visite directamente.
