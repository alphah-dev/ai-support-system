# backend/auth.py
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Dict, Union
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel, ValidationError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
import logging

from backend.database import database_manager as db # Import DB manager

log = logging.getLogger(__name__)
load_dotenv() # Load environment variables from .env file

# --- Configuration ---
# !! IMPORTANT: Change this in a real application via .env file !!
SECRET_KEY = os.getenv("SECRET_KEY", "your-fallback-secret-key-for-dev-only-0123456789")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")) # Default: 30 minutes

if SECRET_KEY == "your-fallback-secret-key-for-dev-only-0123456789":
    log.warning("Using default fallback SECRET_KEY. Please set a strong SECRET_KEY in your .env file for production!")

# --- Password Hashing ---
# Use bcrypt for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a stored hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generates a hash for a given password."""
    return pwd_context.hash(password)

# --- JWT Token Handling ---

# Pydantic model for the data stored within the JWT payload ("subject")
class TokenData(BaseModel):
    username: Optional[str] = None
    # Add other fields if needed (e.g., user_id, roles)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates a new JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    # The 'sub' (subject) claim is often used for the user identifier (e.g., username or user ID)
    # Ensure the data being encoded includes a subject field if needed later
    # if "sub" not in to_encode:
    #    log.warning("Creating token without 'sub' claim.")

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- OAuth2 Password Bearer ---
# This defines how FastAPI gets the token from the request's Authorization header
# The tokenUrl should point to your login endpoint (we'll create this next)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# --- Dependency for Protected Routes ---
async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Dependency function to verify JWT token and return the user data (or raise exception).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Extract username (or user ID) from the 'sub' claim
        username: str = payload.get("sub")
        if username is None:
            log.warning("Token payload missing 'sub' (subject/username).")
            raise credentials_exception

        # Validate payload structure using TokenData model (optional but good)
        try:
             token_data = TokenData(username=username) # Add other fields if in payload
        except ValidationError:
             log.warning(f"Token payload validation failed for username: {username}")
             raise credentials_exception

    except JWTError as e:
        log.warning(f"JWT Error during token decoding: {e}")
        raise credentials_exception from e

    # Fetch user from database using the username extracted from token
    user = db.get_user_by_username(username=token_data.username)
    if user is None:
        log.warning(f"User '{token_data.username}' from token not found in database.")
        raise credentials_exception

    # Check if user is active (optional but recommended)
    if not user.get("is_active"):
         log.warning(f"User '{token_data.username}' from token is inactive.")
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    # Return the user dictionary (or a Pydantic user model)
    # Be careful not to return the hashed_password here unless needed!
    # Create a safe user representation if necessary
    safe_user = {k: v for k, v in user.items() if k != 'hashed_password'}
    return safe_user


async def get_current_active_user(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Wrapper dependency to ensure the user fetched from token is active.
    This is often used directly in endpoint dependencies.
    """
    # The active check is already in get_current_user now, but this provides a clear dependency name
    # if not current_user.get("is_active"): # Redundant check if get_current_user enforces it
    #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user