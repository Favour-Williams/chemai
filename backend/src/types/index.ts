export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    primaryColor: string;
    fontSize: string;
    notifications: {
      email: boolean;
      push: boolean;
      reactions: boolean;
      updates: boolean;
      marketing: boolean;
    };
  };
  isActive: boolean;
  lastLogin?: string;
}

export interface Element {
  symbol: string;
  name: string;
  atomicNumber: number;
  atomicMass: number;
  category: string;
  color: string;
  electronConfiguration: string;
  meltingPoint: number;
  boilingPoint: number;
  density: number;
  uses: string[];
  safetyInfo: string;
  discoveredBy: string;
  discoveryYear: number;
  group?: number;
  period: number;
  block: string;
  oxidationStates: number[];
  electronegativity?: number;
  ionizationEnergy: number;
  atomicRadius?: number;
  crystalStructure?: string;
}

export interface Reaction {
  id: string;
  name: string;
  equation: string;
  reactants: string[];
  products: string[];
  reactionType: 'synthesis' | 'decomposition' | 'single-replacement' | 'double-replacement' | 'combustion' | 'acid-base' | 'redox';
  energyChange: number; // kJ/mol
  temperature?: number; // Kelvin
  pressure?: number; // atm
  catalyst?: string;
  safetyWarnings: string[];
  description: string;
  mechanism?: string;
  yieldPercentage?: number;
  createdBy?: string;
  createdAt: string;
  isPublic: boolean;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  response: string;
  timestamp: string;
  context?: {
    element?: string;
    reaction?: string;
    topic?: string;
  };
  rating?: number;
}

export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface SafetyData {
  elementSymbol: string;
  hazardLevel: 'low' | 'medium' | 'high' | 'extreme';
  hazardTypes: string[];
  precautions: string[];
  firstAid: {
    inhalation?: string;
    skinContact?: string;
    eyeContact?: string;
    ingestion?: string;
  };
  storage: string;
  disposal: string;
  incompatibleWith: string[];
  emergencyProcedures: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface DatabaseCollections {
  users: User[];
  elements: Element[];
  reactions: Reaction[];
  chatHistory: ChatConversation[];
  safetyData: SafetyData[];
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}