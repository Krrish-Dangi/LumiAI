from services.llm import get_groq_model
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from datetime import datetime
import sqlite3 as sq
from schemas.models import ChatRequest

def create_convo_metadata(request: ChatRequest):
    sys_message = '''
    You are an AI that generates conversation titles.

    Generate a short descriptive title for the conversation.

    Requirements:
    - 2–5 words
    - No quotation marks
    - No emojis
    - No period
    - Title Case
    - Summarize the user's intent

    Examples

    User:
    Explain Transformers simply

    Output:
    Understanding Transformers

    User:
    Help me build a RAG chatbot

    Output:
    Building a RAG Chatbot

    User:
    Improve my resume

    Output:
    Resume Review

    Return ONLY the title.
    '''

    model = get_groq_model()

    prompt = ChatPromptTemplate.from_messages([
        ("system", sys_message),
        ("user", "{question}")
    ])

    chain = prompt|model

    response = chain.invoke({
        "question": request.text
    })

    with sq.connect("store/lumi.db") as connection:
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON;")
        query = '''
        INSERT INTO conversations VALUES (?, ?, ?, ?, ?);    
        '''

        cursor.execute(query, (request.session_id, request.user_id, datetime.now(), datetime.now(), response.content))
        connection.commit()

def update_metadata(request: ChatRequest):
    with sq.connect("store/lumi.db") as connection:
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON;")
        
        # Check current title
        check_query = "SELECT title FROM conversations WHERE user_id = ? AND session_id = ?"
        title_res = cursor.execute(check_query, (request.user_id, request.session_id)).fetchone()
        
        new_title = None
        if title_res and title_res[0] == "New Chat":
            sys_message = '''
            You are an AI that generates conversation titles.
            Generate a short descriptive title for the conversation.
            Requirements:
            - 2–5 words
            - No quotation marks
            - No emojis
            - No period
            - Title Case
            - Summarize the user's intent
            Return ONLY the title.
            '''
            from services.llm import get_groq_model
            from langchain_core.prompts import ChatPromptTemplate
            model = get_groq_model()
            prompt = ChatPromptTemplate.from_messages([
                ("system", sys_message),
                ("user", "{question}")
            ])
            chain = prompt|model
            try:
                response = chain.invoke({"question": request.text})
                new_title = response.content
            except Exception:
                pass
                
        if new_title:
            query = '''
            UPDATE conversations
            SET updated_at = ?, title = ?
            WHERE user_id = ?
            AND session_id = ?;    
            '''
            cursor.execute(query, (datetime.now(), new_title, request.user_id, request.session_id))
        else:
            query = '''
            UPDATE conversations
            SET updated_at = ?
            WHERE user_id = ?
            AND session_id = ?;    
            '''
            cursor.execute(query, (datetime.now(), request.user_id, request.session_id))
            
        connection.commit()

def get_metadata(session_id: str, user_id: str):
    with sq.connect("store/lumi.db") as connection:
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON;")
        query = '''
        SELECT * FROM conversations
        WHERE user_id = ?
        AND session_id = ?;
        '''

        data = cursor.execute(query, (user_id,session_id)).fetchall()
        if data == []:
            return {}
        
        res = {"created_at": data[0][2], "updated_at": data[0][3], "title": data[0][4]}
        return res

def get_conversations_by_user(user_id: str):
    with sq.connect("store/lumi.db") as connection:
        cursor = connection.cursor()
        query = '''
        SELECT session_id, title, updated_at, created_at FROM conversations
        WHERE user_id = ?
        ORDER BY updated_at DESC;
        '''
        data = cursor.execute(query, (user_id,)).fetchall()
        conversations = []
        for row in data:
            conversations.append({
                "id": row[0],
                "title": row[1],
                "updatedAt": row[2],
                "createdAt": row[3]
            })
        return conversations
