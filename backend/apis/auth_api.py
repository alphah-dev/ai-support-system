# backend/apis/auth_api.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm # Special form for username/password
from datetime import timedelta
import logging
from typing import Optional, Dict # Ensure Optional and Dict are imported

# Import auth functions and models
from backend import auth # Use absolute import from backend package root
from backend.database import database_manager as db
# Import relevant models from apis.models
from backend.apis.models import OrmBaseModel, Token, UserCreate, UserPublic

log = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

# --- Pydantic Model for Token Response (Keep existing) ---
class Token(OrmBaseModel):
    access_token: str
    token_type: str

# --- Login Endpoint (Keep existing) ---
@router.post("/token", response_model=Token, summary="Login for Access Token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Standard OAuth2 password flow endpoint.
    Takes username and password in form data, returns JWT access token.
    """
    log.info(f"Login attempt for username: {form_data.username}")
    user = db.get_user_by_username(form_data.username)
    if not user:
        log.warning(f"Login failed: User '{form_data.username}' not found.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not auth.verify_password(form_data.password, user["hashed_password"]):
        log.warning(f"Login failed: Incorrect password for user '{form_data.username}'.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.get("is_active"):
         log.warning(f"Login failed: User '{form_data.username}' is inactive.")
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    log.info(f"Login successful for user '{form_data.username}'. Token issued.")
    return {"access_token": access_token, "token_type": "bearer"}

# --- Registration Endpoint (Added) ---
@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED, summary="Register New User")
async def register_user(user_data: UserCreate):
    """
    Handles new user registration.
    Takes username, password, and optional email/full name.
    Hashes the password and stores the new user in the database.
    Returns the created user's public information.
    """
    log.info(f"Registration attempt for username: {user_data.username}")

    # 1. Check if username already exists
    existing_user_by_name = db.get_user_by_username(user_data.username)
    if existing_user_by_name:
        log.warning(f"Registration failed: Username '{user_data.username}' already exists.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    # 2. Check if email already exists (using the function added to db_manager)
    if user_data.email:
        existing_user_by_email = db.get_user_by_email(user_data.email)
        if existing_user_by_email:
            log.warning(f"Registration failed: Email '{user_data.email}' already exists.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    # 3. Hash the password
    hashed_password = auth.get_password_hash(user_data.password)

    # 4. Add user to database
    # db.add_user handles potential DB-level UNIQUE constraint errors as a fallback
    user_id = db.add_user(
        username=user_data.username,
        hashed_password=hashed_password,
        email=user_data.email,
        full_name=user_data.full_name,
        is_active=True # New users are active by default (no email verification)
    )

    if user_id is None: # Check if add_user indicated failure (e.g., DB constraint)
        log.error(f"Failed to add user '{user_data.username}' to database. Possible constraint violation.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create user account due to a server error."
        )

    log.info(f"User '{user_data.username}' created successfully with ID: {user_id}")

    # 5. Return created user data (excluding password)
    # Fetch the newly created user to return consistent data defined by UserPublic model
    new_user = db.get_user_by_username(user_data.username)
    if not new_user:
         log.error(f"Failed to retrieve newly created user '{user_data.username}'.")
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error retrieving user after creation.")

    # Use Pydantic's model_validate (v2) or parse_obj (v1) to create response model
    return UserPublic.model_validate(new_user)


# --- Get Current User Endpoint (Keep existing, depends on auth.get_current_active_user) ---
# Define UserResponse model (if not already imported - safer to define/import here)
class UserResponse(OrmBaseModel):
     id: int
     username: str
     email: Optional[str] = None
     full_name: Optional[str] = None
     is_active: bool

@router.get("/users/me", response_model=UserResponse, summary="Get Current User Info")
async def read_users_me(current_user: Dict = Depends(auth.get_current_active_user)):
    """
    Protected endpoint that returns the information of the currently authenticated user.
    Requires a valid Bearer token in the Authorization header.
    """
    log.info(f"Accessed /users/me endpoint for user: {current_user.get('username')}")
    # current_user from get_current_active_user already excludes password
    return current_user