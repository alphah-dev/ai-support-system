# backend/main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import API routers
from backend.apis import (
    tickets_api,
    summarization_api,
    routing_api,
    recommendation_api,
    prediction_api,
    auth_api # <<<--- ADDED IMPORT
)
from backend.database import database_manager

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s [%(name)s] %(message)s')
log = logging.getLogger(__name__)

app = FastAPI(
    title="AI Customer Support System API",
    description="API endpoints for the enterprise AI-driven customer support system.",
    version="1.0.0",
)

# CORS Configuration (Ensure Vite port 5173 is included)
origins = [
    "http://localhost",
    "http://localhost:3000", # CRA Default
    "http://localhost:5173", # Vite Default
    "http://127.0.0.1",
    "http://127.0.0.1:3000", # CRA Explicit IP
    "http://127.0.0.1:5173", # Vite Explicit IP
    # Production URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Event Handlers (Keep as is) ---
@app.on_event("startup")
async def startup_event():
    log.info("Starting up AI Customer Support System API...")
    try:
        # Check Ollama connection
        try:
            from backend.utils.ollama_integration import client as ollama_client
            if ollama_client is None:
                 log.warning("Ollama client failed to initialize. AI features needing Ollama may fail.")
            else:
                 log.info("Ollama client seems available.")
        except Exception as ollama_err:
             log.warning(f"Could not verify Ollama connection during startup: {ollama_err}")
        # Initialize DB
        database_manager.init_db()
        log.info("Database check/initialization complete.")
    except Exception as e:
        log.error(f"FATAL: Error during application startup sequence: {e}", exc_info=True)
    log.info("API startup sequence completed.")

@app.on_event("shutdown")
async def shutdown_event():
    log.info("Shutting down API...")

# --- Include API Routers ---
app.include_router(auth_api.router) # <<<--- ADDED ROUTER
app.include_router(tickets_api.router)
app.include_router(summarization_api.router)
app.include_router(routing_api.router)
app.include_router(recommendation_api.router)
app.include_router(prediction_api.router)

# --- Root Endpoint (Keep as is) ---
@app.get("/", tags=["Root"], summary="API Root Status")
async def read_root():
    log.debug("Root endpoint '/' accessed.")
    return {"message": "Welcome to the AI Customer Support System API!"}

# --- Main execution block (Keep as is) ---
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    log.info(f"Attempting to start Uvicorn server directly via main.py on {host}:{port}")
    log.warning("Use 'uvicorn backend.main:app --reload...' instead for development.")
    uvicorn.run(app, host=host, port=port)