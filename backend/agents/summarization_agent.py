# backend/agents/summarization_agent.py

from typing import Dict, List, Tuple
import logging
import asyncio
import re # Import regular expressions for parsing

# Import the real function
from backend.utils.ollama_integration import call_ollama_llm

log = logging.getLogger(__name__)

class SummarizationAgent:
    def __init__(self, llm_model: str = "qwen:1.8b"): # <-- MAKE SURE THIS IS THE MODEL YOU PULLED (e.g., qwen:1.8b, phi3:mini)
        """Initializes the agent."""
        self.llm_model = llm_model
        log.info(f"SummarizationAgent initialized with real LLM model: {self.llm_model}")
        # No Ollama client needed here if utils handles it

    async def summarize_and_extract(self, conversation: str) -> Tuple[str, List[str]]:
        """
        Generates a summary and extracts actions from a conversation using Ollama.
        """
        log.info(f"SummarizationAgent: Processing conversation (length: {len(conversation)}) using model {self.llm_model}")

        # --- 1. Generate Summary ---
        # Use a clear prompt for the LLM
        summary_prompt = f"""
        Concisely summarize the core problem and request described in the following customer support conversation.
        Focus on the essential information needed for another agent to quickly understand the situation.

        Conversation:
        \"\"\"
        {conversation}
        \"\"\"

        Concise Summary:
        """
        log.debug("Generating summary...")
        summary = await call_ollama_llm(prompt=summary_prompt, model=self.llm_model)
        # Basic cleanup (model might add prefixes/newlines)
        summary = summary.replace("Concise Summary:", "").strip()
        # Further cleanup if model tends to add unwanted introductory phrases
        summary = re.sub(r"^(Here's|This is) a concise summary:\s*", "", summary, flags=re.IGNORECASE).strip()
        log.info(f"Summary generated (length: {len(summary)})")


        # --- 2. Extract Actions ---
        # This prompt needs careful crafting and testing with your chosen model
        action_prompt = f"""
        Analyze the following customer support conversation. Identify and list any explicit or strongly implied actionable tasks for the support team.
        Examples: "Escalate to technical team", "Follow-up required by [date/time]", "Refund requested [amount/details]", "Update user profile [details]", "Check logs for error [details]", "No further action needed".
        Present the actions clearly, one per line, prefixed with 'Action:'. If no specific actions are required, state 'Action: No further action needed'.

        Conversation:
        \"\"\"
        {conversation}
        \"\"\"

        Actions:
        """
        log.debug("Extracting actions...")
        action_response = await call_ollama_llm(prompt=action_prompt, model=self.llm_model)

        # --- 3. Parse Actions ---
        # Use regex to find lines starting with "Action:" (case-insensitive)
        actions = []
        # Handle potential variations like "action:", "Action :", etc.
        # Make regex slightly more robust to variations and potential markdown lists
        action_matches = re.findall(r"^\s*(?:Action\s*:|-\s|\*\s)\s*(.*)", action_response, re.IGNORECASE | re.MULTILINE)

        if action_matches:
             for action_text in action_matches:
                 cleaned_action = action_text.strip()
                 # Avoid adding the "no action needed" message as an actual action
                 if cleaned_action and "no further action needed" not in cleaned_action.lower():
                     actions.append(cleaned_action)
        else:
            # Fallback if regex doesn't match expected format but response isn't empty
            cleaned_response = action_response.replace("Actions:", "").strip()
            if cleaned_response and "no further action needed" not in cleaned_response.lower():
                 log.warning(f"Could not parse actions using regex from response: '{action_response}'. Using raw response line(s).")
                 # Add non-empty lines as potential actions (less reliable)
                 actions = [line.strip() for line in cleaned_response.split('\n') if line.strip()]


        # If after parsing, actions list is empty, add a default note
        if not actions:
            # Check if the raw response explicitly said no actions
            if action_response and "no further action needed" in action_response.lower():
                 actions.append("No further action needed")
            else:
                 actions.append("No specific actions identified") # Default if unsure

        log.info(f"Actions extracted: {actions}")
        return summary, actions