# backend/apis/routing_api.py

from fastapi import APIRouter, HTTPException, Depends, Body, status
from .models import RoutingInput, RoutingDecision # Import models
from backend.agents.routing_agent import RoutingAgent # Import agent
import logging

log = logging.getLogger(__name__)
router = APIRouter(prefix="/route", tags=["Routing"])

# Dependency injector
def get_routing_agent():
    return RoutingAgent()

# Placeholder endpoint - uses placeholder logic from agent
@router.post("/", response_model=RoutingDecision)
async def route_ticket(
    input_data: RoutingInput, # Use the input model
    agent: RoutingAgent = Depends(get_routing_agent) # Inject agent
):
    """
    Determines the route for a ticket using the RoutingAgent (currently placeholder logic).
    """
    log.warning("Routing endpoint called (using placeholder agent implementation).")
    try:
        # Call the agent's method (which currently returns placeholder data)
        decision = await agent.determine_route(
            ticket_id=input_data.ticket_id,
            ticket_subject=input_data.ticket_subject,
            ticket_body=input_data.ticket_body,
            ticket_priority=input_data.ticket_priority
        )
        # Ensure the placeholder returns data matching the RoutingDecision model
        # If the agent returned a raw dict, ensure keys match or convert here.
        # Assuming agent returns a dict compatible with RoutingDecision model for now.
        return decision
    except Exception as e:
        log.error(f"Error during routing API call: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to determine route: {e}"
        )