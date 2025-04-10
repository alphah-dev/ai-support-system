# AI-Powered Customer Support System

This project implements an AI-augmented customer support system designed to streamline agent workflows by leveraging local Large Language Models (LLMs) and Embedding Models via Ollama. It features automatic ticket summarization, action extraction, resolution recommendation, and user authentication, presented through a modern web interface.

## Overview

Customer support agents often face repetitive and time-consuming tasks like summarizing complex tickets, finding relevant historical solutions, and routing issues correctly. This system aims to alleviate these pain points by integrating specialized AI agents directly into the support process.

**Key Features:**

*   **AI Summarization:** Automatically generates concise summaries of customer issues upon ticket creation.
*   **AI Action Extraction:** Suggests initial troubleshooting steps or questions for the agent based on the ticket content.
*   **AI Recommendation Engine:** Provides relevant solutions or knowledge base articles based on semantic similarity to the current ticket, using vector embeddings.
*   **User Authentication:** Secure login and registration using JWT (JSON Web Tokens).
*   **Ticket Management UI:** Interface for viewing ticket lists, details, and creating new tickets.
*   **Dashboard:** Overview of support metrics (partially mock currently) and recent tickets.
*   **Dark/Light Mode:** User preference saved in local storage.
*   **Local AI Focus:** Utilizes Ollama to run LLMs and embedding models locally or on-premise, offering potential benefits in data privacy, customization, and cost.
*   **(Placeholder) Intelligent Routing:** Framework in place for future implementation of intelligent ticket assignment based on content, skills, and workload.
*   **(Placeholder) Resolution Time Estimation:** Framework in place for future ML-based prediction of ticket resolution times.


## Technology Stack

**Backend:**

*   **Language:** Python 3.10+
*   **Framework:** FastAPI
*   **Server:** Uvicorn
*   **AI Integration:** Ollama + `ollama` Python client
*   **AI Models:**
    *   LLM: `qwen:1.8b` / `phi3:mini` (or other, for summarization/actions)
    *   Embedding: `nomic-embed-text` / `mxbai-embed-large` (or other, for recommendations)
*   **Database:** SQLite 3
*   **Authentication:** Passlib[bcrypt] (hashing), python-jose[cryptography] (JWT)
*   **Other Libraries:** Pydantic, python-dotenv, python-multipart, NumPy

**Frontend:**

*   **Framework/Library:** React (using Vite)
*   **UI Components:** Material UI (MUI) v5+
*   **Routing:** React Router v6+
*   **API Client:** Axios
*   **Charting:** Chart.js, react-chartjs-2
*   **Styling:** Emotion (via MUI), sx prop

**Development:**

*   **Environment:** WSL2 / Windows PowerShell / Linux Terminal
*   **Version Control:** Git / GitHub

## Project Structure
Use code with caution.
Markdown
/ai-support-system
├── backend/
│ ├── .env # Environment variables (SECRET_KEY, etc.) - NOT COMMITTED
│ ├── .venv/ # Python Virtual Environment - NOT COMMITTED
│ ├── agents/ # AI Agent logic classes
│ ├── apis/ # FastAPI endpoint definitions (routers)
│ ├── data/ # Source data files (e.g., CSV, TXT transcripts)
│ ├── database/ # Database related files (schema, manager, db file)
│ ├── scripts/ # Utility scripts (user creation, KB population, etc.)
│ ├── utils/ # Shared utility functions (Ollama integration, etc.)
│ ├── main.py # FastAPI app entry point
│ └── requirements.txt # Python dependencies
│ └── Procfile # For Render deployment
├── frontend/
│ ├── node_modules/ # Node.js dependencies - NOT COMMITTED
│ ├── public/ # Static assets (favicon, background images)
│ ├── src/
│ │ ├── components/ # Reusable UI components
│ │ ├── context/ # React Context providers (AuthContext)
│ │ ├── pages/ # Page-level components
│ │ ├── services/ # API client setup (api.js)
│ │ ├── App.jsx # Main app component with routing (React Router)
│ │ ├── main.jsx # Vite entry point
│ │ └── theme.js # Material UI theme configuration
│ ├── .gitignore
│ ├── index.html # Vite HTML entry point
│ ├── package.json
│ └── vite.config.js # Vite build/dev server configuration
├── .gitignore # Main project git ignores
└── README.md # This file
## Setup and Installation

**Prerequisites:**

*   Git
*   Python 3.10+ and Pip
*   Node.js (includes npm) LTS version (e.g., v18 or v20)
*   Ollama installed and running ([ollama.com](https://ollama.com/))
*   Required Ollama Models Pulled (run these in your terminal):
    ```bash
    ollama pull qwen:1.8b # Or your chosen LLM (e.g., phi3:mini)
    ollama pull nomic-embed-text # Or your chosen embedding model (e.g., mxbai-embed-large)
    ```

**Backend Setup (WSL Recommended):**

1.  **Clone Repository:**
    ```bash
    git clone https://github.com/alphah-dev/ai-support-system.git
    cd ai-support-system
    ```
2.  **Navigate to Backend:**
    ```bash
    cd backend
    ```
3.  **Create & Activate Virtual Environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate # For Linux/WSL/macOS bash/zsh
    # .\venv\Scripts\activate # For Windows PowerShell/CMD
    ```
4.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
5.  **Configure Environment:**
    *   Copy `.env.example` to `.env` (if you create an example file).
    *   Edit `.env` and set a strong `SECRET_KEY`. Generate one using:
        ```bash
        python -c 'import secrets; print(secrets.token_hex(32))'
        ```
    *   *(Optional)* Set `OLLAMA_HOST_URL` if Ollama runs elsewhere.
6.  **Initialize Database & Populate Data:**
    *   *(Optional)* Delete `database/support_system.db` for a fresh start.
    *   Run population scripts (ensure venv is active):
        ```bash
        python -m database.sample_data
        python -m scripts.populate_kb_from_transcripts # Or _from_csv if using that
        python -m scripts.generate_kb_embeddings # Requires Ollama running!
        ```
7.  **Create Initial User:**
    ```bash
    python -m scripts.create_initial_user
    ```
    *   Follow prompts to set username and password.

**Frontend Setup (Windows PowerShell or WSL):**

1.  **Navigate to Frontend:**
    ```bash
    # From project root:
    cd frontend
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    # OR yarn install
    ```
3.  **(Optional) Environment Variables:** Create a `.env` file in the `frontend` directory if you need to override the default backend URL (e.g., for deployment):
    ```dotenv
    # frontend/.env
    VITE_API_BASE_URL=http://your-backend-url.com
    ```

## Running the Application

1.  **Start Ollama:** Ensure the Ollama application/service is running. If running manually:
    ```bash
    # In a dedicated WSL terminal
    ollama serve
    ```
2.  **Start Backend Server:**
    ```bash
    # In project root (ai-support-system) directory
    # Activate backend venv first: source backend/venv/bin/activate
    PYTHONPATH=. uvicorn backend.main:app --reload --port 8000 --app-dir backend --host 0.0.0.0
    ```
    *   Access API docs at `http://localhost:8000/docs`.
3.  **Start Frontend Server:**
    ```bash
    # In frontend directory
    npm run dev
    # OR yarn dev
    ```
    *   Access the frontend UI at `http://localhost:5173` (or the port specified by Vite).

## Deployment (Example: Render + Netlify)

*(Brief outline - detailed steps in Responses 42-44)*

1.  **Backend (Render):**
    *   Connect Render to your GitHub repository.
    *   Create a new "Web Service".
    *   Set Build Command: `pip install -r backend/requirements.txt` (adjust path if needed).
    *   Set Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` (or use `Procfile`).
    *   Add Environment Variables: `SECRET_KEY`, `PYTHON_VERSION`, `DEPLOYMENT_MODE=render` (to use mock AI if not connecting to external Ollama).
    *   Deploy. Note the public service URL.
    *   *(Note: Free tier has ephemeral filesystem - SQLite DB will reset. Requires PostgreSQL addon or external DB for persistence. Cannot run Ollama on free tier).*
2.  **Frontend (Netlify):**
    *   Connect Netlify to your GitHub repository.
    *   Configure Build Settings:
        *   Build Command: `npm run build` (or `yarn build`)
        *   Publish Directory: `frontend/dist`
    *   Add Environment Variable: `VITE_API_BASE_URL` = *Your Render backend service URL*.
    *   Ensure `frontend/public/_redirects` file exists with `/* /index.html 200`.
    *   Deploy.

## Future Work & Improvements

*   Implement real **Routing Agent** logic (embeddings, skills, availability).
*   Train and implement real **Prediction Agent** ML model.
*   Add backend endpoint and connect **Dashboard metrics** to real data.
*   Implement **Tickets Overview table** on Dashboard.
*   Implement **Search, Priority filtering, Sorting** on Ticket list page (requires backend API changes).
*   Implement **"Send Response / Save Note"** functionality (requires new backend endpoint and DB table).
*   Implement **Real-time Notifications** (WebSockets).
*   Add comprehensive **Unit and Integration Tests**.
*   Enhance **Error Handling** and User Feedback.
*   **Refactor** utils and helper functions.
*   Consider migrating database from SQLite to **PostgreSQL** for production/persistence on Render.
*   Explore strategies for hosting/accessing **Ollama in a deployed environment** (dedicated VM, specialized hosting, or switching to cloud AI APIs).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
