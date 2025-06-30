export interface NavItem {
  label: string;
  href: string;
  onClick?: () => void;
}

export interface FeatureCard {
  title: string;
  description: string;
  icon: string;
}

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
}

export interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'login' | 'register';
  onToggleType: (newType: 'login' | 'register') => void;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  reactions: string[];
}

export interface ChatConversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: ChatMessage[];
}

export interface ChatStore {
  conversations: ChatConversation[];
  activeConversation: string | null;
  setActiveConversation: (id: string) => void;
  createNewConversation: () => string;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  addReaction: (conversationId: string, messageId: string, reaction: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  deleteConversation: (conversationId: string) => void; 
  exportConversation: (conversationId: string) => string;
}