<p align="center">
    <img src="assets/banner" alt="LumiAI Banner" width="100%">
</p>


## LumiAI

> A full-stack AI assistant with conversational memory, Retrieval-Augmented Generation (RAG), PDF understanding, and secure Google authentication.

Built using:
<p align="center">
  <img src="https://skillicons.dev/icons?i=python,fastapi,react,typescript,vite,tailwind,supabase,sqlite&theme=light" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/LangChain-121212?style=for-the-badge&logo=chainlink&logoColor=white" />
  <img src="https://img.shields.io/badge/ChromaDB-7B3FE4?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white" />
  <img src="https://img.shields.io/badge/Framer_Motion-000000?style=for-the-badge&logo=framer&logoColor=white" />
  <img src="https://img.shields.io/badge/LangChain-RAG-0A66C2?style=for-the-badge" />
</p>


<p align="center">
    <img src="assets/features" alt="LumiAI Features" width="100%">
</p>


# Architecture

<p align="center">
    <img src="assets/architecture" alt="Architecture Diagram" width="900">
</p>


# System Workflow

```text
                    User
                      │
                      ▼
            React + TypeScript Frontend
                      │
          HTTP Requests + JWT Authentication
                      │
                      ▼
               FastAPI Backend
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
   Chat Request               PDF Upload
        │                           │
        │                    Create Embeddings
        │                           │
        │                           ▼
        │                      ChromaDB
        │                           │
        └─────────────┬─────────────┘
                      ▼
              LangChain Pipeline
                      │
          Retrieval + Prompt Building
                      │
                      ▼
             Groq (Llama 3.3 70B)
                      │
                      ▼
               Generated Response
                      │
                      ▼
              React Frontend
```

# Project Structure

```text
LumiAI
│
├── backend
│   ├── api
│   ├── schemas
│   ├── services
│   ├── store
│   ├── requirements.txt
│   └── main.py
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── hooks
│   │   ├── services
│   │   ├── lib
│   │   └── pages
│   │
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

# Screenshots

## Home

<img src="assets/home" width="100%">

---

## Chat Interface

<img src="assets/chat" width="100%">

---

## PDF Upload

<img src="assets/pdf_upload" width="100%">


# Local Setup

## Prerequisites

- Python 3.10+
- Node.js 16+
- Groq API Key
- Supabase Project


## Backend

```bash
cd backend
```

Create a virtual environment.

```bash
python -m venv venv
```

Windows

```bash
venv\Scripts\activate
```

Linux / macOS

```bash
source venv/bin/activate
```

Install dependencies.

```bash
pip install -r requirements.txt
```

Create a `.env` file.

```env
GROQ_API_KEY=YOUR_GROQ_API_KEY
JWT_SECRET=YOUR_SUPABASE_JWT_SECRET
```

Run the server.

```bash
uvicorn main:app --reload
```

Backend runs on

```
http://localhost:8000
```

---

## Frontend

```bash
cd frontend
```

Install dependencies.

```bash
npm install
```

Create a `.env` file.

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Run

```bash
npm run dev
```

Frontend

```
http://localhost:5173
```

---

# Deployment

Before deploying:

- Configure the frontend with the production backend URL.
- Update the Supabase Site URL.
- Persist the backend `store/` directory if conversation history should survive deployments.


# Engineering Challenges

Some of the key challenges solved while building LumiAI:

- Session-specific conversation management.
- Persistent local chat history.
- Retrieval-Augmented Generation (RAG) pipeline.
- Authentication synchronization between React and FastAPI.
- Efficient document embedding and retrieval using ChromaDB.
- Modular backend architecture for scalability.


# Future Improvements

- Voice conversations
- Streaming AI responses
- Multi-document retrieval
- Image understanding
- Agent tool integration
- Cloud synchronization
- User-selectable LLM providers

----

# Author

**Krrish Kumar Dangi**

If you found this project interesting, consider giving it a ⭐ on GitHub.
