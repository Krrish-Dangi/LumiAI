from fastapi import APIRouter, HTTPException, Depends
from services.llm import get_groq_model
from fastapi.responses import Response, JSONResponse
from schemas.models import ChatRequest
from langchain_classic.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from services.history import get_history, load_history, add_history
from services.metadata import create_convo_metadata, update_metadata, get_metadata
from langchain_core.runnables import RunnablePassthrough
from operator import itemgetter
from langchain_chroma import Chroma
from services.embedding import get_embedding_model
from services.auth import verify_user, validate_access
import sqlite3 as sq

chat_router = APIRouter()

def get_user_id_for_session(session_id: str) -> str:
    with sq.connect("store/lumi.db") as conn:
        cursor = conn.cursor()
        res = cursor.execute("SELECT user_id FROM conversations WHERE session_id = ?", (session_id,)).fetchone()
        if res:
            return res[0]
        return None

@chat_router.post("/chat")
def start_chat(request: ChatRequest, token_user_id: str | None = Depends(verify_user)):
    validate_access(request.user_id, token_user_id)
    with sq.connect("store/lumi.db") as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA foreign_keys = ON;")
        query = '''
        SELECT 1
        FROM conversations
        WHERE session_id = ?
        AND user_id = ?;
        '''

        flag = cursor.execute(query, (request.session_id, request.user_id)).fetchone()

        if flag is None:
            create_convo_metadata(request)
        else:
            update_metadata(request)

    llm = get_groq_model()

    prompt = ChatPromptTemplate.from_messages([
        ("system", 
            '''Your name is Lumi and you are a helpful, intelligent conversational assistant. 

            Your goal is to answer the user's questions naturally while seamlessly utilizing both our past conversation history and any provided external documents.

            ### Operating Rules:

            1. Prioritize Provided Context (RAG): If relevant external documents or search results are provided, use them as your primary source of truth to answer the user's question. 
            2. Utilize Chat History: Always consider the conversational history to understand the user's intent, resolve pronouns (e.g., "what did you mean by that?"), and maintain a natural dialogue.
            3. Be Honest About Sources: If the user asks a specific question about the provided context and the answer is not there, explicitly state, "I don't see that information in the provided documents." 
            4. Fallback to General Knowledge: If the provided documents do not contain the answer, or if no documents are provided, you may rely on your general training data to answer the question. If you do this, make it clear that you are drawing from general knowledge rather than the retrieved files.
            5. Do Not Hallucinate: Never invent facts, data, or quotes that are not supported by the context or your established knowledge base. Keep your tone friendly, concise, and direct.'''
        ),
        ("system", "Context of user uploaded document:\n\n {context}"),
        MessagesPlaceholder(variable_name="history"),
        ("user", "{question}")
    ])

    embedder = get_embedding_model()
    db = Chroma(persist_directory="store/vector_db", embedding_function=embedder, collection_name= request.session_id)
    retriever = db.as_retriever()
    chain = RunnablePassthrough.assign(
        context=itemgetter("question") | retriever
    )|prompt|llm

    chat_with_history = RunnableWithMessageHistory(runnable=chain, get_session_history= load_history, input_messages_key="question", history_messages_key="history")
    response = chat_with_history.invoke(input= {
        "question": request.text,
    },
    config={
        "configurable":{
            "session_id": request.session_id
        }
    })

    add_history(request.session_id, request.text, response.content)

    return Response(status_code=200, content=response.content)


@chat_router.delete("/delete")
def delete_session_history(session_id: str, token_user_id: str | None = Depends(verify_user)):
    db_user_id = get_user_id_for_session(session_id)
    if not db_user_id:
        raise HTTPException(status_code=404, detail=f"{session_id} not found!")
    
    validate_access(db_user_id, token_user_id)

    with sq.connect("store/lumi.db") as connection:
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON;")
        
        query = '''
        DELETE FROM conversations WHERE session_id = ?;
        '''
        
        cursor.execute(query, (session_id,))
        
        try:
            embedder = get_embedding_model()
            db = Chroma(persist_directory="store/vector_db", embedding_function=embedder, collection_name= session_id)
            db.delete_collection()
        except Exception as e:
            raise Exception(e)
        
        connection.commit()
        return Response(status_code=200, content= f"Chat history for {session_id} deleted successfully...")
    

@chat_router.get("/history")
def get_session_history(session_id: str, token_user_id: str | None = Depends(verify_user)):
    db_user_id = get_user_id_for_session(session_id)
    if not db_user_id:
        raise HTTPException(status_code=404, detail=f"{session_id} not found...")
        
    validate_access(db_user_id, token_user_id)

    with sq.connect("store/lumi.db") as connection:
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON;")

        query = '''
        SELECT 1
        FROM messages
        WHERE session_id = ?;
        '''
        flag = cursor.execute(query, (session_id,)).fetchone()

    if flag is not None:
        res = get_history(session_id=session_id)
        return JSONResponse(status_code=200, content= res)
    
    # If no messages yet, return empty list instead of 404
    return JSONResponse(status_code=200, content=[])

@chat_router.get("/conversation_metadata")
def metadata(session_id: str, user_id: str, token_user_id: str | None = Depends(verify_user)):
    validate_access(user_id, token_user_id)
    
    res = get_metadata(session_id=session_id, user_id= user_id)
    if res != {}:
        return JSONResponse(status_code=200, content=res)
    
    raise HTTPException(status_code=404, detail= f"{session_id} not found...")

@chat_router.get("/conversations")
def get_user_conversations(user_id: str, token_user_id: str | None = Depends(verify_user)):
    validate_access(user_id, token_user_id)
    from services.metadata import get_conversations_by_user
    conversations = get_conversations_by_user(user_id)
    return JSONResponse(status_code=200, content=conversations)