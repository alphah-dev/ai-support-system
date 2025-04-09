# backend/apis/summarization_api.py

from fastapi import APIRouter, HTTPException, Depends, Body, status
from typing import Dict # Import Dict if needed later for user
import logging

from .models import SummarizationInput, SummarizationResult
from backend.agents.summarization_agent import SummarizationAgent
# <<<--- Import auth dependency ---<<<
from backend import auth

log = logging.getLogger(__name__)
router = APIRouter(
    prefix="/summarize",
    tags=["Summarization"],
    # <<<--- Add global dependency for authentication ---<<<
    dependencies=[Depends(auth.get_current_active_user)],
    responses={401: {"description": "Not authenticated"}} # Add 401 response
)

# Dependency injector for the agent
def get_summarization_agent():
    return SummarizationAgent()

@router.post("/", response_model=SummarizationResult, summary="Summarize Text")
async def get_summary_and_actions(
    data: SummarizationInput, # Use the Pydantic model for input
    agent: SummarizationAgent = Depends(get_summarization_agent) # Inject agent
    # current_user: Dict = Depends(auth.get_current_active_user) # Already covered by router dependency
):
    """
    Generates a summary and extracts actions from the provided text.
    (Requires Authentication)
    """
    log.info(f"Summarization endpoint called for text length {len(data.text)}.")
    try:
        summary, actions = await agent.summarize_and_extract(data.text)
        log.info("Summarization API call successful.")
        return SummarizationResult(summary=summary, actions=actions)
    except Exception as e:
        log.error(f"Error during summarization API call: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary and actions: {e}"
        )