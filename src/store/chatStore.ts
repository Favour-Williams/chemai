import { create } from 'zustand';
import { ChatStore, ChatConversation } from '../types';

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [
    {
      id: '1',
      title: 'Chemistry Questions',
      lastMessage: 'Welcome to ChemAI! Ask me anything about chemistry.',
      timestamp: new Date(),
      messages: [
        {
          id: '1',
          text: 'Welcome to ChemAI! I\'m here to help you with all your chemistry questions. What would you like to know?',
          sender: 'ai',
          timestamp: new Date(),
          reactions: [],
        }
      ],
    }
  ],
  activeConversation: '1',
  
  setActiveConversation: (id) => set({ activeConversation: id }),
  
  createNewConversation: () => {
    const newConversation: ChatConversation = {
      id: Date.now().toString(),
      title: 'New Chemistry Chat',
      lastMessage: 'New conversation started',
      timestamp: new Date(),
      messages: [
        {
          id: Date.now().toString(),
          text: 'Hello! I\'m your chemistry AI assistant. What would you like to explore today?',
          sender: 'ai',
          timestamp: new Date(),
          reactions: [],
        }
      ],
    };
    
    set((state) => ({
      conversations: [newConversation, ...state.conversations],
      activeConversation: newConversation.id,
    }));
    
    return newConversation.id;
  },
  
  addMessage: (conversationId, message) => set((state) => ({
    conversations: state.conversations.map((conv) =>
      conv.id === conversationId
        ? {
            ...conv,
            lastMessage: message.text,
            timestamp: message.timestamp,
            messages: [...conv.messages, message],
          }
        : conv
    ),
  })),
  
  addReaction: (conversationId, messageId, reaction) => set((state) => ({
    conversations: state.conversations.map((conv) =>
      conv.id === conversationId
        ? {
            ...conv,
            messages: conv.messages.map((msg) =>
              msg.id === messageId
                ? { ...msg, reactions: [...msg.reactions, reaction] }
                : msg
            ),
          }
        : conv
    ),
  })),
  
  deleteMessage: (conversationId, messageId) => set((state) => ({
    conversations: state.conversations.map((conv) =>
      conv.id === conversationId
        ? {
            ...conv,
            messages: conv.messages.filter((msg) => msg.id !== messageId),
          }
        : conv
    ),
  })),
  
  deleteConversation: (conversationId) => set((state) => {
    const filteredConversations = state.conversations.filter((conv) => conv.id !== conversationId);
    const newActiveConversation = state.activeConversation === conversationId 
      ? (filteredConversations.length > 0 ? filteredConversations[0].id : null)
      : state.activeConversation;
    
    return {
      conversations: filteredConversations,
      activeConversation: newActiveConversation,
    };
  }),
  
  exportConversation: (conversationId) => {
    const state = get();
    const conversation = state.conversations.find((c) => c.id === conversationId);
    if (!conversation) return '';
    
    const messages = conversation.messages.map((msg) => ({
      sender: msg.sender,
      text: msg.text,
      timestamp: msg.timestamp.toISOString(),
      reactions: msg.reactions,
    }));
    
    return JSON.stringify({
      title: conversation.title,
      timestamp: conversation.timestamp.toISOString(),
      messages,
    }, null, 2);
  },
}));