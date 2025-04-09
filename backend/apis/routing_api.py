# backend/apis/routing_api.py

# <<<--- Add Depends import ---<<<
from fastapi import APIRouter, HTTPException, Depends, Body, status
from typing import Dict # Import Dict if needed later for user
import logging

from .models import RoutingInput, RoutingDecision
from backend.agents.routing_agent import RoutingAgent
# <<<--- Import auth dependency ---<<<
from backend import auth

log = logging.getLogger(__name__)
router = APIRouter(
    prefix="/route",
    tags=["Routing"],
    # <<<--- Add global dependency for authentication ---<<<
    dependencies=[Depends(auth.get_current_active_user)],
    responses={401: {"description": "Not authenticated"}} # Add 401 response
)

# Dependency injector
def get_routing_agent():
    return RoutingAgent()

@router.post("/", response_model=RoutingDecision, summary="Determine Ticket Route")
async def route_ticket(
    input_data: RoutingInput,
    agent: RoutingAgent = Depends(get_routing_agent)
    # current_user: Dict = Depends(auth.get_current_active_user) # Already covered
):
    """
    Determines the route for a ticket using the RoutingAgent (currently placeholder logic).
    (Requires Authentication)
    """
    log.warning("Routing endpoint called (using placeholder agent implementation).")
    try:
        decision = await agent.determine_route(
            ticket_id=input_data.ticket_id,
            ticket_subject=input_data.ticket_subject,
            ticket_body=input_data.ticket_body,
            ticket_priority=input_data.ticket_priority
        )
        return decision
    except Exception as e:
        log.error(f"Error during routing API call: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to determine route: {e}"
        )