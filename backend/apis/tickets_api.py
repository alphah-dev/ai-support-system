# backend/apis/tickets_api.py

from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
import logging
import time

# Import Pydantic models
from .models import Ticket, TicketCreate, TicketUpdateStatus, TicketUpdateAssignment
# Import database manager
from backend.database import database_manager as db
# Import agents for dependency injection
from backend.agents.summarization_agent import SummarizationAgent
from backend.agents.routing_agent import RoutingAgent
from backend.agents.prediction_agent import PredictionAgent

log = logging.getLogger(__name__)

# Create an API router instance
router = APIRouter(
    prefix="/tickets", # All routes in this file will start with /tickets
    tags=["Tickets"], # Tag for grouping in API documentation
    responses={404: {"description": "Ticket not found"}} # Default response for 404
)

# --- Dependency Injection Setup ---
# Provides instances of agents to endpoints that need them
def get_summarization_agent():
    # In a real app, this might load config/models, but here it's simple instantiation
    return SummarizationAgent()

def get_routing_agent():
    return RoutingAgent()

def get_prediction_agent():
    return PredictionAgent()
# --- End Dependency Injection ---


# == GET Endpoints ==

@router.get("/", response_model=List[Ticket])
async def get_tickets(
    status: Optional[str] = Query(None, description="Filter tickets by status (e.g., Open, In Progress)"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of tickets to return."),
    offset: int = Query(0, ge=0, description="Number of tickets to skip (for pagination).")
):
    """
    Retrieves a list of tickets, optionally filtered by status, with pagination.
    """
    log.info(f"Request received for GET /tickets with status={status}, limit={limit}, offset={offset}")
    try:
        tickets_data = db.get_all_tickets(status=status, limit=limit, offset=offset)
        # Pydantic automatically handles validation and conversion using from_attributes=True
        # It will also handle parsing the 'extracted_actions' JSON string due to the validator in models.py
        return tickets_data
    except Exception as e:
        log.error(f"Error fetching tickets: {e}", exc_info=True) # Log traceback
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving tickets."
        )

@router.get("/{ticket_id}", response_model=Ticket)
async def get_ticket_by_id(ticket_id: int):
    """
    Retrieves a single ticket by its unique ID.
    """
    log.info(f"Request received for GET /tickets/{ticket_id}")
    ticket_data = db.get_ticket(ticket_id)
    if not ticket_data:
        log.warning(f"Ticket with ID {ticket_id} not found.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket with ID {ticket_id} not found")
    # Pydantic validates/converts the dict from the DB, including parsing JSON fields
    return ticket_data

# == POST Endpoint ==

@router.post("/", response_model=Ticket, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_data: TicketCreate,
    # Inject agents using Depends
    summarizer: SummarizationAgent = Depends(get_summarization_agent),
    router_agent: RoutingAgent = Depends(get_routing_agent),
    predictor: PredictionAgent = Depends(get_prediction_agent)
):
    """
    Creates a new ticket, triggers summarization, prediction (placeholder),
    and initial routing (placeholder).
    """
    log.info(f"Request received for POST /tickets with data: {ticket_data.dict()}")
    start_time = time.time() # Start timing

    # --- 1. Basic Ticket Creation in DB ---
    ticket_id = db.add_ticket(
        customer_name=ticket_data.customer_name,
        customer_email=ticket_data.customer_email,
        subject=ticket_data.subject,
        body=ticket_data.body,
        priority=ticket_data.priority
    )
    if not ticket_id:
        log.error("Failed to create ticket entry in database.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create ticket in database")

    log.info(f"Ticket {ticket_id} created in database.")
    db_creation_time = time.time()

    # --- 2. Trigger AI Agent Processing ---
    full_text = f"Subject: {ticket_data.subject}\n\nBody:\n{ticket_data.body}"

    # Initialize results with defaults in case of errors
    summary = "[Summary generation failed]"
    actions = ["[Action extraction failed]"]
    predicted_time = None
    routing_decision = {'assigned_team': None, 'assigned_agent_id': None, 'reason': '[Routing failed]'}

    ai_processing_error = None
    try:
        # --- Call Summarization Agent (Real Call) ---
        log.info(f"Calling SummarizationAgent for ticket {ticket_id}...")
        summary, actions = await summarizer.summarize_and_extract(full_text)
        db.update_ticket_summary(ticket_id, summary, actions)
        log.info(f"Summarization complete for ticket {ticket_id}.")
        summarization_time = time.time()

        # --- Call Prediction Agent (Placeholder Call) ---
        log.info(f"Calling PredictionAgent for ticket {ticket_id}...")
        prediction_features = {
            'ticket_id': ticket_id, # Pass ID for context if needed
            'priority': ticket_data.priority,
            'assigned_team': None, # Routing hasn't happened yet
            # Add more features here later based on your model
        }
        predicted_time = await predictor.predict_resolution_time(prediction_features)
        db.update_ticket_prediction(ticket_id, predicted_time)
        log.info(f"Prediction complete for ticket {ticket_id}. Predicted time: {predicted_time} mins.")
        prediction_time = time.time()

        # --- Call Routing Agent (Placeholder Call) ---
        log.info(f"Calling RoutingAgent for ticket {ticket_id}...")
        routing_decision = await router_agent.determine_route(
             ticket_id=ticket_id,
             ticket_subject=ticket_data.subject,
             ticket_body=ticket_data.body,
             ticket_priority=ticket_data.priority
        )
        # Ensure keys exist before accessing, provide defaults
        assigned_agent_id = routing_decision.get('assigned_agent_id')
        assigned_team = routing_decision.get('assigned_team')
        db.update_ticket_assignment(ticket_id, assigned_agent_id, assigned_team)
        log.info(f"Routing complete for ticket {ticket_id}. Decision: {routing_decision}")
        routing_time = time.time()

    except Exception as e:
        ai_processing_error = e # Store error
        log.error(f"Error during AI processing for ticket {ticket_id}: {e}", exc_info=True)
        # Update ticket with error indicators if desired
        db.update_ticket_summary(ticket_id, summary, actions) # Save default error messages
        db.update_ticket_assignment(ticket_id, None, "[Routing Failed]") # Indicate routing failure

    # --- 3. Fetch and return the created/updated ticket ---
    # Retrieve the final state of the ticket from the DB
    created_ticket_data = db.get_ticket(ticket_id)
    if not created_ticket_data:
         log.error(f"Failed to retrieve ticket {ticket_id} from database after processing.")
         # Even if AI failed, the ticket should exist. This indicates a deeper DB issue.
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve created ticket after saving.")

    total_duration = time.time() - start_time
    log.info(f"Ticket {ticket_id} creation and initial processing finished. Total time: {total_duration:.2f}s")
    if ai_processing_error:
        log.warning(f"Note: AI processing for ticket {ticket_id} encountered an error.")
        # Optionally add a header or field to the response indicating partial success?

    # Pydantic model handles conversion, including parsing the 'extracted_actions' JSON
    return created_ticket_data


# == PATCH Endpoints ==

@router.patch("/{ticket_id}/status", response_model=Ticket)
async def update_ticket_status_endpoint(ticket_id: int, status_update: TicketUpdateStatus):
    """Updates the status of a specific ticket."""
    log.info(f"Request received for PATCH /tickets/{ticket_id}/status with status: {status_update.status}")
    # Check if ticket exists first using the DB function directly for efficiency
    existing_ticket_data = db.get_ticket(ticket_id)
    if not existing_ticket_data:
        log.warning(f"Update status failed: Ticket {ticket_id} not found.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket with ID {ticket_id} not found")

    # Update status in DB
    success = db.update_ticket_status(ticket_id, status_update.status)
    if not success:
        log.error(f"Failed to update status for ticket {ticket_id} in database.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update ticket status.")

    # Return the updated ticket by fetching it again
    updated_ticket = db.get_ticket(ticket_id)
    if not updated_ticket: # Should not happen if update succeeded, but check defensively
         log.error(f"Failed to retrieve ticket {ticket_id} after status update.")
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve ticket after update.")

    log.info(f"Ticket {ticket_id} status updated successfully to {status_update.status}.")
    return updated_ticket

@router.patch("/{ticket_id}/assignment", response_model=Ticket)
async def assign_ticket_endpoint(ticket_id: int, assignment: TicketUpdateAssignment):
    """Manually assigns or re-assigns a ticket to an agent or team."""
    log.info(f"Request received for PATCH /tickets/{ticket_id}/assignment with data: {assignment.dict()}")
    # Check if ticket exists first
    existing_ticket_data = db.get_ticket(ticket_id)
    if not existing_ticket_data:
        log.warning(f"Assignment failed: Ticket {ticket_id} not found.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket with ID {ticket_id} not found")

    # Add validation if needed (e.g., check if agent_id exists in the agents table)
    # if assignment.agent_id:
    #     agent = db.get_agent(assignment.agent_id)
    #     if not agent:
    #         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Agent with ID {assignment.agent_id} not found")

    success = db.update_ticket_assignment(ticket_id, assignment.agent_id, assignment.team)
    if not success:
         log.error(f"Failed to update assignment for ticket {ticket_id} in database.")
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to assign ticket.")

    # Return the updated ticket
    updated_ticket = db.get_ticket(ticket_id)
    if not updated_ticket:
         log.error(f"Failed to retrieve ticket {ticket_id} after assignment update.")
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve ticket after update.")

    log.info(f"Ticket {ticket_id} assignment updated successfully.")
    return updated_ticket