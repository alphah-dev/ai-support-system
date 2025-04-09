# backend/database/database_manager.py

import sqlite3
import os
import json
import logging
from contextlib import contextmanager
from typing import List, Dict, Any, Optional

# Import serialization functions from utils if not already done
try:
    from backend.utils.ollama_integration import serialize_embedding, deserialize_embedding
except ImportError:
    # Handle case where ollama_integration might not be fully ready yet during init
    serialize_embedding = lambda x: None
    deserialize_embedding = lambda x: None
    logging.warning("Could not import embedding utils in database_manager.")


# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Define the path to the database file relative to this script's location
DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'support_system.db')

@contextmanager
def get_db_connection():
    """Provides a managed database connection."""
    conn = None
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        logging.debug("Database connection established.")
        yield conn
    except sqlite3.Error as e:
        logging.error(f"Database connection error: {e}")
        raise
    finally:
        if conn:
            conn.close()
            logging.debug("Database connection closed.")

def init_db(force_recreate=False):
    """Initializes the database using the schema.sql file."""
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    if force_recreate and os.path.exists(DATABASE_PATH):
        logging.warning(f"Force recreate: Removing existing database at {DATABASE_PATH}")
        try:
            os.remove(DATABASE_PATH)
        except OSError as e:
            logging.error(f"Error removing existing database: {e}")
            # Decide if you want to proceed or stop
            return 

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
            if os.path.exists(DATABASE_PATH): # Clean up partial file
                try:
                    os.remove(DATABASE_PATH)
                except OSError: pass
            raise
        except IOError as e:
             logging.error(f"Failed to read schema file {schema_path}: {e}")
             raise
    else:
         logging.info(f"Database already exists at {DATABASE_PATH}.")


def execute_query(query: str, params: tuple = ()) -> Optional[int]:
    """Executes a write query (INSERT, UPDATE, DELETE). Returns last inserted row ID."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            logging.debug(f"Executing query: {query} with params: {params}")
            cursor.execute(query, params)
            conn.commit()
            last_id = cursor.lastrowid
            # logging.debug(f"Query executed successfully. Last row ID: {last_id}, Rows affected: {cursor.rowcount}")
            return last_id
    except sqlite3.Error as e:
        logging.error(f"Database query error executing '{query}' with params {params}: {e}")
        return None # Indicate failure

def fetch_one(query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    """Fetches a single row."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # logging.debug(f"Fetching one: {query} with params: {params}")
            cursor.execute(query, params)
            row = cursor.fetchone()
            return dict(row) if row else None
    except sqlite3.Error as e:
        logging.error(f"Database query error fetching one '{query}' with params {params}: {e}")
        return None

def fetch_all(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """Fetches all rows."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # logging.debug(f"Fetching all: {query} with params: {params}")
            cursor.execute(query, params)
            rows = cursor.fetchall()
            # logging.debug(f"Fetched {len(rows)} rows.")
            return [dict(row) for row in rows]
    except sqlite3.Error as e:
        logging.error(f"Database query error fetching all '{query}' with params {params}: {e}")
        return []

# --- Specific CRUD Operations ---

# == Tickets (Keep existing ticket functions) ==
def add_ticket(customer_name: str, subject: str, body: str, customer_email: Optional[str] = None, priority: str = 'Medium') -> Optional[int]:
    query = "INSERT INTO tickets (customer_name, customer_email, subject, body, priority, status) VALUES (?, ?, ?, ?, ?, 'Open')"
    return execute_query(query, (customer_name, customer_email, subject, body, priority))
def get_ticket(ticket_id: int) -> Optional[Dict[str, Any]]:
    return fetch_one("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
def get_all_tickets(status: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
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
    resolved_at_update = ", resolved_at = CURRENT_TIMESTAMP" if status in ['Resolved', 'Closed'] else ""
    query = f"UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP{resolved_at_update} WHERE id = ?"
    result = execute_query(query, (status, ticket_id))
    return result is not None
def update_ticket_assignment(ticket_id: int, agent_id: Optional[int], team: Optional[str]) -> bool:
    query = "UPDATE tickets SET assigned_agent_id = ?, assigned_team = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    result = execute_query(query, (agent_id, team, ticket_id))
    return result is not None
def update_ticket_summary(ticket_id: int, summary: str, actions: List[str]) -> bool:
    try:
        actions_list = actions if isinstance(actions, list) else []
        actions_json = json.dumps(actions_list)
        query = "UPDATE tickets SET summary = ?, extracted_actions = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        result = execute_query(query, (summary, actions_json, ticket_id))
        return result is not None
    except TypeError as e:
         logging.error(f"Failed to serialize actions to JSON for ticket {ticket_id}: {e}")
         return False
def update_ticket_prediction(ticket_id: int, predicted_time: Optional[int]) -> bool:
    query = "UPDATE tickets SET predicted_resolution_time = ? WHERE id = ?"
    result = execute_query(query, (predicted_time, ticket_id))
    return result is not None


# == Knowledge Base (Keep existing KB functions) ==
def add_kb_entry(title: str, content: str, keywords: Optional[str] = None, embedding_bytes: Optional[bytes] = None, source_ticket_id: Optional[int] = None) -> Optional[int]:
    query = "INSERT INTO knowledge_base (title, content, keywords, embedding, source_ticket_id) VALUES (?, ?, ?, ?, ?)"
    return execute_query(query, (title, content, keywords, embedding_bytes, source_ticket_id))
def update_kb_embedding(kb_id: int, embedding: List[float]) -> bool:
    embedding_bytes = serialize_embedding(embedding)
    if embedding_bytes is None and embedding is not None:
        logging.error(f"Failed to serialize embedding for KB ID {kb_id}. Not updating.")
        return False
    query = "UPDATE knowledge_base SET embedding = ? WHERE id = ?"
    result = execute_query(query, (embedding_bytes, kb_id))
    return result is not None
def find_kb_entries_by_ids(ids: List[int]) -> List[Dict[str, Any]]:
    if not ids: return []
    placeholders = ','.join('?' for _ in ids)
    query = f"SELECT id, title, content, embedding, success_rate, usage_count FROM knowledge_base WHERE id IN ({placeholders})"
    return fetch_all(query, tuple(ids))
def get_all_kb_entries_with_embeddings(limit: int = 1000) -> List[Dict[str, Any]]:
    query = "SELECT id, title, content, embedding, success_rate, usage_count FROM knowledge_base WHERE embedding IS NOT NULL LIMIT ?"
    return fetch_all(query, (limit,))
def get_kb_entry(kb_id: int) -> Optional[Dict[str, Any]]:
     return fetch_one("SELECT id, title, content, embedding, success_rate, usage_count FROM knowledge_base WHERE id = ?", (kb_id,))


# == Agents (Keep existing Agent functions) ==
def add_agent(name: str, email: str, skills: Optional[str] = None) -> Optional[int]:
    query = "INSERT INTO agents (name, email, skills) VALUES (?, ?, ?)"
    try:
        return execute_query(query, (name, email, skills))
    except sqlite3.IntegrityError as e:
        if "UNIQUE constraint failed: agents.email" in str(e): logging.error(f"Email '{email}' already exists.")
        else: logging.error(f"DB integrity error adding agent: {e}")
        return None
def get_agent(agent_id: int) -> Optional[Dict[str, Any]]:
    return fetch_one("SELECT * FROM agents WHERE id = ?", (agent_id,))
def get_available_agents() -> List[Dict[str, Any]]:
    return fetch_all("SELECT id, name, email, skills, current_load, is_available FROM agents WHERE is_available = 1 ORDER BY current_load ASC")


# == Users (Existing + Added get_user_by_email) ==
def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Retrieves a user by their username."""
    query = "SELECT id, username, hashed_password, is_active, full_name, email FROM users WHERE username = ?"
    return fetch_one(query, (username,))

# <<<--- ADDED THIS FUNCTION ---<<<
def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Retrieves a user by their email address."""
    # Only return minimal info needed to check existence
    query = "SELECT id, username FROM users WHERE email = ?"
    return fetch_one(query, (email,))
# <<<---------------------------<<<

def add_user(username: str, hashed_password: str, email: Optional[str] = None, full_name: Optional[str] = None, is_active: bool = True) -> Optional[int]:
    """Adds a new user to the database. Assumes password is ALREADY hashed."""
    query = "INSERT INTO users (username, hashed_password, email, full_name, is_active) VALUES (?, ?, ?, ?, ?)"
    try:
        active_flag = 1 if is_active else 0
        return execute_query(query, (username, hashed_password, email, full_name, active_flag))
    except sqlite3.IntegrityError as e:
        if "UNIQUE constraint failed: users.username" in str(e):
             logging.error(f"DB Error: Username '{username}' already exists.")
        elif "UNIQUE constraint failed: users.email" in str(e) and email:
             logging.error(f"DB Error: Email '{email}' already exists.")
        else:
             logging.error(f"Database integrity error adding user: {e}")
        return None


# --- Main execution block (Keep as is) ---
if __name__ == "__main__":
    print("Running database manager script...")
    try:
        init_db()
        print("Database initialization check complete.")
    except Exception as e:
        print(f"An error occurred during database manager execution: {e}")