# backend/main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import logging
from dotenv import load_dotenv

# Load environment variables (optional but good practice)
load_dotenv()

# Import API routers
from backend.apis import (
    tickets_api,
    summarization_api,
    routing_api,
    recommendation_api,
    prediction_api
    # Add dashboard_api later if needed
)
from backend.database import database_manager

# Configure logging (use the level set in database_manager or configure separately)
# Ensure this is configured before other modules might use logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s [%(name)s] %(message)s')
log = logging.getLogger(__name__) # Get a logger for this module

# Initialize the FastAPI app
app = FastAPI(
    title="AI Customer Support System API",
    description="API endpoints for the enterprise AI-driven customer support system.",
    version="1.0.0",
    # You can add documentation URL, contact info, etc. here
    # docs_url="/docs", # Default
    # redoc_url="/redoc" # Optional alternative docs
)

# CORS (Cross-Origin Resource Sharing) Middleware Configuration
# This allows your frontend (running on a different port/domain) to make requests to this backend.
# Be more restrictive with origins in production!
origins = [
    "http://localhost",          # General localhost access (useful for testing)
    "http://localhost:3000",     # Default CRA port (keep for reference)
    "http://localhost:5173",     # <<<=== ADDED Default Vite Port
    "http://127.0.0.1",          # Explicit IP loopback
    "http://127.0.0.1:3000",    # Explicit IP for CRA
    "http://127.0.0.1:5173",    # <<<=== ADDED Explicit IP for Vite
    # Add the URL of your deployed frontend application in production, e.g.:
    # "https://your-frontend-app.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Use the updated list of allowed origins
    allow_credentials=True,      # Allow cookies to be included in requests (important for auth later)
    allow_methods=["*"],         # Allow all standard HTTP methods (GET, POST, PUT, PATCH, DELETE, OPTIONS)
    allow_headers=["*"],         # Allow all headers (you might want to restrict this in production)
)

# --- Event Handlers ---
@app.on_event("startup")
async def startup_event():
    """Actions to perform on application startup."""
    log.info("Starting up AI Customer Support System API...")
    # Ensure database is initialized on startup
    try:
        # Check Ollama connection first if it's critical for startup
        try:
            from backend.utils.ollama_integration import client as ollama_client
            if ollama_client is None:
                 log.warning("Ollama client failed to initialize during import. AI features needing Ollama may fail.")
            else:
                 # Optionally perform a quick test call on startup? Might slow startup.
                 # await ollama_client.list() # Example check
                 log.info("Ollama client seems available.")
        except Exception as ollama_err:
             log.warning(f"Could not verify Ollama connection during startup: {ollama_err}")

        # Initialize DB
        database_manager.init_db()
        log.info("Database check/initialization complete.")

    except Exception as e:
        log.error(f"FATAL: Error during application startup sequence: {e}", exc_info=True)
        # Consider raising to prevent server starting in a bad state
        # raise e

    log.info("API startup sequence completed.")


@app.on_event("shutdown")
async def shutdown_event():
    """Actions to perform on application shutdown."""
    log.info("Shutting down API...")
    # Add any cleanup tasks here (e.g., closing external connections)

# --- Include API Routers ---
# These lines link the endpoints defined in other files (like tickets_api.py)
# to the main application. Order might matter depending on path specificity, but usually not here.
app.include_router(tickets_api.router)
app.include_router(summarization_api.router)
app.include_router(routing_api.router)
app.include_router(recommendation_api.router)
app.include_router(prediction_api.router)
# app.include_router(dashboard_api.router) # Add later if needed

# --- Root Endpoint ---
@app.get("/", tags=["Root"], summary="API Root Status") # Added summary for docs
async def read_root():
    """Provides a basic status message indicating the API is running."""
    log.debug("Root endpoint '/' accessed.") # Changed to debug level
    return {"message": "Welcome to the AI Customer Support System API!"}

# --- Main execution block to run the server ---
# This part is typically only used for direct execution (python main.py)
# It's better to use Uvicorn command line for development/production
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    # Listen on 0.0.0.0 by default if running directly, matching our Uvicorn command
    host = os.environ.get("HOST", "0.0.0.0")
    log.info(f"Attempting to start Uvicorn server directly via main.py on {host}:{port}")
    log.warning("Running directly via 'python main.py' does NOT enable auto-reload. Use 'uvicorn backend.main:app --reload...' instead for development.")
    uvicorn.run(app, host=host, port=port) # Removed reload=True as it doesn't work here