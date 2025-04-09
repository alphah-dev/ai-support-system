# backend/apis/recommendation_api.py

import logging
# <<<--- Add Depends import ---<<<
from fastapi import APIRouter, HTTPException, Depends, Body, status, Path, Query
from typing import List, Dict # Import Dict if needed later for user

from .models import RecommendationResult, RecommendationFeedbackInput, Recommendation
from backend.agents.recommendation_agent import RecommendationAgent
from backend.database import database_manager as db
# <<<--- Import auth dependency ---<<<
from backend import auth

log = logging.getLogger(__name__)
router = APIRouter(
    prefix="/recommend",
    tags=["Recommendation"],
    # <<<--- Add global dependency for authentication ---<<<
    dependencies=[Depends(auth.get_current_active_user)],
    responses={
        404: {"description": "Ticket or Recommendation not found"},
        401: {"description": "Not authenticated"} # Add 401 response
    }
)

# Dependency injector
def get_recommendation_agent():
    return RecommendationAgent()

@router.get("/{ticket_id}", response_model=RecommendationResult, summary="Get Recommendations for a Ticket")
async def get_recommendations(
    ticket_id: int = Path(..., title="The ID of the ticket...", ge=1),
    top_n: int = Query(3, ge=1, le=10, description="Number of recommendations..."),
    agent: RecommendationAgent = Depends(get_recommendation_agent)
    # current_user: Dict = Depends(auth.get_current_active_user) # Already covered
):
    """
    Gets resolution recommendations for a specific ticket.
    (Requires Authentication)
    """
    log.info(f"Recommendation GET endpoint called for ticket_id={ticket_id}, top_n={top_n}")
    ticket = db.get_ticket(ticket_id)
    if not ticket:
         log.error(f"Ticket {ticket_id} not found when attempting to get recommendations.")
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket {ticket_id} not found.")
    try:
        recommendations_data = await agent.recommend_resolutions(
            ticket_subject=ticket['subject'],
            ticket_body=ticket['body'],
            top_n=top_n
        )
        response_data = RecommendationResult(ticket_id=ticket_id, recommendations=recommendations_data)
        log.info(f"Returning {len(recommendations_data)} recommendations for ticket {ticket_id}.")
        return response_data
    except Exception as e:
        log.error(f"Error getting recommendations for ticket {ticket_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"...")

@router.post("/feedback", status_code=status.HTTP_202_ACCEPTED, summary="Submit Feedback on a Recommendation")
async def post_feedback(
    feedback_data: RecommendationFeedbackInput,
    agent: RecommendationAgent = Depends(get_recommendation_agent)
    # current_user: Dict = Depends(auth.get_current_active_user) # Already covered
):
    """
    Records user feedback on a recommendation.
    (Requires Authentication)
    """
    log.info(f"Recommendation feedback received for recommendation_id={feedback_data.recommendation_id}...")
    try:
        await agent.record_feedback(
            recommendation_id=feedback_data.recommendation_id,
            was_helpful=feedback_data.was_helpful
        )
        return {"message": "Feedback received and is being processed."}
    except Exception as e:
         log.error(f"Error recording recommendation feedback...: {e}", exc_info=True)
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"...")