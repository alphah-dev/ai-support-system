# backend/database/sample_data.py

import sqlite3
import logging
# Import necessary functions and the DB path from database_manager
from .database_manager import (
    DATABASE_PATH,
    init_db,
    add_ticket,
    add_kb_entry,
    add_agent,
    update_ticket_assignment, # Import update functions
    update_ticket_status,
    execute_query # Use execute_query for generic inserts/deletes/updates if needed
)

# Configure basic logging for this script
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def clear_data():
    """Clears existing data from the tables."""
    logging.warning("Clearing existing data from all tables...")
    try:
        # Order matters due to potential foreign key constraints if enforced
        execute_query("DELETE FROM tickets;")
        execute_query("DELETE FROM knowledge_base;")
        execute_query("DELETE FROM agents;")
        # Reset autoincrement counters
        execute_query("DELETE FROM sqlite_sequence WHERE name IN ('tickets', 'knowledge_base', 'agents');")
        logging.info("Existing data cleared.")
        return True
    except sqlite3.Error as e:
        logging.error(f"An error occurred while clearing data: {e}")
        # Decide if you want to stop population if clearing fails
        return False


def populate():
    """Populates the database with sample data."""
    logging.info("Attempting to populate database with sample data...")

    try:
        # Ensure DB and tables exist, but don't force recreate here
        init_db()

        # Clear existing data before populating (optional, but makes script repeatable)
        if not clear_data():
            logging.error("Stopping population due to error during data clearing.")
            return

        # --- Add Sample Agents ---
        logging.info("Adding sample agents...")
        agent1_id = add_agent('Alice Smith', 'alice@example.com', 'Billing,Login,API')
        agent2_id = add_agent('Bob Johnson', 'bob@example.com', 'Technical,API,Database')
        agent3_id = add_agent('Charlie Brown', 'charlie@example.com', 'General,Login,UI')
        agent4_id = add_agent('Diana Prince', 'diana@example.com', 'Billing,Technical')

        # Manually update availability/load for some agents for realism
        if agent3_id:
            execute_query("UPDATE agents SET is_available = ?, current_load = ? WHERE id = ?", (0, 3, agent3_id)) # Use 0 for False in SQLite
        if agent1_id:
             execute_query("UPDATE agents SET current_load = ? WHERE id = ?", (2, agent1_id))
        if agent2_id:
             execute_query("UPDATE agents SET current_load = ? WHERE id = ?", (1, agent2_id))

        logging.info(f"Added agents with IDs: {[agent1_id, agent2_id, agent3_id, agent4_id]}")

        # --- Add Sample Tickets ---
        logging.info("Adding sample tickets...")
        t1 = add_ticket("John Doe", "Login Issue", "I cannot log into my account. It says 'Invalid Credentials'. I reset my password yesterday.", "john.doe@email.com", "High")
        t2 = add_ticket("Jane Roe", "API Request Failing", "My POST request to /api/v1/users returns a 500 error. Please help.", "jane.roe@email.com", "Urgent")
        t3 = add_ticket("Peter Jones", "Billing Question", "I was charged twice this month. Can you check my invoice?", "peter.j@email.com", "Medium")
        t4 = add_ticket("Mary Major", "Feature Request", "Can you add a dark mode to the dashboard?", "mary.m@email.com", "Low")
        t5 = add_ticket("Test User", "Old Resolved Ticket", "This issue was fixed last week.", "test@example.com", "Medium")

        # Update status/assignment for some tickets for variety
        if t2 and agent2_id: # Assign urgent API issue to Bob
            update_ticket_assignment(t2, agent_id=agent2_id, team="Technical")
            update_ticket_status(t2, "In Progress")
        if t3 and agent1_id: # Assign billing question to Alice
            update_ticket_assignment(t3, agent_id=agent1_id, team="Billing")
        if t1: # Leave T1 Open and unassigned for now
             update_ticket_assignment(t1, agent_id=None, team="AccountSupport") # Assign to team queue
        if t5: # Mark old ticket as resolved/closed
            update_ticket_status(t5, "Resolved")
            update_ticket_status(t5, "Closed") # Simulate going through both states
            # Add resolution details (usually done by agent)
            execute_query("UPDATE tickets SET resolution_details = ? WHERE id = ?", ("Issue resolved by clearing cache.", t5))

        logging.info(f"Added tickets with IDs: {[t1, t2, t3, t4, t5]}")

        # --- Add Sample Knowledge Base Entries ---
        logging.info("Adding sample knowledge base entries...")
        # Note: We are not adding embeddings here yet. They will be generated later.
        kb1 = add_kb_entry(
            title="Password Reset Procedure",
            content="To reset your password, go to the login page and click 'Forgot Password'. Enter your email address to receive a reset link. Ensure you check your spam folder.",
            keywords="password,reset,login,credentials,forgot",
            source_ticket_id=t1 # Link to the login issue ticket
        )
        # Manually update success/usage for realism
        if kb1: execute_query("UPDATE knowledge_base SET success_rate = ?, usage_count = ? WHERE id = ?", (0.92, 55, kb1))

        kb2 = add_kb_entry(
            title="Troubleshooting 500 API Errors",
            content="Check API logs for details. Common causes include invalid input data format (JSON validation), database connection issues during the request, or unhandled exceptions in the endpoint logic. Verify request headers (Authorization, Content-Type) and payload structure.",
            keywords="api,error,500,server,debug,internal,json,database",
            source_ticket_id=t2
        )
        if kb2: execute_query("UPDATE knowledge_base SET success_rate = ?, usage_count = ? WHERE id = ?", (0.75, 30, kb2))

        kb3 = add_kb_entry(
            title="Checking Billing History",
            content="Navigate to Account > Billing > History page in the user dashboard to view all past invoices and payments. Dates and amounts are listed clearly.",
            keywords="billing,invoice,payment,charge,history,account",
            source_ticket_id=t3
        )
        if kb3: execute_query("UPDATE knowledge_base SET success_rate = ?, usage_count = ? WHERE id = ?", (0.98, 80, kb3))

        logging.info(f"Added KB entries with IDs: {[kb1, kb2, kb3]}")

        logging.info("Sample data population completed successfully.")

    except sqlite3.Error as e:
        logging.error(f"A database error occurred during data population: {e}")
    except Exception as e:
        logging.error(f"An unexpected error occurred during data population: {e}", exc_info=True) # Log traceback

# Make the script runnable directly
if __name__ == "__main__":
    # This allows running: python -m backend.database.sample_data
    populate()