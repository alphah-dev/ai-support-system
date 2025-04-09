# backend/agents/summarization_agent.py

from typing import Dict, List, Tuple
import logging
import asyncio
import re # Import regular expressions for parsing

# Import the real Ollama call function
from backend.utils.ollama_integration import call_ollama_llm

log = logging.getLogger(__name__)

class SummarizationAgent:
    # --- Using qwen:1.8b - If results poor, switch to phi3:mini ---
    def __init__(self, llm_model: str = "qwen:1.8b"):
        """Initializes the agent with the specified LLM model."""
        self.llm_model = llm_model
        log.info(f"SummarizationAgent initialized with real LLM model: {self.llm_model}")

    async def summarize_and_extract(self, conversation: str) -> Tuple[str, List[str]]:
        """
        Generates a concise summary of the customer's problem and extracts
        a list of initial troubleshooting checks/questions for the support agent.
        """
        log.info(f"SummarizationAgent: Processing conversation (length: {len(conversation)}) using model {self.llm_model}")

        if not conversation or not conversation.strip():
            log.warning("Summarization attempt on empty conversation text.")
            return "Conversation text was empty.", ["No actions required."]

        # --- 1. Generate Summary (Keep Improved Prompt) ---
        summary_prompt = f"""
        Analyze the following customer support conversation.
        Provide a very concise, one or two sentence summary of the CUSTOMER'S main problem or question ONLY.
        Focus ONLY on what the customer reported. DO NOT include agent actions or solutions.

        Conversation:
        \"\"\"
        {conversation}
        \"\"\"

        Concise Customer Problem Summary:
        """
        log.debug("Generating summary...")
        summary = await call_ollama_llm(prompt=summary_prompt, model=self.llm_model)
        # Cleanup
        summary = summary.split("Concise Customer Problem Summary:")[-1].strip()
        summary = re.sub(r"^(Here's|The customer's problem is|Summary:)\s*", "", summary, flags=re.IGNORECASE).strip()
        if not summary or summary.startswith("[Error:"):
             log.warning(f"Summary generation failed or returned error: {summary}")
             summary = "[AI summary generation failed]"
        log.info(f"Summary generated: '{summary[:100]}...'")


        # --- 2. Extract Agent Troubleshooting Steps/Checks (Revised Prompt for 4-6 Steps) ---
        # Ask for a slightly smaller number of items (4-6)
        action_prompt = f"""
        Analyze the customer's problem described below. List 4-6 distinct, concise troubleshooting questions the SUPPORT AGENT should ask or checks the AGENT should perform initially.
        Focus on gathering key information or common first steps for the described issue.
        Format as a bulleted list (using '*'). Each point should be a short question or check.

        Examples for various issues:
        * Ask for the specific error code/message.
        * When did the issue start? After any updates/changes?
        * What are the steps to reproduce the problem?
        * Which operating system/device/browser is used?
        * Ask user to restart the device/router.
        * Check user's subscription/account status.
        * Verify payment method details.
        * Check server logs for related errors around [time].
        * Ask for a screenshot of the problem area.

        If the problem is too vague, list actions like '* Ask for specific error messages displayed.' and '* Ask for steps to reproduce the issue.'

        DO NOT write a long paragraph. List only short bullet points for the AGENT.

        Conversation:
        \"\"\"
        {conversation}
        \"\"\"

        Agent's Initial Troubleshooting Steps/Questions:
        """
        log.debug("Extracting agent troubleshooting steps (requesting 4-6)...") # Log update
        action_response = await call_ollama_llm(prompt=action_prompt, model=self.llm_model)

        # --- 3. Parse Actions (Keep Improved Parsing for Bullets) ---
        actions = []
        # Get text after the explicit prompt header
        cleaned_response = action_response.split("Agent's Initial Troubleshooting Steps/Questions:")[-1]

        # Look for lines starting with '*' or '-'
        action_matches = re.findall(r"^\s*[\*\-]\s+(.*)", cleaned_response, re.MULTILINE)

        if action_matches:
             for action_text in action_matches:
                 cleaned_action = action_text.strip()
                 # Add if it's not empty and not just a generic filler (unless it's the *only* thing)
                 if cleaned_action and "no further action needed" not in cleaned_action.lower() and "ask for more specific details" not in cleaned_action.lower():
                     # Optional: Simple de-duplication
                     if cleaned_action not in actions:
                          actions.append(cleaned_action)
        else:
            # Fallback if no bullet points found
            fallback_text = cleaned_response.strip()
            # Check fallback isn't an error or generic filler
            if fallback_text and not fallback_text.startswith("[Error:") and "ask for more specific details" not in fallback_text.lower() and "no further action needed" not in fallback_text.lower():
                 log.warning(f"Could not parse bulleted actions from response: '{action_response}'. Using non-empty lines as fallback.")
                 actions = [line.strip() for line in fallback_text.split('\n') if line.strip() and line.strip() not in actions] # Add unique lines

        # Ensure a default message if list is still empty after parsing
        if not actions:
            if action_response and action_response.startswith("[Error:"):
                 actions.append("[AI action extraction failed]")
            else:
                 # If the model didn't provide specific steps, default to asking for details
                 actions.append("Ask customer for more specific details about the issue.")

        log.info(f"Extracted agent steps/checks ({len(actions)}): {actions}")
        return summary, actions