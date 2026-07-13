import type { Message, Conversation } from '../types';
import { generateId } from '../utils';
import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const STORAGE_KEY = 'lumi_conversations';
const USER_ID_KEY = 'lumi_guest_user_id';

// ─── LocalStorage & SessionStorage Helpers ───

// Gets the active user ID (Supabase must be logged in)
async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    return session.user.id;
  }
  throw new Error("Authentication required");
}

// Gets the Authorization header if logged in
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { 'Authorization': `Bearer ${session.access_token}` };
  }
  return {};
}

async function getStorageKey(): Promise<string> {
  const userId = await getUserId();
  return `lumi_conversations_${userId}`;
}

async function getStoredConversations(): Promise<Conversation[]> {
  let localConvs: Conversation[] = [];
  try {
    const key = await getStorageKey();
    const data = localStorage.getItem(key);
    if (data) {
      localConvs = JSON.parse(data).map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages || []
      })).sort((a: Conversation, b: Conversation) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
  } catch (err) {
    console.error("Failed to parse conversations from localStorage", err);
  }

  try {
    const userId = await getUserId();
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/conversations?user_id=${userId}`, {
      headers: { ...authHeaders }
    });
    
    if (res.ok) {
      const backendConvs = await res.json();
      const merged = backendConvs.map((conv: any) => ({
        id: conv.id,
        title: conv.title,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: localConvs.find(c => c.id === conv.id)?.messages || []
      }));
      await saveStoredConversations(merged);
      return merged;
    }
  } catch (err) {
    // Unauthenticated or network error, fallback to local
  }

  return localConvs;
}

async function saveStoredConversations(conversations: Conversation[]) {
  const key = await getStorageKey();
  localStorage.setItem(key, JSON.stringify(conversations));
}

async function updateConversationTitle(id: string, newTitle: string) {
  const convs = await getStoredConversations();
  const index = convs.findIndex(c => c.id === id);
  if (index !== -1) {
    convs[index].title = newTitle;
    convs[index].updatedAt = new Date();
    await saveStoredConversations(convs);
  }
}

// ─── Service Methods ───

export async function createConversation(): Promise<Conversation> {
  const conversation: Conversation = {
    id: generateId(),
    title: 'New Chat',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const convs = await getStoredConversations();
  await saveStoredConversations([conversation, ...convs]);

  return conversation;
}

export async function getConversations(): Promise<Conversation[]> {
  return await getStoredConversations();
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const convs = await getStoredConversations();
  const conversation = convs.find(c => c.id === id);
  if (!conversation) return null;

  try {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/history?session_id=${id}`, {
      headers: { ...authHeaders }
    });
    
    if (res.ok) {
      const history = await res.json();
      // Map backend JSON to frontend Message type, preserving local attachments if any
      conversation.messages = history.map((msg: {type: string, content: string}, idx: number) => {
        const existing = conversation.messages.find(m => m.content === msg.content && m.role === (msg.type === 'human' ? 'user' : 'assistant'));
        return {
          id: existing ? existing.id : `${id}-msg-${idx}`,
          role: msg.type === 'human' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: existing ? existing.timestamp : new Date(),
          attachments: existing?.attachments
        };
      });
    } else {
      conversation.messages = [];
    }
  } catch (error) {
    console.error("Error fetching history:", error);
  }

  return conversation;
}

export async function sendMessage(
  conversationId: string,
  content: string,
  attachments?: File[]
): Promise<Message> {
  const userId = await getUserId();
  const authHeaders = await getAuthHeaders();
  
  // 1. Upload files first if any
  if (attachments && attachments.length > 0) {
    for (const file of attachments) {
      const formData = new FormData();
      formData.append('session_id', conversationId);
      formData.append('user_id', userId);
      formData.append('file', file);

      try {
        await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: { ...authHeaders },
          body: formData,
        });
      } catch (err) {
        console.error("Failed to upload file:", err);
      }
    }
  }

  // 2. Send the message
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
    body: JSON.stringify({
      text: content,
      session_id: conversationId,
      user_id: userId
    })
  });

  if (!res.ok) {
    throw new Error('Failed to send message');
  }

  const aiContent = await res.text();

  // 3. Check if we should fetch the LLM generated title
  setTimeout(async () => {
    const convs = await getStoredConversations();
    const currentConv = convs.find(c => c.id === conversationId);
    if (currentConv && currentConv.title === 'New Chat') {
      try {
        const metaRes = await fetch(`${API_BASE}/conversation_metadata?session_id=${conversationId}&user_id=${userId}`, {
          headers: { ...authHeaders }
        });
        if (metaRes.ok) {
          const meta = await metaRes.json();
          if (meta.title) {
            await updateConversationTitle(conversationId, meta.title);
            window.dispatchEvent(new Event('lumi-conversation-updated'));
          }
        }
      } catch (e) {
        console.error("Failed to fetch metadata title", e);
      }
    }
  }, 1000);

  return {
    id: generateId(),
    role: 'assistant',
    content: aiContent,
    timestamp: new Date(),
  };
}

export async function deleteConversation(id: string): Promise<void> {
  const authHeaders = await getAuthHeaders();
  
  // Call backend to clear memory/db
  try {
    await fetch(`${API_BASE}/delete?session_id=${id}`, {
      method: 'DELETE',
      headers: { ...authHeaders }
    });
  } catch (error) {
    console.error("Failed to delete backend session", error);
  }

  // Remove from localStorage
  const convs = await getStoredConversations();
  const filtered = convs.filter(c => c.id !== id);
  await saveStoredConversations(filtered);
}
