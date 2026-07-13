# Lumi AI - Detailed Project Report

## 1. Project Overview
Lumi AI is a full-stack, local-first intelligent chatbot application. It goes beyond standard conversational interfaces by integrating Retrieval-Augmented Generation (RAG) capabilities, allowing users to upload documents (PDFs) and chat directly with their content. The application boasts a premium, glassmorphic UI, robust session management, and a highly optimized Python backend.

## 2. Architecture & Tech Stack

### Frontend (Client-Side)
- **Framework**: React 18 with TypeScript, built using Vite for lightning-fast HMR and optimized production builds.
- **Styling**: Tailwind CSS combined with Framer Motion. The UI is designed with a modern "glassmorphic" aesthetic, featuring dynamic gradients, smooth micro-animations, and responsive layouts.
- **State Management**: Custom React Hooks (`useChatState`, `useAuth`) ensure clean separation of business logic from UI components.
- **Authentication**: Supabase Auth handles secure user sign-ups and OAuth (Google) logins.
- **Deployment**: Vercel (Serverless Edge CDN).

### Backend (Server-Side)
- **Framework**: FastAPI (Python), chosen for its asynchronous capabilities, automatic Swagger documentation, and high performance.
- **AI Integration**: LangChain orchestrates the LLM chains, memory management, and document processing.
- **Language Model**: Groq API provides ultra-low latency inference, powering both the chat responses and the automatic chat title generation.
- **Embeddings & Vector Database**:
  - Model: `all-MiniLM-L6-v2` (via HuggingFaceEmbeddings) for lightweight, fast text vectorization.
  - Database: ChromaDB acts as the local vector store for document embeddings, enabling RAG.
- **Local Memory**: SQLite tracks user sessions and conversation histories persistently.
- **Deployment**: Railway (Containerized Docker deployment).

---

## 3. Core Features & Capabilities

### 3.1. Intelligent Conversational AI
- Real-time streaming responses with typewriter effects.
- Context-aware memory: The backend retrieves previous messages in the session to maintain conversational continuity.
- Automatic Title Generation: When a new chat starts, an LLM evaluates the first query and instantly generates a concise, relevant title for the sidebar history.

### 3.2. Retrieval-Augmented Generation (RAG)
- Users can seamlessly drag-and-drop or select PDF documents.
- The backend parses the PDF, splits the text into chunks, and generates vector embeddings.
- When the user asks a question, the system queries ChromaDB for the most relevant document chunks and feeds them to the LLM as context, ensuring highly accurate and source-backed answers.

### 3.3. Premium User Interface
- **Dynamic Avatars**: Fetches user profile pictures directly from Google metadata.
- **Lumi Logo**: Custom SVG animations with glow filters for the AI avatar.
- **Responsive Layout**: Collapsible sidebar with mobile-first considerations.
- **Syntax Highlighting**: Code blocks in AI responses are automatically parsed and highlighted using `react-markdown` and `remark-gfm`.

---

## 4. Data Flow & Security

1. **Authentication Flow**: The user logs in via the React frontend. Supabase issues a secure JWT token.
2. **API Requests**: Every request to the FastAPI backend (e.g., `/chat`, `/upload`) includes this JWT token in the `Authorization` header.
3. **Backend Validation**: The FastAPI dependency (`verify_token`) intercepts the request, decodes the JWT using the `SUPABASE_ANON_KEY`, and extracts the `user_id`. If invalid, it blocks the request with a `401 Unauthorized`.
4. **Data Isolation**: All SQLite database queries and ChromaDB collections are partitioned by the `user_id`. A user can never access another user's chat history or uploaded documents.

---

## 5. Deployment Infrastructure

The project utilizes a decoupled deployment strategy to maximize free-tier efficiency and performance:

- **Frontend (Vercel)**: 
  - Automatically builds the React app into static assets (HTML/CSS/JS).
  - Served across a global CDN for instantaneous load times.
- **Backend (Railway)**: 
  - Runs a live Python ASGI server (`uvicorn`) exposing the REST API.
  - Carefully optimized embedding models (`all-MiniLM-L6-v2`) to operate flawlessly within Railway's strict 500MB RAM limit.
  - Connected securely via Vercel environment variables (`VITE_API_URL`), mitigating CORS issues.

## 6. Future Enhancements
- Support for additional document types (.docx, .csv, .txt).
- Web-scraping capabilities to allow the AI to fetch real-time data from URLs.
- Voice-to-text integration for hands-free chatting.
