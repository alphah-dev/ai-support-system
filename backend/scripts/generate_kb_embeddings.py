# backend/scripts/generate_kb_embeddings.py

import sys
import os
import asyncio
import logging

# --- Path Setup ---
# This section helps Python find your backend modules when running the script directly.
# Get the absolute path of the directory containing this script ('scripts')
scripts_dir = os.path.dirname(os.path.abspath(__file__))
# Get the path to the 'backend' directory (one level up from 'scripts')
backend_dir = os.path.dirname(scripts_dir)
# Get the path to the project root ('ai-support-system', one level up from 'backend')
project_root = os.path.dirname(backend_dir)
# Add the project root to the Python path if it's not already there
if project_root not in sys.path:
    sys.path.insert(0, project_root)
# Add the backend directory too, sometimes needed for sibling imports
if backend_dir not in sys.path:
     sys.path.insert(0, backend_dir)
# --- End Path Setup ---

# Now imports from 'backend.*' should work
from backend.database import database_manager as db
from backend.utils.ollama_integration import get_ollama_embeddings, serialize_embedding, deserialize_embedding # Need deserialize for checking

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s [%(name)s] %(message)s')
log = logging.getLogger(__name__)

# --- Configuration ---
# Ensure this matches the model you pulled and set as default elsewhere
EMBEDDING_MODEL = "nomic-embed-text"
BATCH_SIZE = 5 # Process KB entries in batches (adjust based on memory/performance)
# --- End Configuration ---

async def generate_and_store_embeddings():
    log.info(f"Starting KB embedding generation using model: {EMBEDDING_MODEL}")

    # Fetch KB entries that DO NOT have an embedding currently stored
    # Check for NULL or potentially empty blob depending on DB specifics
    try:
         # Fetch IDs first to avoid loading large content unnecessarily initially
         entries_without_embedding = db.fetch_all(
             "SELECT id FROM knowledge_base WHERE embedding IS NULL OR LENGTH(embedding) = 0"
         )
         entry_ids_to_process = [entry['id'] for entry in entries_without_embedding]

         if not entry_ids_to_process:
             log.info("No KB entries found needing embedding generation.")
             return

         log.info(f"Found {len(entry_ids_to_process)} KB entries to process.")

         processed_count = 0
         failed_count = 0

         # Process in batches by ID
         for i in range(0, len(entry_ids_to_process), BATCH_SIZE):
             batch_ids = entry_ids_to_process[i:i+BATCH_SIZE]
             log.info(f"Processing batch {i//BATCH_SIZE + 1}/{(len(entry_ids_to_process) + BATCH_SIZE - 1)//BATCH_SIZE} (IDs: {batch_ids})...")

             # Fetch full details for the batch
             batch_entries = db.find_kb_entries_by_ids(batch_ids)
             if not batch_entries:
                  log.warning(f"Could not retrieve details for batch IDs: {batch_ids}. Skipping.")
                  failed_count += len(batch_ids)
                  continue

             tasks = []
             # Create async tasks for embedding generation
             for entry in batch_entries:
                 kb_id = entry['id']
                 # Combine title and content for better embedding context
                 text_to_embed = f"Title: {entry.get('title', '')}\nContent: {entry.get('content', '')}"
                 if not text_to_embed.strip():
                     log.warning(f"Skipping KB ID {kb_id} due to empty title/content.")
                     failed_count += 1
                     tasks.append(asyncio.sleep(0, result=None)) # Add a placeholder task that returns None immediately
                     continue

                 # Create an async task for each embedding generation
                 tasks.append(get_ollama_embeddings(text_to_embed, model=EMBEDDING_MODEL))

             # Run embedding generation for the batch concurrently
             embeddings = await asyncio.gather(*tasks, return_exceptions=True) # Capture exceptions

             # Save embeddings for the batch
             for entry, embedding_result in zip(batch_entries, embeddings):
                 kb_id = entry['id']
                 if isinstance(embedding_result, Exception):
                     log.error(f"Error generating embedding for KB ID {kb_id}: {embedding_result}")
                     failed_count += 1
                 elif embedding_result: # Check if embedding is not None
                     if db.update_kb_embedding(kb_id, embedding_result):
                         log.debug(f"Successfully generated and stored embedding for KB ID {kb_id}")
                         processed_count += 1
                     else:
                         log.error(f"Failed to store embedding in DB for KB ID {kb_id}")
                         failed_count += 1
                 elif text_to_embed.strip(): # Only log failure if it wasn't skipped earlier
                     log.error(f"Failed to generate embedding (returned None) for KB ID {kb_id}")
                     failed_count += 1
                 # else: skipped due to empty content, already counted

             log.info(f"Batch processing complete. Sleeping for 1 second...") # Avoid overwhelming Ollama/DB
             await asyncio.sleep(1)

    except Exception as e:
        log.error(f"An unexpected error occurred during the embedding generation process: {e}", exc_info=True)
        # Ensure summary still runs if possible
        processed_count = processed_count if 'processed_count' in locals() else 0
        failed_count = failed_count if 'failed_count' in locals() else len(entry_ids_to_process) - processed_count


    log.info("--- Embedding Generation Summary ---")
    log.info(f"Successfully processed: {processed_count}")
    log.info(f"Failed or Skipped: {failed_count}")
    log.info("------------------------------------")


if __name__ == "__main__":
    # Ensure Ollama server is running before executing this script
    print("--- Starting Knowledge Base Embedding Generation ---")
    print(f"--- Using Model: {EMBEDDING_MODEL} ---")
    print("--- Ensure your Ollama server is running with the model available ---")
    # Add a small delay for user to read message
    # time.sleep(2) # requires importing time
    try:
         asyncio.run(generate_and_store_embeddings())
         print("--- Embedding generation script finished ---")
    except KeyboardInterrupt:
         print("\n--- Embedding generation interrupted by user ---")
    except Exception as e:
        print(f"\n--- Script failed with error: {e} ---")