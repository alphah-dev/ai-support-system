# backend/apis/prediction_api.py

# <<<--- Add Depends import ---<<<
from fastapi import APIRouter, HTTPException, Depends, Body, status
from typing import Dict # Import Dict if needed later for user
import logging

from .models import PredictionInput, PredictionResult
from backend.agents.prediction_agent import PredictionAgent
# <<<--- Import auth dependency ---<<<
from backend import auth

log = logging.getLogger(__name__)
router = APIRouter(
    prefix="/predict",
    tags=["Prediction"],
    # <<<--- Add global dependency for authentication ---<<<
    dependencies=[Depends(auth.get_current_active_user)],
    responses={401: {"description": "Not authenticated"}} # Add 401 response
)

# Dependency injector
def get_prediction_agent():
    return PredictionAgent()

@router.post("/", response_model=PredictionResult, summary="Predict Ticket Resolution Time")
async def predict_resolution_time(
    input_data: PredictionInput,
    agent: PredictionAgent = Depends(get_prediction_agent)
    # current_user: Dict = Depends(auth.get_current_active_user) # Already covered
):
    """
    Predicts the resolution time for a ticket based on input features (currently placeholder logic).
    (Requires Authentication)
    """
    log.warning("Prediction endpoint called (using placeholder agent implementation).")
    try:
        predicted_time = await agent.predict_resolution_time(input_data.dict())
        return PredictionResult(
            ticket_id=input_data.ticket_id,
            predicted_resolution_time_minutes=predicted_time
        )
    except Exception as e:
        log.error(f"Error during prediction API call: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to predict resolution time: {e}"
        )