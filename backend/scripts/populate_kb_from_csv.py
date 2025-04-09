# backend/scripts/populate_kb_from_csv.py

import sys
import os
import csv
import logging
import sqlite3

# --- Path Setup ---
# Ensures the script can find backend modules when run directly
scripts_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(scripts_dir)
project_root = os.path.dirname(backend_dir)
if project_root not in sys.path: sys.path.insert(0, project_root)
if backend_dir not in sys.path: sys.path.insert(0, backend_dir)
# --- End Path Setup ---

# Import database manager after setting path
try:
    from backend.database import database_manager as db
except ImportError as e:
    print(f"Error importing backend modules: {e}")
    print("Ensure you are running this script from the project root or backend directory,"
          " or that PYTHONPATH includes the project root.")
    sys.exit(1)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s [%(name)s] %(message)s')
log = logging.getLogger(__name__)

# --- Configuration ---
CSV_FILE_PATH = os.path.join(backend_dir, 'data', 'Historical_ticket_data.csv')
# --- End Configuration ---

def populate_kb():
    """Reads historical ticket data from CSV and populates the knowledge_base table."""
    log.info(f"Attempting to populate Knowledge Base from CSV: {CSV_FILE_PATH}")

    if not os.path.exists(CSV_FILE_PATH):
        log.error(f"CSV file not found at {CSV_FILE_PATH}. Cannot populate KB.")
        return

    # Ensure DB and table exist
    try:
        db.init_db()
        log.info("Database initialization check complete.")
    except Exception as e:
        log.error(f"Failed to initialize database: {e}")
        return

    inserted_count = 0
    skipped_count = 0
    failed_count = 0

    try:
        # Open CSV file with specific encoding, handling potential BOM
        with open(CSV_FILE_PATH, mode='r', encoding='utf-8-sig') as csvfile:

            # --- Header Cleaning Logic ---
            # Read the first line to get potentially unclean headers
            header_line = csvfile.readline()
            if not header_line:
                log.error("CSV file is empty or header row is missing.")
                return

            # Split headers by comma and strip whitespace from each part
            original_headers = [h.strip() for h in header_line.strip().split(',')]
            log.info(f"Detected and cleaned CSV Headers: {original_headers}")

            # Reset file pointer is not needed as DictReader reads from current position
            # csvfile.seek(0)
            # Read the rest of the file using the *cleaned* headers as fieldnames
            reader = csv.DictReader(csvfile, fieldnames=original_headers)
            # --- End Header Cleaning ---

            # Check if required columns exist *in the cleaned headers*
            required_cols = ['Issue Category', 'Solution', 'Resolution Status']
            if not all(col in original_headers for col in required_cols):
                 log.error(f"CSV file missing required columns after cleaning headers. "
                           f"Need: {required_cols}. Found: {original_headers}")
                 return

            # --- Process each row ---
            for row_num, row in enumerate(reader, start=2): # Start row count from 2 (after header)
                try:
                    # Strip whitespace from values retrieved using .get()
                    resolution_status = row.get('Resolution Status', '').strip()
                    issue = row.get('Issue Category', '').strip()
                    solution = row.get('Solution', '').strip()
                    sentiment = row.get('Sentiment', '').strip() # Optional context
                    ticket_id_ref = row.get('Ticket ID', f'Row {row_num}').strip() # Use row number if ID missing

                    # Process only 'Resolved' tickets for successful solutions
                    if resolution_status.lower() != 'resolved':
                        skipped_count += 1
                        log.debug(f"Row {row_num}: Skipping (Status: '{resolution_status}') - Ticket: {ticket_id_ref}")
                        continue

                    # Ensure mandatory fields for KB entry are present
                    if not issue or not solution:
                        log.warning(f"Row {row_num}: Skipping due to missing Issue Category or Solution - Ticket: {ticket_id_ref}")
                        skipped_count +=1
                        continue

                    # --- Format data for KB entry ---
                    kb_title = f"{issue}" # Simple title based on category
                    # Content includes more context
                    kb_content = f"Issue Type: {issue}\n"
                    if sentiment:
                        kb_content += f"User Sentiment Hint: {sentiment}\n" # Added 'Hint' for clarity
                    kb_content += f"\nSuccessful Solution:\n{solution}"
                    # Basic keywords derived from category and first word of solution
                    kb_keywords = f"{issue.lower().replace(' ','')},{solution.split(' ')[0].lower().rstrip(':.,')}"

                    # Add entry (embedding_bytes is None, will be generated later)
                    kb_id = db.add_kb_entry(
                        title=kb_title,
                        content=kb_content,
                        keywords=kb_keywords,
                        embedding_bytes=None,
                        source_ticket_id=None # Can't reliably parse source ID from example
                    )

                    if kb_id:
                        log.debug(f"Row {row_num}: Added KB entry ID {kb_id} for issue '{issue}'")
                        inserted_count += 1
                    else:
                        log.warning(f"Row {row_num}: Failed to insert KB entry for issue '{issue}' from ticket {ticket_id_ref} (Check DB logs/constraints)")
                        failed_count += 1

                except Exception as row_error:
                    log.error(f"Error processing CSV row {row_num}: {row}. Error: {row_error}", exc_info=False) # Set exc_info=False for cleaner logs unless debugging row errors
                    failed_count += 1

    except FileNotFoundError:
         log.error(f"CSV file could not be found at {CSV_FILE_PATH}.")
         return
    except Exception as e:
        log.error(f"Failed to read or process CSV file {CSV_FILE_PATH}: {e}", exc_info=True)
        return

    log.info("--- KB Population Summary ---")
    log.info(f"Successfully Inserted: {inserted_count}")
    log.info(f"Skipped (e.g., not resolved, missing data): {skipped_count}")
    log.info(f"Failed during processing/insertion: {failed_count}")
    log.info("-----------------------------")
    if inserted_count > 0:
        log.info("IMPORTANT: Run 'backend/scripts/generate_kb_embeddings.py' script next to create embeddings for these new entries.")

if __name__ == "__main__":
    print("--- Populating Knowledge Base from Historical CSV Data ---")
    populate_kb()
    print("--- KB population script finished ---")