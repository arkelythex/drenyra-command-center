from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import router as api_router
from src.core.config import settings
from src.ocr import documents_router, ocr_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Arkelythex Data Engine: Powered by Polars (Rust) 🦀",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# CORS (Allow connections from Elysia/Bun)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, set to Elysia IP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(ocr_router, prefix="/v1/ocr")
app.include_router(documents_router, prefix="/v1/documents")


@app.middleware("http")
async def contract_version_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Contract-Version"] = settings.CONTRACT_VERSION
    return response

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "data-engine",
        "engine": "Polars (Rust)",
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
