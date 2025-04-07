# backend/apis/prediction_api.py

from fastapi import APIRouter, HTTPException, Depends, Body, status
from .models import PredictionInput, PredictionResult # Import models
from backend.agents.prediction_agent import PredictionAgent # Import agent
import logging

log = logging.getLogger(__name__)
router = APIRouter(prefix="/predict", tags=["Prediction"])

# Dependency injector
def get_prediction_agent():
    return PredictionAgent()

# Placeholder endpoint - uses placeholder logic from agent
@router.post("/", response_model=PredictionResult)
async def predict_resolution_time(
    input_data: PredictionInput, # Use the input model
    agent: PredictionAgent = Depends(get_prediction_agent) # Inject agent
):
    """
    Predicts the resolution time for a ticket based on input features (currently placeholder logic).
    """
    log.warning("Prediction endpoint called (using placeholder agent implementation).")
    try:
        # Call the agent's method (which currently returns placeholder data)
        # Pass relevant features from input_data
        predicted_time = await agent.predict_resolution_time(input_data.dict())

        return PredictionResult(
            ticket_id=input_data.ticket_id,
            predicted_resolution_time_minutes=predicted_time
            # Add confidence score if your real model provides it
        )
    except Exception as e:
        log.error(f"Error during prediction API call: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to predict resolution time: {e}"
        )