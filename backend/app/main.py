from pathlib import Path
import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from backend.app.integrations.giraf import MockGiraf

ROOT = Path(__file__).resolve().parents[2]
FRONTEND = ROOT / "frontend"
CATALOG = json.loads((ROOT / "knowledge/vocabulary/fundo-do-mar.json").read_text())
RULES = json.loads((ROOT / "knowledge/pedagogical-rules/v0.1.json").read_text())
ENVIRONMENT = os.environ.get('APP_ENV', 'local')
if ENVIRONMENT not in {'local', 'principal', 'testes'}:
    raise RuntimeError('APP_ENV deve ser local, principal ou testes')
mock = MockGiraf()
app = FastAPI(title="Pequenas Girafas", version="0.1.0", docs_url=None, redoc_url=None)

@app.middleware("http")
async def headers(request, call_next):
    response = await call_next(request)
    response.headers.update({
        "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; media-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
        "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        "Cache-Control": "no-store",
    })
    return response

@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0", "mode": "mock", "personal_data": "device_only"}

@app.get("/api/v1/catalog")
def catalog():
    return CATALOG

@app.get("/api/v1/rules")
def rules():
    return RULES

@app.get("/api/v1/resources/{word_id}")
def resource(word_id: str):
    word = next((w for w in CATALOG["words"] if w["id"] == word_id), None)
    if word is None:
        raise HTTPException(404, "Palavra não encontrada")
    return {"image": mock.image(word), "tts": mock.tts(word)}

@app.get("/sw.js", include_in_schema=False)
def sw():
    return FileResponse(FRONTEND / "sw.js", media_type="text/javascript", headers={"Service-Worker-Allowed": "/"})

@app.get("/", include_in_schema=False)
def index():
    return HTMLResponse((FRONTEND / "index.html").read_text().replace('data-environment="local"', f'data-environment="{ENVIRONMENT}"'))

app.mount("/", StaticFiles(directory=FRONTEND), name="frontend")
