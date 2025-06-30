import { supabase } from '../lib/supabase';
import { createLLMService, LLMService } from './llmService';

interface ChatResponse {
  response: string;
  confidence: number;
  source: 'llm' | 'fallback';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface ChatContext {
  element?: string;
  reaction?: string;
  topic?: string;
}

class ChatService {
  private cache = new Map<string, ChatResponse>();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  private llmService: LLMService | null;
  private conversationHistory = new Map<string, Array<{role: 'user' | 'assistant', content: string}>>();

  constructor() {
    this.llmService = createLLMService();
    if (!this.llmService) {
      console.warn('No LLM service configured. Add API keys to environment variables.');
    } else {
      const config = this.llmService.getConfig();
      console.log(`LLM service initialized with ${config.provider} (${config.model})`);
    }
  }

  async sendMessage(
    message: string, 
    conversationId?: string, 
    context?: ChatContext
  ): Promise<{
    response: string;
    conversationId: string;
    messageId: string;
    usage?: any;
  }> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate AI response
      const aiResponse = await this.generateResponse(message, context, conversationId);

      let finalConversationId = conversationId;

      // Create conversation if it doesn't exist
      if (!conversationId) {
        const { data: newConversation, error: convError } = await supabase
          .from('chat_conversations')
          .insert([{
            user_id: user.id,
            title: message.length > 50 ? message.substring(0, 50) + '...' : message,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true
          }])
          .select()
          .single();

        if (convError) throw convError;
        finalConversationId = newConversation.id;
      }

      // Save message to database
      const { data: savedMessage, error: messageError } = await supabase
        .from('chat_messages')
        .insert([{
          conversation_id: finalConversationId,
          user_id: user.id,
          message: message.trim(),
          response: aiResponse.response,
          timestamp: new Date().toISOString(),
          context: context || {}
        }])
        .select()
        .single();

      if (messageError) throw messageError;

      // Update conversation timestamp
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', finalConversationId);

      // Update conversation history for context
      this.updateConversationHistory(finalConversationId, message, aiResponse.response);

      return {
        response: aiResponse.response,
        conversationId: finalConversationId,
        messageId: savedMessage.id,
        usage: aiResponse.usage
      };
    } catch (error) {
      console.error('Chat service error:', error);
      throw error;
    }
  }

  async getConversations(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: conversations, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return conversations || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  async getConversationMessages(conversationId: string): Promise<any[]> {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Rebuild conversation history for this conversation
      if (messages && messages.length > 0) {
        const history: Array<{role: 'user' | 'assistant', content: string}> = [];
        messages.forEach(msg => {
          history.push({ role: 'user', content: msg.message });
          history.push({ role: 'assistant', content: msg.response });
        });
        this.conversationHistory.set(conversationId, history);
      }

      return messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ is_active: false })
        .eq('id', conversationId);

      if (error) throw error;

      // Clear conversation history
      this.conversationHistory.delete(conversationId);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  private async generateResponse(
    message: string, 
    context?: ChatContext, 
    conversationId?: string
  ): Promise<ChatResponse> {
    const cacheKey = this.generateCacheKey(message, context);
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Get conversation history for context
    const history = conversationId ? this.conversationHistory.get(conversationId) || [] : [];

    // Try LLM service first
    if (this.llmService) {
      try {
        console.log('Generating LLM response...');
        const llmResponse = await this.llmService.generateResponse(message, context, history);
        
        const response: ChatResponse = {
          response: llmResponse.content,
          confidence: 0.9,
          source: 'llm',
          usage: llmResponse.usage
        };
        
        this.setCache(cacheKey, response);
        return response;
      } catch (error) {
        console.warn('LLM service failed, using fallback:', error);
      }
    }

    // Fallback to rule-based responses
    const fallbackResponse = this.generateFallbackResponse(message, context);
    this.setCache(cacheKey, fallbackResponse);
    return fallbackResponse;
  }

  private updateConversationHistory(
    conversationId: string, 
    userMessage: string, 
    aiResponse: string
  ): void {
    if (!this.conversationHistory.has(conversationId)) {
      this.conversationHistory.set(conversationId, []);
    }
    
    const history = this.conversationHistory.get(conversationId)!;
    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'assistant', content: aiResponse });
    
    // Keep only last 20 messages (10 exchanges) for context
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
  }

  private generateFallbackResponse(message: string, context?: ChatContext): ChatResponse {
    const lowerMessage = message.toLowerCase();
    
    // Chemistry-specific fallback responses
    if (context?.element) {
      return {
        response: `${context.element} is an interesting element! I can help you learn about its properties, reactions, and applications. What specific aspect would you like to explore?`,
        confidence: 0.6,
        source: 'fallback'
      };
    }
    
    if (lowerMessage.includes('water') || lowerMessage.includes('h2o') || lowerMessage.includes('h₂o')) {
      return {
        response: "Water (H₂O) is a fascinating molecule! It's polar, which gives it unique properties like high surface tension and the ability to dissolve many substances. Its bent molecular geometry and hydrogen bonding make it essential for life. What specific aspect of water chemistry interests you?",
        confidence: 0.8,
        source: 'fallback'
      };
    }
    
    if (lowerMessage.includes('carbon') || lowerMessage.includes('organic')) {
      return {
        response: "Carbon is the backbone of organic chemistry! With its ability to form four covalent bonds and create long chains, it enables an incredible diversity of compounds. Carbon can form single, double, and triple bonds, leading to alkanes, alkenes, alkynes, and aromatic compounds. Are you interested in organic reactions, carbon allotropes, or something else?",
        confidence: 0.8,
        source: 'fallback'
      };
    }
    
    if (lowerMessage.includes('reaction') || lowerMessage.includes('equation')) {
      return {
        response: "Chemical reactions are the heart of chemistry! They involve breaking and forming bonds, following conservation laws like mass and energy. Reactions can be classified as synthesis, decomposition, single/double replacement, combustion, or redox. Are you working on balancing equations, understanding mechanisms, or exploring reaction types?",
        confidence: 0.8,
        source: 'fallback'
      };
    }
    
    if (lowerMessage.includes('periodic') || lowerMessage.includes('element')) {
      return {
        response: "The periodic table is chemistry's roadmap! It organizes elements by atomic number and reveals patterns in properties like atomic radius, ionization energy, and electronegativity. These trends help predict chemical behavior and bonding patterns. Are you exploring specific trends, electron configurations, or particular elements?",
        confidence: 0.8,
        source: 'fallback'
      };
    }
    
    if (lowerMessage.includes('bond') || lowerMessage.includes('molecular')) {
      return {
        response: "Chemical bonding is how atoms connect to form compounds! Ionic bonds involve electron transfer between metals and nonmetals, covalent bonds share electrons between nonmetals, and metallic bonds create electron seas in metals. The type of bonding determines properties like conductivity, solubility, and melting point. Which type interests you?",
        confidence: 0.8,
        source: 'fallback'
      };
    }
    
    if (lowerMessage.includes('acid') || lowerMessage.includes('base') || lowerMessage.includes('ph')) {
      return {
        response: "Acids and bases are fundamental in chemistry! Acids donate protons (H⁺) and have pH < 7, while bases accept protons and have pH > 7. The pH scale measures acidity/basicity, and acid-base reactions often involve neutralization. Are you studying pH calculations, buffer systems, or specific acid-base reactions?",
        confidence: 0.8,
        source: 'fallback'
      };
    }
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return {
        response: "Hello! I'm your chemistry AI assistant, powered by advanced language models. I'm here to help you understand chemical concepts, solve problems, and explore the fascinating world of chemistry. What would you like to learn about today?",
        confidence: 0.9,
        source: 'fallback'
      };
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return {
        response: "I can help you with a wide range of chemistry topics! I can explain concepts like atomic structure, chemical bonding, and reaction mechanisms. I can help balance equations, predict products, discuss safety considerations, and solve stoichiometry problems. I can also provide information about specific elements, compounds, and their properties. What specific chemistry topic would you like to explore?",
        confidence: 0.9,
        source: 'fallback'
      };
    }
    
    return {
      response: "I'm here to help with your chemistry questions! I can explain concepts, help with reactions, discuss elements and compounds, solve problems, and much more. Whether you're studying general chemistry, organic chemistry, or advanced topics, I'm ready to assist. What would you like to explore?",
      confidence: 0.5,
      source: 'fallback'
    };
  }

  private generateCacheKey(message: string, context?: ChatContext): string {
    const contextStr = context ? JSON.stringify(context) : '';
    return `${message.toLowerCase()}_${contextStr}`;
  }

  private getCache(key: string): ChatResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Simple cache validation - in production you'd want timestamp-based expiry
    return cached;
  }

  private setCache(key: string, data: ChatResponse): void {
    this.cache.set(key, data);
    
    // Simple cache cleanup - remove old entries periodically
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  // Method to check if LLM service is available
  isLLMAvailable(): boolean {
    return this.llmService !== null;
  }

  // Method to get LLM configuration
  getLLMConfig() {
    return this.llmService?.getConfig() || null;
  }

  // Method to get available models
  getAvailableModels(): string[] {
    return this.llmService?.getAvailableModels?.() || [];
  }
}

export const chatService = new ChatService();