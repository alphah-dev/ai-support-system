# backend/apis/models.py

from pydantic import BaseModel, Field, EmailStr, validator, root_validator # Added root_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import logging

log = logging.getLogger(__name__)

# --- Base Model Configuration ---
class OrmBaseModel(BaseModel):
    class Config:
        # Updated for Pydantic v2
        from_attributes = True # Replaces orm_mode=True
        # Optional: function to convert datetime objects to ISO format strings for JSON output
        # json_encoders = {
        #     datetime: lambda dt: dt.isoformat()
        # }

# --- Ticket Models ---
class TicketBase(OrmBaseModel):
    """Base fields for a ticket, used for creation and reading"""
    customer_name: str = Field(..., example="John Doe", description="Name of the customer reporting the issue.")
    customer_email: Optional[EmailStr] = Field(None, example="john.doe@email.com", description="Customer's email address (optional).")
    subject: str = Field(..., min_length=3, max_length=255, example="Login Issue", description="Brief subject line for the ticket.")
    body: str = Field(..., min_length=10, example="I cannot log into my account using my usual credentials.", description="Detailed description of the issue.")
    priority: str = Field("Medium", example="High", description="Priority level (e.g., Low, Medium, High, Urgent).")

    @validator('priority')
    def priority_must_be_valid(cls, v):
        valid_priorities = ['Low', 'Medium', 'High', 'Urgent']
        if v not in valid_priorities:
            raise ValueError(f'Priority must be one of: {", ".join(valid_priorities)}')
        return v

class TicketCreate(TicketBase):
    """Model for creating a new ticket via the API."""
    pass # Inherits all fields from TicketBase

class Ticket(TicketBase):
    """Model representing a ticket as returned by the API (includes read-only fields)."""
    id: int = Field(..., example=101, description="Unique identifier for the ticket.")
    status: str = Field(..., example="Open", description="Current status of the ticket (e.g., Open, In Progress, Closed).")
    assigned_agent_id: Optional[int] = Field(None, example=2, description="ID of the agent assigned to the ticket.")
    assigned_team: Optional[str] = Field(None, example="Technical", description="Name of the team assigned to the ticket.")
    created_at: datetime = Field(..., description="Timestamp when the ticket was created.")
    updated_at: datetime = Field(..., description="Timestamp when the ticket was last updated.")
    resolved_at: Optional[datetime] = Field(None, description="Timestamp when the ticket was resolved (if applicable).")
    summary: Optional[str] = Field(None, example="User cannot log in after password reset.", description="AI-generated summary of the ticket body.")
    extracted_actions: Optional[List[str]] = Field(None, example=["Escalate to Tier 2", "Check auth logs"], description="AI-extracted actionable items.")
    predicted_resolution_time: Optional[int] = Field(None, example=240, description="AI-predicted resolution time in minutes.") # In minutes
    resolution_details: Optional[str] = Field(None, example="Cleared user cache, resolved.", description="Details entered by the agent on how the ticket was resolved.")
    feedback_rating: Optional[int] = Field(None, ge=1, le=5, example=5, description="Feedback rating (1-5) provided for the resolution.")
    feedback_comment: Optional[str] = Field(None, example="Very helpful support!", description="Text feedback provided for the resolution.")

    # Validator to parse JSON string from DB back into a list for extracted_actions
    # Using pre=True means it runs before standard validation
    @validator('extracted_actions', pre=True, allow_reuse=True)
    def parse_json_string(cls, value):
        if isinstance(value, str):
            try:
                parsed_value = json.loads(value)
                # Ensure it's actually a list after parsing
                return parsed_value if isinstance(parsed_value, list) else []
            except json.JSONDecodeError:
                log.warning(f"Could not parse extracted_actions JSON string: {value}. Returning empty list.")
                return [] # Return empty list if JSON is invalid
        elif value is None:
            return [] # Return empty list if DB value is NULL
        return value # Return as is if already a list (or other type, though should be list/str/None)


class TicketUpdateStatus(OrmBaseModel):
    """Model for updating only the status of a ticket."""
    status: str = Field(..., example="In Progress", description="The new status for the ticket.")

    @validator('status')
    def status_must_be_valid(cls, v):
        valid_statuses = ['Open', 'In Progress', 'Resolved', 'Closed', 'Escalated'] # Add any other valid statuses
        if v not in valid_statuses:
             raise ValueError(f'Status must be one of: {", ".join(valid_statuses)}')
        return v

class TicketUpdateAssignment(OrmBaseModel):
    """Model for updating the assignment of a ticket."""
    agent_id: Optional[int] = Field(None, description="ID of the agent to assign. Set to null to unassign agent.")
    team: Optional[str] = Field(None, description="Name of the team to assign. Set to null to unassign team.")

    # Example of root validator if needed to enforce one field minimum
    # @root_validator(skip_on_failure=True) # skip_on_failure prevents running if field validation fails
    # def check_assignment_provided(cls, values):
    #     agent_id, team = values.get('agent_id'), values.get('team')
    #     if agent_id is None and team is None:
    #         # Allow unassignment? Or raise error? Endpoint handles this currently.
    #         # raise ValueError('Either agent_id or team must be provided for assignment')
    #         pass
    #     return values


# --- Models for Agent Inputs/Outputs ---

class SummarizationInput(OrmBaseModel):
    text: str = Field(..., min_length=10, description="Text content (e.g., ticket body, chat transcript) to summarize.")

class SummarizationResult(OrmBaseModel):
    summary: str
    actions: List[str]

class RoutingInput(OrmBaseModel): # Example - Define required fields
     ticket_id: int
     ticket_subject: str
     ticket_body: str
     ticket_priority: str

class RoutingDecision(OrmBaseModel): # Example - Define expected output
    ticket_id: int
    assigned_team: Optional[str] = None
    assigned_agent_id: Optional[int] = None
    reason: str

class RecommendationInput(OrmBaseModel): # Example
     ticket_id: int
     ticket_subject: str
     ticket_body: str
     top_n: int = Field(3, ge=1, le=10)

class Recommendation(OrmBaseModel): # Single recommendation item
    id: int # KB entry ID
    title: str
    content: str # Or a snippet
    similarity: float = Field(..., ge=0.0, le=1.0)
    score: float # Combined score (similarity, success rate etc.)

class RecommendationResult(OrmBaseModel): # List of recommendations
    ticket_id: int
    recommendations: List[Recommendation]

class RecommendationFeedbackInput(OrmBaseModel): # Example
    recommendation_id: int # ID of the KB entry/recommendation
    was_helpful: bool
    ticket_id: Optional[int] = None # Context: which ticket was this feedback for?

class PredictionInput(OrmBaseModel): # Example
    # Features needed by your ML model
    ticket_id: int
    priority: str
    assigned_team: Optional[str]
    # Add other features like subject_length, body_keywords etc.
    # Potentially real-time features like current_backlog
    current_backlog: Optional[int] = None

class PredictionResult(OrmBaseModel): # Example
    ticket_id: int
    predicted_resolution_time_minutes: int
    confidence_score: Optional[float] = None # Optional: if model provides it