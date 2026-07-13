import { useState, useCallback, useRef, useEffect } from 'react';
import type { Message, Conversation } from '../types';
import * as chatService from '../services/chatService';

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isSidebarOpen: boolean;
  hasStartedChat: boolean;
}

export function useChatState() {
  const [state, setState] = useState<ChatState>({
    conversations: [],
    activeConversation: null,
    messages: [],
    isLoading: false,
    isSidebarOpen: false,
    hasStartedChat: false,
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = useCallback(async () => {
    const conversations = await chatService.getConversations();
    setState((prev) => ({ ...prev, conversations }));
  }, []);

  // Load conversation history on mount & listen to updates
  useEffect(() => {
    loadConversations();

    const handleUpdate = () => loadConversations();
    window.addEventListener('lumi-conversation-updated', handleUpdate);
    return () => window.removeEventListener('lumi-conversation-updated', handleUpdate);
  }, [loadConversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.messages]);

  const sendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    let targetConv = state.activeConversation;
    
    // If no active conversation, create one
    if (!targetConv) {
      targetConv = await chatService.createConversation();
      // Instantly load the new conversation into the sidebar list
      loadConversations();
    }

    const conversationId = targetConv.id;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      attachments: attachments?.map((f, i) => ({
        id: `att-${Date.now()}-${i}`,
        name: f.name,
        type: f.type,
        size: f.size
      }))
    };

    // Optimistically update UI
    setState((prev) => {
      const updatedMessages = [...prev.messages, userMessage];
      return {
        ...prev,
        messages: updatedMessages,
        hasStartedChat: true,
        isLoading: true,
        activeConversation: targetConv,
      };
    });

    try {
      const response = await chatService.sendMessage(conversationId, content, attachments);

      setState((prev) => {
        const updatedMessages = [...prev.messages, response];
        return {
          ...prev,
          messages: updatedMessages,
          isLoading: false,
          activeConversation: prev.activeConversation
            ? {
                ...prev.activeConversation,
                messages: updatedMessages,
                updatedAt: new Date(),
              }
            : null,
        };
      });
      // Optionally reload conversations list to update timestamp
      loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.activeConversation, loadConversations]);

  const newChat = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeConversation: null,
      messages: [],
      hasStartedChat: false,
    }));
  }, []);

  const selectConversation = useCallback(async (conversation: Conversation) => {
    // Optimistic UI change to switch quickly
    setState((prev) => ({
      ...prev,
      activeConversation: conversation,
      messages: [],
      isLoading: true, // Loading history...
      hasStartedChat: true,
    }));

    // Fetch full history from backend via service
    const fullConv = await chatService.getConversation(conversation.id);
    
    setState((prev) => ({
      ...prev,
      activeConversation: fullConv || conversation,
      messages: fullConv ? fullConv.messages : [],
      isLoading: false,
      hasStartedChat: (fullConv ? fullConv.messages.length : 0) > 0,
    }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, isSidebarOpen: !prev.isSidebarOpen }));
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    await chatService.deleteConversation(id);
    await loadConversations();
    setState((prev) => ({
      ...prev,
      ...(prev.activeConversation?.id === id
        ? { activeConversation: null, messages: [], hasStartedChat: false }
        : {}),
    }));
  }, [loadConversations]);

  return {
    ...state,
    sendMessage,
    newChat,
    selectConversation,
    toggleSidebar,
    deleteConversation,
    loadConversations,
    messagesEndRef,
  };
}
