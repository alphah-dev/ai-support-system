# backend/scripts/create_initial_user.py

import sys
import os
import logging
import getpass # To securely get password input
import sqlite3 # Import to catch specific DB errors

# --- Path Setup ---
scripts_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(scripts_dir)
project_root = os.path.dirname(backend_dir)
if project_root not in sys.path: sys.path.insert(0, project_root)
if backend_dir not in sys.path: sys.path.insert(0, backend_dir)
# --- End Path Setup ---

# Import necessary functions AFTER path setup
try:
    from backend.database import database_manager as db
    from backend.auth import get_password_hash # Import hashing function
except ImportError as e:
    print(f"Error importing backend modules: {e}")
    print("Ensure you are running this script from the project root directory or that PYTHONPATH is set correctly.")
    sys.exit(1)


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
log = logging.getLogger(__name__)

def create_user():
    """Prompts for user details and creates the initial user."""
    log.info("--- Create Initial User ---")
    try:
        db.init_db() # Ensure DB and users table exist
    except Exception as e:
        log.error(f"Failed to initialize database: {e}")
        return # Cannot proceed if DB init fails

    while True:
        username = input("Enter username: ").strip()
        if username:
            try:
                existing = db.get_user_by_username(username)
                if existing:
                     log.error(f"Username '{username}' already exists. Please choose another.")
                else:
                    break # Username is valid and available
            except Exception as e:
                log.error(f"Error checking username existence: {e}")
                return # Stop if DB check fails
        else:
            log.warning("Username cannot be empty.")

    while True:
        password = getpass.getpass("Enter password (min 8 chars): ")
        if not password:
             log.warning("Password cannot be empty.")
             continue
        if len(password) < 8:
             log.warning("Password must be at least 8 characters long.")
             continue

        password_confirm = getpass.getpass("Confirm password: ")
        if password == password_confirm:
            break
        else:
            log.error("Passwords do not match. Please try again.")

    # Optional fields
    email = input(f"Enter email for {username} (optional, press Enter to skip): ").strip() or None
    full_name = input(f"Enter full name for {username} (optional, press Enter to skip): ").strip() or None

    # Hash the password
    try:
        hashed_password = get_password_hash(password)
        log.info("Password hashed successfully.")
    except Exception as e:
        log.error(f"Error hashing password: {e}")
        return # Cannot proceed without hashed password

    # Add user to database
    try:
        user_id = db.add_user(
            username=username,
            hashed_password=hashed_password,
            email=email,
            full_name=full_name,
            is_active=True # Default to active
        )

        if user_id:
            log.info(f"Successfully created user '{username}' with ID: {user_id}")
        else:
            # add_user already logs specific constraint errors
            log.error(f"Failed to add user '{username}' to the database (check previous logs for specific error like duplicate email/username).")

    except Exception as e:
        log.error(f"An unexpected error occurred while adding user to database: {e}")


if __name__ == "__main__":
    create_user()