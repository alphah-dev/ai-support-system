# backend/utils/ollama_integration.py

import ollama
import logging
import time
import random
from typing import List, Dict, Any, Optional
import numpy as np # Import numpy
import json # Import json for embedding serialization

log = logging.getLogger(__name__)

# Configure Ollama client - assumes Ollama is running on http://localhost:11434
# You can specify a different host if needed, e.g., client = ollama.Client(host='http://192.168.1.100:11434')
try:
    # Check connection on initialization
    client = ollama.Client()
    client.list() # Simple check to see if server is reachable
    log.info("Ollama client initialized and server connection verified.")
except Exception as e:
    log.error(f"Failed to initialize Ollama client or connect to server: {e}. Please ensure Ollama server is running.", exc_info=True)
    # Depending on requirements, you might want to raise an error here or handle it gracefully later
    client = None # Set client to None if initialization fails


# --- Real Ollama Interaction Functions ---

async def call_ollama_llm(prompt: str, model: str = "llama3:instruct", context: str = "", role: str = "user") -> str:
    """
    Calls a specified Ollama LLM for chat-based generation tasks.

    Args:
        prompt: The main instruction or question for the LLM.
        model: The Ollama model name (e.g., 'llama3:instruct', 'mistral').
        context: Optional preceding context or conversation history.
        role: The role for the current prompt (usually 'user').

    Returns:
        The content of the LLM's response message, or an error string on failure.
    """
    if client is None:
        log.error("Ollama client is not available. Cannot call LLM.")
        return "[Error: Ollama client not initialized]"

    log.info(f"Calling Ollama LLM (Model: {model})")
    log.debug(f"Prompt: {prompt[:150]}...") # Log start of prompt

    messages = []
    if context:
        # Simple context handling: assume context is previous assistant response or system message
        messages.append({'role': 'system', 'content': context}) # Or determine role based on context source
    messages.append({'role': role, 'content': prompt})

    try:
        start_time = time.time()
        # Use ollama.chat for conversational models
        response = client.chat(model=model, messages=messages)
        duration = time.time() - start_time
        log.info(f"Ollama call successful (Duration: {duration:.2f}s)")

        # Extract the actual text content from the response
        if response and 'message' in response and 'content' in response['message']:
            response_content = response['message']['content']
            log.debug(f"Ollama Response: {response_content[:150]}...")
            return response_content.strip()
        else:
            log.warning(f"Ollama response format unexpected: {response}")
            return "[Error: Unexpected response format]"

    except ollama.ResponseError as e:
        log.error(f"Ollama API Response Error: {e.status_code} - {e.error}")
        # Handle specific errors (e.g., model not found)
        if hasattr(e, 'error') and isinstance(e.error, str) and "model not found" in e.error.lower():
             log.error(f"Model '{model}' not found. Pull it using 'ollama pull {model}'")
             return f"[Error: Model '{model}' not found on Ollama server]"
        return f"[Error: Ollama API error - {e.status_code}]"
    except Exception as e:
        log.error(f"An unexpected error occurred during Ollama LLM call: {e}", exc_info=True)
        return "[Error: Failed to communicate with Ollama]"


async def get_ollama_embeddings(text: str, model: str = "nomic-embed-text") -> Optional[List[float]]:
    """
    Gets text embeddings from a specified Ollama embedding model.

    Args:
        text: The input text to embed.
        model: The Ollama embedding model name (e.g., 'nomic-embed-text', 'nomic-embed-text'). Make sure it's pulled.

    Returns:
        A list of floats representing the embedding, or None on error.
    """
    if client is None:
        log.error("Ollama client is not available. Cannot get embeddings.")
        return None

    log.info(f"Getting Ollama Embeddings (Model: {model})")
    log.debug(f"Text to embed: {text[:100]}...")

    # Ensure the embedding model is pulled (or handle error)
    try:
        # Use show to check - less overhead than list if checking one model
        client.show(model)
        log.debug(f"Embedding model '{model}' found locally.")
    except ollama.ResponseError as e:
         if hasattr(e, 'error') and isinstance(e.error, str) and "model not found" in str(e.error).lower():
              log.error(f"Embedding model '{model}' not found locally. Please pull it using 'ollama pull {model}'")
         else:
              log.error(f"Ollama error checking embedding model '{model}': {getattr(e, 'error', 'Unknown error')}")
         return None # Cannot proceed if model isn't available

    try:
        start_time = time.time()
        response = client.embeddings(model=model, prompt=text)
        duration = time.time() - start_time

        if response and 'embedding' in response:
            embedding = response['embedding']
            log.info(f"Ollama embeddings received (Size: {len(embedding)}, Duration: {duration:.2f}s)")
            return embedding
        else:
            log.warning(f"Ollama embedding response format unexpected: {response}")
            return None

    except ollama.ResponseError as e:
        log.error(f"Ollama API Response Error during embedding: {e.status_code} - {e.error}")
        return None
    except Exception as e:
        log.error(f"An unexpected error occurred during Ollama embedding call: {e}", exc_info=True)
        return None

# --- Helper function for recommendation agent ---
def calculate_similarity(embedding1: Optional[List[float]], embedding2: Optional[List[float]]) -> float:
    """ Calculates cosine similarity between two embeddings (vectors) using NumPy. """
    if embedding1 is None or embedding2 is None:
        log.debug("Cannot calculate similarity: One or both embeddings are None.")
        return 0.0

    # Convert lists to numpy arrays
    try:
        vec1 = np.array(embedding1, dtype=np.float32)
        vec2 = np.array(embedding2, dtype=np.float32)
    except ValueError as e:
         log.error(f"Could not convert embeddings to numpy arrays: {e}")
         return 0.0


    if vec1.shape != vec2.shape or vec1.ndim != 1:
         log.warning(f"Cannot calculate similarity: Embedding shapes mismatch or not 1D. Shape1: {vec1.shape}, Shape2: {vec2.shape}")
         return 0.0

    # Calculate cosine similarity
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)

    if norm1 == 0 or norm2 == 0:
        log.debug("Cannot calculate similarity: One or both vectors have zero norm.")
        return 0.0

    # Use np.dot for dot product
    similarity = np.dot(vec1, vec2) / (norm1 * norm2)

    # Clip similarity to handle potential floating point inaccuracies slightly outside [-1, 1]
    return float(np.clip(similarity, -1.0, 1.0))

# --- Functions for storing/retrieving embeddings in SQLite BLOB ---
def serialize_embedding(embedding: Optional[List[float]]) -> Optional[bytes]:
    """Serializes a list of floats (embedding) into bytes for DB storage."""
    if embedding is None:
        return None
    # Use JSON for simplicity, though numpy.save/tobytes might be more efficient
    try:
        return json.dumps(embedding).encode('utf-8')
    except (TypeError, OverflowError) as e:
         log.error(f"Failed to serialize embedding: {e}")
         return None

def deserialize_embedding(blob: Optional[bytes]) -> Optional[List[float]]:
    """Deserializes bytes (from DB BLOB) back into a list of floats."""
    if blob is None:
        return None
    try:
        embedding_list = json.loads(blob.decode('utf-8'))
        # Basic validation: ensure it's a list of numbers (floats or ints)
        if isinstance(embedding_list, list) and all(isinstance(x, (int, float)) for x in embedding_list):
            return embedding_list
        else:
            log.warning("Deserialized blob is not a list of numbers.")
            return None
    except (json.JSONDecodeError, UnicodeDecodeError, TypeError) as e:
        log.error(f"Failed to deserialize embedding blob: {e}")
        return None