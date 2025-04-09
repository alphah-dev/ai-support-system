# backend/agents/routing_agent.py
from typing import Dict, List, Optional, Tuple, Any
import logging
import asyncio
import random # Added for placeholder agent assignment variability

# --- Imports for potential real implementation (keep commented for now) ---
# from backend.utils.ollama_integration import get_ollama_embeddings
# from backend.utils.external_data import fetch_agent_availability_and_skills
# from backend.database import database_manager as db
# --- End Imports ---


log = logging.getLogger(__name__)

class RoutingAgent:
    # Store model name, even if not used in placeholder
    def __init__(self, embedding_model: str = "nomic-embed-text"):
        self.embedding_model = embedding_model
        log.info(f"RoutingAgent initialized with embedding model {self.embedding_model} (using PLACEHOLDER routing logic).")

    async def determine_route(self, ticket_id: int, ticket_subject: str, ticket_body: str, ticket_priority: str) -> Dict[str, Any]:
        """
        Determines the best route (team or agent) for a ticket.
        --- THIS IS PLACEHOLDER LOGIC ---
        Uses very basic keyword matching on the subject line and assigns defaults.
        """
        log.warning(f"RoutingAgent.determine_route called for ticket {ticket_id} (using PLACEHOLDER implementation).")

        # Simulate processing time
        await asyncio.sleep(random.uniform(0.1, 0.3))

        # --- Start of Placeholder Logic ---

        # Define keywords associated with teams (expand this list)
        team_keywords = {
            "Technical": ["api", "error", "crash", "bug", "install", "boot", "windows", "server", "database", "sync", "compatibility", "certificate", "ssl", "tls", "gateway", "latency"],
            "Billing": ["billing", "invoice", "charge", "payment", "refund", "subscription", "cost", "price"],
            "Network Support": ["wifi", "network", "connect", "internet", "offline", "ping", "latency", "firewall"],
            "Account Support": ["login", "password", "credentials", "account", "username", "profile", "synchronization", "sync"],
        }

        # Default assignment
        assigned_team = "General Support"
        assigned_agent_id = None # Placeholder: Maybe assign based on team later
        reason = "Placeholder routing - default assignment (no keywords matched)"

        lower_subject = ticket_subject.lower() if ticket_subject else ""
        lower_body = ticket_body.lower() if ticket_body else "" # Use body too
        combined_text = lower_subject + " " + lower_body # Check both

        # Find the best matching team based on keyword count (simple approach)
        best_match_count = 0
        for team, keywords in team_keywords.items():
            current_match_count = sum(keyword in combined_text for keyword in keywords)
            if current_match_count > best_match_count:
                best_match_count = current_match_count
                assigned_team = team

        # Refine reason and potentially assign agent based on matched team
        if best_match_count > 0:
             reason = f"Placeholder routing - Assigned to {assigned_team} based on keywords"
             # --- Placeholder Agent Assignment ---
             # Assign specific agents based on team & priority (using sample data IDs)
             if assigned_team == "Technical":
                 # Assign to Bob (ID 2) if High/Urgent?
                 if ticket_priority in ["High", "Urgent"]: assigned_agent_id = 2
             elif assigned_team == "Billing":
                 # Assign to Alice (ID 1) or Diana (ID 4)? Let's alternate for demo
                 assigned_agent_id = 1 if ticket_id % 2 == 0 else 4
             elif assigned_team == "Account Support":
                  # Assign to Charlie (ID 3) if available (check DB in real version)
                  assigned_agent_id = 3 # Placeholder assumes available
             # Network support has no specific agent assigned in this placeholder
             # --- End Placeholder Agent Assignment ---


        # Add priority to reason if agent assigned based on it
        if assigned_agent_id and ticket_priority in ["High", "Urgent"] and assigned_team == "Technical":
             reason += f" (Agent {assigned_agent_id} due to priority)"
        elif assigned_agent_id:
             reason += f" (Agent {assigned_agent_id})"


        # Construct the decision dictionary matching the Pydantic model
        decision = {
            'ticket_id': ticket_id,
            'assigned_team': assigned_team,
            'assigned_agent_id': assigned_agent_id,
            'reason': reason
        }
        # --- End of Placeholder Logic ---

        log.debug(f"Placeholder routing decision for ticket {ticket_id}: {decision}")
        return decision