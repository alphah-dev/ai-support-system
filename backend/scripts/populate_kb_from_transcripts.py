# backend/scripts/populate_kb_from_transcripts.py

import sys
import os
import re # For parsing
import logging

# --- Path Setup ---
scripts_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(scripts_dir)
project_root = os.path.dirname(backend_dir)
if project_root not in sys.path: sys.path.insert(0, project_root)
if backend_dir not in sys.path: sys.path.insert(0, backend_dir)
# --- End Path Setup ---

try:
    from backend.database import database_manager as db
except ImportError as e:
    print(f"Error importing backend modules: {e}")
    sys.exit(1)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s [%(name)s] %(message)s')
log = logging.getLogger(__name__)

# --- Configuration ---
TRANSCRIPT_DIR = os.path.join(backend_dir, 'data')
# --- End Configuration ---

def extract_info_from_transcript(content: str) -> dict:
    """Parses transcript content to extract key info."""
    info = {'category': None, 'problem': None, 'solution': None, 'keywords': set()}

    # Simple Regex examples (these might need refinement based on actual file consistency)
    category_match = re.search(r"Category:\s*(.+)", content, re.IGNORECASE)
    if category_match:
        info['category'] = category_match.group(1).strip()
        info['keywords'].add(info['category'].lower().replace(' ',''))

    # Try to find first customer message as problem description
    # Look for "Customer:" and capture text until the next "Agent:" or end of section
    problem_match = re.search(r"Customer:\s*\"(.+?)\"(?:\s*Agent:|\s*$)", content, re.DOTALL | re.IGNORECASE)
    if problem_match:
        # Summarize problem slightly (e.g., first 150 chars) or use LLM later for better summary
        problem_desc = problem_match.group(1).strip().replace('\n', ' ')
        info['problem'] = problem_desc[:150] + ('...' if len(problem_desc) > 150 else '')
        # Add keywords from problem
        for word in problem_desc.lower().split()[:15]: # Limit keyword extraction
             if len(word) > 3 and word.isalnum(): info['keywords'].add(word)


    # Try to find the *last* agent message that seems like a solution or closing statement
    # This is heuristic - finding the exact "solution" line programmatically is hard
    solution = None
    agent_messages = re.findall(r"Agent:\s*\"(.*?)\"", content, re.DOTALL | re.IGNORECASE)
    if agent_messages:
        last_message = agent_messages[-1].strip()
        # Look for keywords indicating resolution or next steps provided *by the agent*
        solution_keywords = ["upgrading", "update", "disable", "retry", "download", "check", "clear cache", "reinstall", "rollback", "offer", "discount", "reset sync", "force full sync", "verify", "use different", "fixed", "worked", "resolved"]
        # Find the *first* agent message containing a likely solution keyword
        for msg in agent_messages:
            msg_lower = msg.lower()
            if any(keyword in msg_lower for keyword in solution_keywords):
                # Use a snippet of this message as the likely solution
                solution_snippet = msg.strip().replace('\n', ' ')
                solution = solution_snippet[:200] + ('...' if len(solution_snippet) > 200 else '')
                # Add keywords from solution
                for word in solution.lower().split()[:10]:
                     if len(word) > 3 and word.isalnum(): info['keywords'].add(word)
                break # Found a likely solution message

        # Fallback if no keyword match: Use last agent message if it doesn't sound like just a greeting/closing
        if not solution and last_message and not any(close in last_message.lower() for close in ["goodbye", "cheers", "have a great day"]):
             solution = last_message[:200] + ('...' if len(last_message) > 200 else '')
             for word in solution.lower().split()[:10]:
                     if len(word) > 3 and word.isalnum(): info['keywords'].add(word)


    info['solution'] = solution or "Solution details not clearly identified in transcript."

    return info

def populate_kb_from_transcripts():
    log.info(f"Scanning directory for transcripts: {TRANSCRIPT_DIR}")

    if not os.path.isdir(TRANSCRIPT_DIR):
        log.error(f"Transcript directory not found: {TRANSCRIPT_DIR}")
        return

    # Ensure DB and table exist
    try:
        db.init_db()
        log.info("Database initialization check complete.")
        # Optional: Clear existing KB entries first?
        # log.warning("Clearing existing Knowledge Base entries...")
        # db.execute_query("DELETE FROM knowledge_base;")
        # db.execute_query("DELETE FROM sqlite_sequence WHERE name='knowledge_base';")
    except Exception as e:
        log.error(f"Failed to initialize database: {e}")
        return

    inserted_count = 0
    failed_count = 0

    for filename in os.listdir(TRANSCRIPT_DIR):
        if filename.lower().endswith(".txt"):
            filepath = os.path.join(TRANSCRIPT_DIR, filename)
            log.debug(f"Processing file: {filename}")
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                info = extract_info_from_transcript(content)

                if not info.get('category') or not info.get('solution') or not info.get('problem'):
                    log.warning(f"Could not extract sufficient info from {filename}. Skipping.")
                    failed_count += 1
                    continue

                # Format KB entry
                kb_title = info['category']
                kb_content = f"Problem Summary:\n{info['problem']}\n\n" \
                             f"Successful Solution:\n{info['solution']}"
                kb_keywords = ",".join(sorted(list(info['keywords']))) # Comma-separated sorted keywords

                # Add to DB
                kb_id = db.add_kb_entry(
                    title=kb_title,
                    content=kb_content,
                    keywords=kb_keywords,
                    embedding_bytes=None, # Embeddings generated separately
                    source_ticket_id=None # Extracting this reliably is hard
                )

                if kb_id:
                    log.info(f"Added KB entry ID {kb_id} from file '{filename}'")
                    inserted_count += 1
                else:
                    log.warning(f"Failed to insert KB entry from file '{filename}' (Check DB logs)")
                    failed_count += 1

            except Exception as file_error:
                log.error(f"Error processing file {filename}: {file_error}", exc_info=True)
                failed_count += 1

    log.info("--- KB Population from Transcripts Summary ---")
    log.info(f"Successfully Inserted: {inserted_count}")
    log.info(f"Failed or Skipped: {failed_count}")
    log.info("--------------------------------------------")
    if inserted_count > 0:
         log.info("IMPORTANT: Run 'backend/scripts/generate_kb_embeddings.py' script next.")


if __name__ == "__main__":
    print("--- Populating Knowledge Base from Transcript TXT Files ---")
    populate_kb_from_transcripts()
    print("--- KB population script finished ---")