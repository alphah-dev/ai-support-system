# backend/apis/models.py

from pydantic import BaseModel, Field, EmailStr, validator, root_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import logging

log = logging.getLogger(__name__)

# --- Base Model Configuration ---
class OrmBaseModel(BaseModel):
    """ Base model configuration for compatibility """
    class Config:
        # Updated for Pydantic v2
        from_attributes = True # Replaces orm_mode=True
        # Optional: Configure how datetimes are encoded in JSON responses
        # json_encoders = {
        #     datetime: lambda dt: dt.isoformat().replace('+00:00', 'Z') # Example: ISO format with Z for UTC
        # }

# --- Ticket Models ---
class TicketBase(OrmBaseModel):
    """Base fields for a ticket, shared between creation and read models."""
    customer_name: str = Field(..., example="John Doe", description="Name of the customer reporting the issue.")
    customer_email: Optional[EmailStr] = Field(None, example="john.doe@email.com", description="Customer's email address (optional).")
    subject: str = Field(..., min_length=3, max_length=255, example="Login Issue", description="Brief subject line for the ticket.")
    body: str = Field(..., min_length=10, example="I cannot log into my account using my usual credentials.", description="Detailed description of the issue.")
    priority: str = Field("Medium", example="High", description="Priority level (e.g., Low, Medium, High, Urgent).")

    # Pydantic v2 uses field validators attached via decorators differently,
    # but the core @validator logic often still works for simple cases,
    # though FunctionValidators are preferred in v2. Keep simple validator for now.
    @validator('priority')
    def priority_must_be_valid(cls, v):
        valid_priorities = ['Low', 'Medium', 'High', 'Urgent']
        if v not in valid_priorities:
            raise ValueError(f'Priority must be one of: {", ".join(valid_priorities)}')
        return v

class TicketCreate(TicketBase):
    """Model for creating a new ticket via the API."""
    # Inherits all fields from TicketBase. No additional fields needed for creation input.
    pass

class Ticket(TicketBase):
    """Model representing a full ticket record as returned by the API."""
    id: int = Field(..., example=101, description="Unique identifier for the ticket.")
    status: str = Field(..., example="Open", description="Current status of the ticket (e.g., Open, In Progress, Closed).")
    assigned_agent_id: Optional[int] = Field(None, example=2, description="ID of the agent assigned to the ticket.")
    assigned_team: Optional[str] = Field(None, example="Technical", description="Name of the team assigned to the ticket.")
    created_at: datetime = Field(..., description="Timestamp when the ticket was created (UTC).")
    updated_at: datetime = Field(..., description="Timestamp when the ticket was last updated (UTC).")
    resolved_at: Optional[datetime] = Field(None, description="Timestamp when the ticket was resolved (UTC, if applicable).")
    summary: Optional[str] = Field(None, example="User cannot log in after password reset.", description="AI-generated summary of the ticket body.")
    extracted_actions: Optional[List[str]] = Field(None, example=["Escalate to Tier 2", "Check auth logs"], description="AI-extracted actionable items (stored as JSON string in DB).")
    predicted_resolution_time: Optional[int] = Field(None, example=240, description="AI-predicted resolution time in minutes.")
    resolution_details: Optional[str] = Field(None, example="Cleared user cache, resolved.", description="Details entered by the agent on how the ticket was resolved.")
    feedback_rating: Optional[int] = Field(None, ge=1, le=5, example=5, description="Feedback rating (1-5) provided for the resolution.")
    feedback_comment: Optional[str] = Field(None, example="Very helpful support!", description="Text feedback provided for the resolution.")

    # Validator to parse JSON string from DB back into a list for extracted_actions
    # Using pre=True means it runs before standard Pydantic validation on the field.
    @validator('extracted_actions', pre=True, allow_reuse=True)
    def parse_json_string(cls, value):
        if isinstance(value, str):
            if not value.strip(): # Handle empty strings
                return []
            try:
                parsed_value = json.loads(value)
                # Ensure it's actually a list after parsing
                return parsed_value if isinstance(parsed_value, list) else []
            except json.JSONDecodeError:
                log.warning(f"Could not parse extracted_actions JSON string: '{value}'. Returning empty list.")
                return [] # Return empty list if JSON is invalid
        elif value is None:
            return [] # Return empty list if DB value is NULL
        elif isinstance(value, list):
             return value # Return as is if already a list
        else:
             log.warning(f"Unexpected type for extracted_actions: {type(value)}. Returning empty list.")
             return [] # Handle other unexpected types


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
    team: Optional[str] = Field(None, max_length=100, description="Name of the team to assign. Set to null to unassign team.")


# --- Models for Agent Inputs/Outputs ---

class SummarizationInput(OrmBaseModel):
    text: str = Field(..., min_length=10, description="Text content (e.g., ticket body, chat transcript) to summarize.")

class SummarizationResult(OrmBaseModel):
    summary: str
    actions: List[str]

class RoutingInput(OrmBaseModel):
     ticket_id: int
     ticket_subject: str
     ticket_body: str
     ticket_priority: str

class RoutingDecision(OrmBaseModel):
    ticket_id: int
    assigned_team: Optional[str] = None
    assigned_agent_id: Optional[int] = None
    reason: str

class RecommendationInput(OrmBaseModel):
     ticket_id: int
     ticket_subject: str
     ticket_body: str
     top_n: int = Field(3, ge=1, le=10)

class Recommendation(OrmBaseModel): # Represents a single recommendation item
    id: int # KB entry ID
    title: str
    content: str # Or a snippet
    similarity: float = Field(..., ge=-1.0, le=1.0) # Cosine similarity range
    score: float # Combined score

class RecommendationResult(OrmBaseModel): # Represents the API response for recommendations
    ticket_id: int
    recommendations: List[Recommendation] # List of recommendation items

class RecommendationFeedbackInput(OrmBaseModel):
    recommendation_id: int = Field(..., description="ID of the KB entry/recommendation receiving feedback.")
    was_helpful: bool = Field(..., description="True if the recommendation was helpful, False otherwise.")
    ticket_id: Optional[int] = Field(None, description="Optional: The ID of the ticket context where feedback was given.")

class PredictionInput(OrmBaseModel):
    # Features needed by your ML model (example)
    ticket_id: int
    priority: str
    assigned_team: Optional[str]
    subject_length: Optional[int] = None # Example feature
    body_length: Optional[int] = None # Example feature
    # Potentially real-time features like current_backlog
    current_backlog: Optional[int] = None

class PredictionResult(OrmBaseModel):
    ticket_id: int
    predicted_resolution_time_minutes: int
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0) # Optional: Confidence from model


# --- Auth Models ---
class Token(OrmBaseModel):
    """ Model for the JWT access token response """
    access_token: str
    token_type: str = "bearer" # Default token type for Bearer scheme


# --- User Models ---
class UserBase(OrmBaseModel):
    """Base user model fields (used for creation and public display)"""
    username: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_]+$', example="new_user", description="Unique username, alphanumeric and underscores only.") # Added pattern
    email: Optional[EmailStr] = Field(None, example="user@example.com", description="Optional valid email address.")
    full_name: Optional[str] = Field(None, max_length=100, example="New User", description="Optional full name.")

class UserCreate(UserBase):
    """Model used when creating a new user via the /register endpoint"""
    password: str = Field(..., min_length=8, description="User's chosen password (at least 8 characters).")

class UserPublic(UserBase):
    """Model representing public user data returned by the API (no password)"""
    id: int = Field(..., description="Unique user identifier.")
    is_active: bool = Field(..., description="Whether the user account is active.")
    # created_at: datetime # Optional: Decide if you want to expose creation time

# --- Model for user data stored in JWT token (used internally in auth.py) ---
# This isn't typically used directly in API request/response bodies
class TokenData(BaseModel):
    username: Optional[str] = None
    # Add other fields like user_id or roles if you encode them in the token later