from fastapi import APIRouter, HTTPException
from services.llm import get_groq_model
from fastapi.responses import Response
from schemas.models import ChatRequest, SessionArtifacts
from langchain_classic.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from services.history import get_history
from store.session_store import history_store, vector_store, uploaded_files
from langchain_core.messages import get_buffer_string
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from operator import itemgetter

chat_router = APIRouter()

@chat_router.post("/chat")
def start_chat(mssg: ChatRequest, session_id: SessionArtifacts):
    llm = get_groq_model("llama-3.3-70b-versatile")


    prompt = ChatPromptTemplate.from_messages([
        ("system", 
            '''You are a helpful, intelligent conversational assistant. 

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

    db = vector_store.get(session_id.id)
    if db == None:
        chain = RunnablePassthrough.assign(
            context=RunnableLambda(lambda _: "")
        )|prompt|llm
    else:
        retriever = db.as_retriever()
        chain = RunnablePassthrough.assign(
            context=itemgetter("question") | retriever
        )|prompt|llm

    chat_with_history = RunnableWithMessageHistory(runnable=chain, get_session_history= get_history, input_messages_key="question", history_messages_key="history")
    response = chat_with_history.invoke(input= {
        "question": mssg.text,
    },
    config={
        "configurable":{
            "session_id": session_id.id
        }
    })

    return Response(status_code=200, content=response.content)


@chat_router.delete("/delete")
def delete_session_history(session_id: str):
    if session_id in history_store:
        history_store.pop(session_id, None)
        vector_store.pop(session_id, None)
        uploaded_files.pop(session_id, None)
        return Response(status_code=200, content= f"Chat history for {session_id} deleted successfully...")
    else:
        raise HTTPException(status_code=404, detail= f"{session_id} not found!")
    

@chat_router.get("/history")
def get_session_history(session_id: str):
    if session_id in history_store:
        message_history = history_store[session_id]
        res = get_buffer_string(message_history.messages)
        return Response(status_code=200, content= res)
    
    raise HTTPException(status_code=404, detail= f"{session_id} not found...")
        