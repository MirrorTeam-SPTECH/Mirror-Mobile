import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pythonjsonlogger import jsonlogger

from app.config import settings

# Configure JSON logging
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    "%(asctime)s %(name)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logHandler.setFormatter(formatter)
logger = logging.getLogger()
logger.addHandler(logHandler)
logger.setLevel(logging.INFO if not settings.DEBUG else logging.DEBUG)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Portal do Churras API", extra={
        "version": settings.APP_VERSION,
        "debug": settings.DEBUG
    })
    yield
    # Shutdown
    logger.info("Shutting down Portal do Churras API")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Garante CORS headers mesmo em erros 500 não tratados."""
    origin = request.headers.get("origin", "*")
    allowed = settings.CORS_ORIGINS
    allow_origin = origin if ("*" in allowed or origin in allowed) else allowed[0] if allowed else "*"
    logger.error("Unhandled exception", extra={"path": request.url.path, "error": str(exc)})
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={"Access-Control-Allow-Origin": allow_origin},
    )


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "ok"
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected"  # TODO: Add actual DB check
    }


# Import all models so SQLAlchemy can resolve cross-domain relationships (e.g. Option→Ingredient)
from app.domains.orders import models as _orders_models  # noqa: F401
from app.domains.users import models as _users_models  # noqa: F401
from app.domains.nutrition import models as _nutrition_models  # noqa: F401

# Import and include routers
from app.domains.orders.routes import router as orders_router
from app.domains.users.routes import router as users_router
from app.domains.nutrition.routes import router as nutrition_router
from app.domains.ai_core.routes import router as ai_core_router
from app.domains.truck.routes import router as truck_router

app.include_router(orders_router, prefix="/api", tags=["catalog & orders"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(nutrition_router, prefix="/api/nutrition", tags=["nutrition"])
app.include_router(ai_core_router, prefix="/api", tags=["ai"])
app.include_router(truck_router, prefix="/api", tags=["truck"])
