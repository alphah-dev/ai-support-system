# backend/apis/recommendation_api.py

import logging # Ensure logging is imported
from fastapi import APIRouter, HTTPException, Depends, Body, status, Path, Query
from .models import RecommendationResult, RecommendationFeedbackInput, Recommendation # Import models
from backend.agents.recommendation_agent import RecommendationAgent # Import agent
from backend.database import database_manager as db # Needed to get ticket details
from typing import List # For response model

log = logging.getLogger(__name__) # Create logger for this module
router = APIRouter(
    prefix="/recommend",
    tags=["Recommendation"],
    responses={404: {"description": "Ticket or Recommendation not found"}} # Add 404 default
)

# Dependency injector
def get_recommendation_agent():
    # In a real app, might load models/configs here
    return RecommendationAgent()

@router.get("/{ticket_id}", response_model=RecommendationResult, summary="Get Recommendations for a Ticket")
async def get_recommendations(
    ticket_id: int = Path(..., title="The ID of the ticket to get recommendations for", ge=1),
    top_n: int = Query(3, ge=1, le=10, description="Number of recommendations to return"),
    agent: RecommendationAgent = Depends(get_recommendation_agent) # Inject agent
):
    """
    Retrieves relevant Knowledge Base articles or past resolutions
    based on the content of the specified ticket ID.
    Uses embedding similarity via the RecommendationAgent.
    """
    log.info(f"Recommendation GET endpoint called for ticket_id={ticket_id}, top_n={top_n}")

    # Fetch ticket details from DB to pass to the agent
    ticket = db.get_ticket(ticket_id)
    if not ticket:
         log.error(f"Ticket {ticket_id} not found when attempting to get recommendations.")
         # Return 404 if ticket doesn't exist
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket {ticket_id} not found.")

    try:
        # Call the agent's method with actual ticket content
        recommendations_data = await agent.recommend_resolutions(
            ticket_subject=ticket['subject'],
            ticket_body=ticket['body'],
            top_n=top_n
        )

        # Structure the response using the Pydantic model
        response_data = RecommendationResult(ticket_id=ticket_id, recommendations=recommendations_data)
        log.info(f"Returning {len(recommendations_data)} recommendations for ticket {ticket_id}.")
        return response_data

    except Exception as e:
        # Log any unexpected errors during agent processing
        log.error(f"Error getting recommendations for ticket {ticket_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while getting recommendations: {e}"
        )


@router.post("/feedback", status_code=status.HTTP_202_ACCEPTED, summary="Submit Feedback on a Recommendation")
async def post_feedback(
    feedback_data: RecommendationFeedbackInput,
    agent: RecommendationAgent = Depends(get_recommendation_agent) # Inject agent
):
    """
    Records user feedback (helpful/not helpful) for a specific recommendation ID.
    This helps improve future recommendation scores (logic within agent).
    """
    log.info(f"Recommendation feedback received for recommendation_id={feedback_data.recommendation_id}, helpful={feedback_data.was_helpful}, ticket_id={feedback_data.ticket_id}")
    try:
        # Call the agent's method to process feedback
        await agent.record_feedback(
            recommendation_id=feedback_data.recommendation_id,
            was_helpful=feedback_data.was_helpful
            # Could pass ticket_id to agent if it needs more context for updating scores
        )
        # 202 Accepted indicates the request is accepted for processing, but completion isn't guaranteed here
        return {"message": "Feedback received and is being processed."}
    except Exception as e:
         log.error(f"Error recording recommendation feedback for recommendation_id={feedback_data.recommendation_id}: {e}", exc_info=True)
         # Return a server error if feedback processing fails
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record feedback: {e}"
        )