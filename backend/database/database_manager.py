# backend/database/database_manager.py

import sqlite3
import os
import json
import logging # Import logging
from contextlib import contextmanager
from typing import List, Dict, Any, Optional

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Define the path to the database file relative to this script's location
DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'support_system.db')

@contextmanager
def get_db_connection():
    """Provides a managed database connection."""
    conn = None # Initialize conn to None
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row # Return rows as dictionary-like objects
        logging.debug("Database connection established.")
        yield conn
    except sqlite3.Error as e:
        logging.error(f"Database connection error: {e}")
        # Optionally re-raise or handle differently
        raise # Re-raise the exception so calling code knows about the failure
    finally:
        if conn:
            conn.close()
            logging.debug("Database connection closed.")

def init_db(force_recreate=False):
    """Initializes the database using the schema.sql file."""
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')

    if force_recreate and os.path.exists(DATABASE_PATH):
        logging.warning(f"Force recreate: Removing existing database at {DATABASE_PATH}")
        os.remove(DATABASE_PATH)

    if not os.path.exists(DATABASE_PATH):
        logging.info(f"Database not found at {DATABASE_PATH}. Initializing...")
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                with open(schema_path, 'r') as f:
                    sql_script = f.read()
                cursor.executescript(sql_script)
                conn.commit()
                logging.info("Database initialized successfully from schema.sql.")
        except sqlite3.Error as e:
            logging.error(f"Failed to initialize database: {e}")
            # Clean up potentially partially created file if initialization failed
            if os.path.exists(DATABASE_PATH):
                os.remove(DATABASE_PATH)
            raise
        except IOError as e:
             logging.error(f"Failed to read schema file {schema_path}: {e}")
             raise
    else:
         logging.info(f"Database already exists at {DATABASE_PATH}.")


def execute_query(query: str, params: tuple = ()) -> Optional[int]:
    """
    Executes a write query (INSERT, UPDATE, DELETE).
    Returns the last inserted row ID for INSERT queries, otherwise None.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            logging.debug(f"Executing query: {query} with params: {params}")
            cursor.execute(query, params)
            conn.commit()
            last_id = cursor.lastrowid
            logging.debug(f"Query executed successfully. Last row ID: {last_id}")
            # For UPDATE/DELETE, lastrowid might be 0 or None depending on DB/driver.
            # Consider returning cursor.rowcount if affected rows count is needed for UPDATE/DELETE.
            return last_id
    except sqlite3.Error as e:
        logging.error(f"Database query error executing '{query}' with params {params}: {e}")
        # Depending on requirements, you might want to raise the exception
        # raise e
        return None # Indicate failure

def fetch_one(query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    """Fetches a single row."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            logging.debug(f"Fetching one: {query} with params: {params}")
            cursor.execute(query, params)
            row = cursor.fetchone()
            if row:
                logging.debug("Row fetched successfully.")
                return dict(row)
            else:
                logging.debug("No row found.")
                return None
    except sqlite3.Error as e:
        logging.error(f"Database query error fetching one '{query}' with params {params}: {e}")
        return None

def fetch_all(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """Fetches all rows."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            logging.debug(f"Fetching all: {query} with params: {params}")
            cursor.execute(query, params)
            rows = cursor.fetchall()
            logging.debug(f"Fetched {len(rows)} rows.")
            return [dict(row) for row in rows]
    except sqlite3.Error as e:
        logging.error(f"Database query error fetching all '{query}' with params {params}: {e}")
        return [] # Return empty list on error

# --- Specific CRUD Operations ---

# == Tickets ==
def add_ticket(customer_name: str, subject: str, body: str, customer_email: Optional[str] = None, priority: str = 'Medium') -> Optional[int]:
    """Adds a new ticket and returns its ID."""
    query = """
        INSERT INTO tickets (customer_name, customer_email, subject, body, priority, status)
        VALUES (?, ?, ?, ?, ?, 'Open')
    """
    return execute_query(query, (customer_name, customer_email, subject, body, priority))

def get_ticket(ticket_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves a single ticket by ID."""
    return fetch_one("SELECT * FROM tickets WHERE id = ?", (ticket_id,))

def get_all_tickets(status: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    """Retrieves multiple tickets, optionally filtered by status."""
    base_query = "SELECT * FROM tickets"
    params = []
    conditions = []

    if status:
        conditions.append("status = ?")
        params.append(status)

    if conditions:
        base_query += " WHERE " + " AND ".join(conditions)

    base_query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    return fetch_all(base_query, tuple(params))

def update_ticket_status(ticket_id: int, status: str) -> bool:
    """Updates the status of a ticket. Returns True on success."""
    resolved_at_update = ""
    params = [status]
    if status in ['Resolved', 'Closed']:
         resolved_at_update = ", resolved_at = CURRENT_TIMESTAMP"

    params.append(ticket_id)
    query = f"UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP{resolved_at_update} WHERE id = ?"

    result = execute_query(query, tuple(params))
    # Simplified success check: if execute_query didn't return None (which indicates an exception occurred)
    return result is not None # Or check affected rows if execute_query is modified

def update_ticket_assignment(ticket_id: int, agent_id: Optional[int], team: Optional[str]) -> bool:
    """Assigns a ticket to an agent or team. Returns True on success."""
    query = """
        UPDATE tickets
        SET assigned_agent_id = ?, assigned_team = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """
    result = execute_query(query, (agent_id, team, ticket_id))
    return result is not None # Simplified success check

def update_ticket_summary(ticket_id: int, summary: str, actions: List[str]) -> bool:
    """Updates the summary and extracted actions (stored as JSON). Returns True on success."""
    try:
        # Ensure actions is a list, default to empty list if None
        actions_list = actions if isinstance(actions, list) else []
        actions_json = json.dumps(actions_list)
        query = """
            UPDATE tickets
            SET summary = ?, extracted_actions = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """
        result = execute_query(query, (summary, actions_json, ticket_id))
        return result is not None
    except TypeError as e:
         logging.error(f"Failed to serialize actions to JSON for ticket {ticket_id}: {e}")
         return False

def update_ticket_prediction(ticket_id: int, predicted_time: Optional[int]) -> bool:
    """Updates the predicted resolution time. Returns True on success."""
    query = "UPDATE tickets SET predicted_resolution_time = ? WHERE id = ?"
    result = execute_query(query, (predicted_time, ticket_id))
    return result is not None # Simplified success check


# == Knowledge Base (Add functions as needed) ==
def add_kb_entry(title: str, content: str, keywords: Optional[str] = None, embedding: Optional[bytes] = None, source_ticket_id: Optional[int] = None) -> Optional[int]:
    """Adds a new knowledge base entry."""
    query = """
        INSERT INTO knowledge_base (title, content, keywords, embedding, source_ticket_id)
        VALUES (?, ?, ?, ?, ?)
    """
    return execute_query(query, (title, content, keywords, embedding, source_ticket_id))

def find_kb_entries_by_ids(ids: List[int]) -> List[Dict[str, Any]]:
    """Retrieves specific KB entries by their IDs."""
    if not ids:
        return []
    placeholders = ','.join('?' for _ in ids)
    query = f"SELECT id, title, content, success_rate, usage_count FROM knowledge_base WHERE id IN ({placeholders})"
    return fetch_all(query, tuple(ids))

def get_all_kb_entries_with_embeddings(limit: int = 1000) -> List[Dict[str, Any]]:
    """Retrieves all KB entries along with their embeddings (if present)."""
    # Warning: Fetching all embeddings might consume a lot of memory for large KBs
    query = "SELECT id, title, content, embedding, success_rate, usage_count FROM knowledge_base WHERE embedding IS NOT NULL LIMIT ?"
    return fetch_all(query, (limit,))


# == Agents (Add functions as needed) ==
def add_agent(name: str, email: str, skills: Optional[str] = None) -> Optional[int]:
    """Adds a new agent."""
    query = "INSERT INTO agents (name, email, skills) VALUES (?, ?, ?)"
    try:
        return execute_query(query, (name, email, skills))
    except sqlite3.IntegrityError as e:
         # Handle UNIQUE constraint violation for email
        if "UNIQUE constraint failed: agents.email" in str(e):
            logging.error(f"Failed to add agent. Email '{email}' already exists.")
        else:
             logging.error(f"Database integrity error adding agent: {e}")
        return None


def get_agent(agent_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves agent details by ID."""
    return fetch_one("SELECT * FROM agents WHERE id = ?", (agent_id,))

def get_available_agents() -> List[Dict[str, Any]]:
    """Retrieves agents marked as available, ordered by current load."""
    # Note: 'is_available = TRUE' works in SQLite (1 is TRUE)
    return fetch_all("SELECT id, name, email, skills, current_load, is_available FROM agents WHERE is_available = 1 ORDER BY current_load ASC")


# --- Main execution block for testing/initialization ---
if __name__ == "__main__":
    # This block runs only when the script is executed directly (e.g., python -m backend.database.database_manager)
    print("Running database manager script...")
    try:
        init_db()
        print("Database initialization check complete.")
        # Example: Add a test ticket if needed (usually done in sample_data.py)
        # ticket_id = add_ticket("Test User", "Test Subject", "This is a test body.")
        # if ticket_id:
        #     print(f"Added test ticket with ID: {ticket_id}")
        #     retrieved_ticket = get_ticket(ticket_id)
        #     print(f"Retrieved test ticket: {retrieved_ticket}")
        print("Database manager script finished.")
    except Exception as e:
        print(f"An error occurred during database manager execution: {e}")