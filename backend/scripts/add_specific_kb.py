# backend/scripts/add_specific_kb.py
import sys, os, logging
# --- Path Setup ---
scripts_dir=os.path.dirname(os.path.abspath(__file__));backend_dir=os.path.dirname(scripts_dir);project_root=os.path.dirname(backend_dir);
if project_root not in sys.path: sys.path.insert(0, project_root)
if backend_dir not in sys.path: sys.path.insert(0, backend_dir)
# --- End Path Setup ---
try: from backend.database import database_manager as db
except ImportError as e: print(f"Import Error: {e}"); sys.exit(1)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s [%(name)s] %(message)s')
log = logging.getLogger(__name__)

kb_entries_to_add = [
    {
        "title": "Laptop Power & Charging Issues",
        "content": "Problem Summary:\nCustomer reported that their laptop is not charging...\n\nSuccessful Solution:\n1. Verify power adapter...\n2. Check LED...\n3. Try different outlet...\n4. Inspect port...\n5. Test different adapter...\n6. Perform hard reset...\n7. Contact manufacturer...",
        "keywords": "laptop,charging,power,adapter,battery,outlet,port,reset,hardware"
    },
    {
        "title": "Application Running Slowly",
        "content": "Problem Summary:\nUser experiences general slowness...\n\nSuccessful Solution:\n1. Close background apps...\n2. Restart application...\n3. Restart computer...\n4. Check Task Manager...\n5. Update OS/App...\n6. Scan for malware...\n7. Check disk space...\n8. Clear cache/reinstall...",
        "keywords": "slow,performance,lag,unresponsive,freeze,cpu,memory,disk,update,restart,cache"
    },
    {
         "title": "Website Connectivity Problem",
         "content": "Problem Summary:\nUser cannot access one particular website...\n\nSuccessful Solution:\n1. Verify URL...\n2. Try different browser...\n3. Try Incognito...\n4. Clear cache/cookies...\n5. Flush DNS...\n6. Disable VPN/Proxy...\n7. Restart router/modem...\n8. Check if site is down...",
         "keywords": "website,connect,timeout,unreachable,browser,cache,cookies,dns,vpn,proxy,router"
    },
    {
         "title": "User Login Failure",
         "content": "Problem Summary:\nUser reports being unable to log in...\n\nSuccessful Solution:\n1. Confirm username...\n2. Ensure Caps Lock off...\n3. Re-type password...\n4. Using new password after reset?...\n5. Clear cache/cookies...\n6. Try Incognito...\n7. Try different device/network...\n8. Verify account status...\n9. Trigger password reset...",
         "keywords": "login,password,credentials,invalid,incorrect,signin,authenticate,cache,account,status"
    }
    # Add more dictionaries here
]

def add_entries():
    log.info(f"Adding {len(kb_entries_to_add)} specific KB entries...")
    count = 0
    db.init_db() # Ensure table exists
    for entry in kb_entries_to_add:
        # Optional: Check if title already exists to prevent duplicates
        existing = db.fetch_one("SELECT id FROM knowledge_base WHERE title = ?", (entry['title'],))
        if existing:
            log.warning(f"KB Entry with title '{entry['title']}' already exists. Skipping.")
            continue

        kb_id = db.add_kb_entry(
            title=entry['title'],
            content=entry['content'],
            keywords=entry.get('keywords'), # Use .get in case keywords missing
            embedding_bytes=None
        )
        if kb_id:
            log.info(f"Added KB entry: '{entry['title']}' (ID: {kb_id})")
            count += 1
        else:
            log.error(f"Failed to add KB entry: '{entry['title']}'")
    log.info(f"Finished adding entries. Added: {count}, Skipped/Failed: {len(kb_entries_to_add) - count}")
    if count > 0:
         log.info("Run 'generate_kb_embeddings.py' next.")

if __name__ == "__main__":
    add_entries()