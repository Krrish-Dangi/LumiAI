# Mini ChatGPT

Mini ChatGPT is a full-stack, local-first AI chatbot application designed for seamless conversations and document-based question answering. It features a modern glassmorphic user interface, robust authentication, and Retrieval-Augmented Generation (RAG) capabilities.

## Capabilities

* Conversational AI: Engages in natural, context-aware conversations powered by Groq LLMs.
* Document Analysis (RAG): Supports PDF uploads, allowing users to ask questions directly related to the contents of the uploaded documents.
* Local Memory: Stores conversation history and metadata locally using SQLite, ensuring context is maintained across sessions.
* Auto-Generated Titles: Automatically generates concise, descriptive titles for new conversations based on the user's initial prompt.
* Authentication: Secure Google OAuth login integration via Supabase.
* Premium UI/UX: Features a highly polished, responsive interface with smooth micro-animations using Framer Motion.

## Project Structure

The project is divided into two main directories: `backend` and `frontend`.

### Backend
Powered by Python, FastAPI, and LangChain.

* `api/`: Contains the FastAPI routers for chat and file upload endpoints.
* `services/`: Core business logic, including LLM integration, database initialization, vector store (ChromaDB) management, and authentication verification.
* `schemas/`: Pydantic models for data validation and request handling.
* `requirements.txt`: Python dependencies required to run the server.

### Frontend
Powered by React, Vite, TypeScript, and TailwindCSS.

* `src/components/`: Reusable UI components including the chat interface, sidebar, and message bubbles.
* `src/hooks/`: Custom React hooks for managing chat state and authentication.
* `src/services/`: API service files for communicating with the FastAPI backend.
* `src/lib/`: Configuration files for external services like Supabase.

## Local Setup Instructions

### Prerequisites
* Python 3.10 or higher
* Node.js (v16 or higher)
* A Supabase project (for Google OAuth and JWT verification)
* A Groq API key

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```

3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the `backend` directory with the following variables:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   JWT_SECRET=your_supabase_jwt_secret_here
   ```

5. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will run on `http://localhost:8000`. The database and vector store will be automatically initialized upon the first run.

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install the required dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `frontend` directory with the following variables:
   ```
   VITE_API_URL=http://localhost:8000
   VITE_SUPABASE_URL=your_supabase_project_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173` by default.

## Deployment Notes
When deploying to production, ensure that:
* The frontend `.env` file is configured with the live backend URL.
* The Supabase dashboard "Site URL" is updated to match your deployed frontend domain.
* The backend is configured to persist the `store/` directory if you wish to retain user conversation history and uploaded documents.
