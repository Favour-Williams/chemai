import axios from 'axios';

interface ChatResponse {
  response: string;
  confidence: number;
  source: 'huggingface' | 'cohere' | 'fallback';
}

interface HuggingFaceResponse {
  generated_text: string;
}

interface CohereResponse {
  generations: Array<{
    text: string;
    likelihood: number;
  }>;
}

class AIChatService {
  private huggingFaceToken = process.env['HUGGINGFACE_API_TOKEN'];
  private cohereToken = process.env['COHERE_API_TOKEN'];
  private cache = new Map<string, ChatResponse>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  private isValidCache(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private setCache(key: string, data: ChatResponse): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  private getCache(key: string): ChatResponse | null {
    if (this.isValidCache(key)) {
      return this.cache.get(key) || null;
    }
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    return null;
  }

  async generateResponse(message: string, context?: any): Promise<ChatResponse> {
    const cacheKey = this.generateCacheKey(message, context);
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Try Hugging Face first
    if (this.huggingFaceToken) {
      try {
        const response = await this.queryHuggingFace(message, context);
        this.setCache(cacheKey, response);
        return response;
      } catch (error) {
        console.warn('Hugging Face API failed, trying Cohere:', error);
      }
    }

    // Try Cohere as fallback
    if (this.cohereToken) {
      try {
        const response = await this.queryCohere(message, context);
        this.setCache(cacheKey, response);
        return response;
      } catch (error) {
        console.warn('Cohere API failed, using fallback:', error);
      }
    }

    // Fallback to rule-based responses
    const fallbackResponse = this.generateFallbackResponse(message, context);
    this.setCache(cacheKey, fallbackResponse);
    return fallbackResponse;
  }

  private async queryHuggingFace(message: string, context?: any): Promise<ChatResponse> {
    const prompt = this.buildChemistryPrompt(message, context);
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large',
      { inputs: prompt },
      {
        headers: {
          'Authorization': `Bearer ${this.huggingFaceToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const generatedText = response.data[0]?.generated_text || '';
    const cleanResponse = this.cleanResponse(generatedText, prompt);

    return {
      response: cleanResponse,
      confidence: 0.8,
      source: 'huggingface'
    };
  }

  private async queryCohere(message: string, context?: any): Promise<ChatResponse> {
    const prompt = this.buildChemistryPrompt(message, context);
    
    const response = await axios.post(
      'https://api.cohere.ai/v1/generate',
      {
        model: 'command-light',
        prompt: prompt,
        max_tokens: 200,
        temperature: 0.7,
        k: 0,
        stop_sequences: ['\n\n'],
        return_likelihoods: 'GENERATION'
      },
      {
        headers: {
          'Authorization': `Bearer ${this.cohereToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const generation = response.data.generations[0];
    
    return {
      response: generation.text.trim(),
      confidence: generation.likelihood || 0.7,
      source: 'cohere'
    };
  }

  private buildChemistryPrompt(message: string, context?: any): string {
    let prompt = `You are ChemAI, a helpful chemistry assistant. Answer chemistry questions accurately and concisely.\n\n`;
    
    if (context?.element) {
      prompt += `Context: User is asking about the element ${context.element}.\n`;
    }
    
    if (context?.reaction) {
      prompt += `Context: User is asking about the reaction ${context.reaction}.\n`;
    }
    
    prompt += `Human: ${message}\nChemAI:`;
    
    return prompt;
  }

  private cleanResponse(generatedText: string, prompt: string): string {
    // Remove the prompt from the response
    let cleaned = generatedText.replace(prompt, '').trim();
    
    // Remove common artifacts
    cleaned = cleaned.replace(/^(ChemAI:|AI:|Assistant:)/i, '').trim();
    cleaned = cleaned.replace(/\n+/g, ' ').trim();
    
    // Ensure it's not empty
    if (!cleaned) {
      return "I'd be happy to help with your chemistry question! Could you please provide more details?";
    }
    
    return cleaned;
  }

  private generateFallbackResponse(message: string, context?: any): ChatResponse {
    const lowerMessage = message.toLowerCase();
    
    // Element-specific responses
    if (context?.element) {
      return {
        response: `${context.element} is an interesting element! I can help you learn about its properties, uses, and chemical behavior. What specific aspect would you like to know more about?`,
        confidence: 0.6,
        source: 'fallback'
      };
    }
    
    // Reaction-specific responses
    if (context?.reaction) {
      return {
        response: `This reaction involves interesting chemistry! I can explain the mechanism, energy changes, safety considerations, and practical applications. What would you like to explore?`,
        confidence: 0.6,
        source: 'fallback'
      };
    }
    
    // General chemistry topics
    if (lowerMessage.includes('atomic') || lowerMessage.includes('electron')) {
      return {
        response: "Atomic structure is fundamental to understanding chemistry! Atoms consist of protons, neutrons, and electrons. The arrangement of electrons determines chemical properties and bonding behavior.",
        confidence: 0.7,
        source: 'fallback'
      };
    }
    
    if (lowerMessage.includes('bond') || lowerMessage.includes('molecular')) {
      return {
        response: "Chemical bonding is how atoms connect to form molecules! There are ionic bonds (electron transfer), covalent bonds (electron sharing), and metallic bonds. The type depends on electronegativity differences.",
        confidence: 0.7,
        source: 'fallback'
      };
    }
    
    if (lowerMessage.includes('reaction') || lowerMessage.includes('equation')) {
      return {
        response: "Chemical reactions involve breaking and forming bonds between atoms. They follow conservation laws and can be classified as synthesis, decomposition, single/double replacement, or combustion reactions.",
        confidence: 0.7,
        source: 'fallback'
      };
    }
    
    if (lowerMessage.includes('periodic') || lowerMessage.includes('table')) {
      return {
        response: "The periodic table organizes elements by atomic number and shows periodic trends in properties like atomic radius, ionization energy, and electronegativity. It's a powerful tool for predicting chemical behavior!",
        confidence: 0.7,
        source: 'fallback'
      };
    }
    
    if (lowerMessage.includes('safety') || lowerMessage.includes('danger')) {
      return {
        response: "Chemical safety is crucial! Always wear appropriate PPE, work in well-ventilated areas, know your chemicals' hazards, and have emergency procedures ready. Never mix unknown chemicals!",
        confidence: 0.8,
        source: 'fallback'
      };
    }
    
    // Default response
    return {
      response: "I'm here to help with your chemistry questions! I can explain concepts about elements, compounds, reactions, bonding, and safety. What would you like to learn about?",
      confidence: 0.5,
      source: 'fallback'
    };
  }

  private generateCacheKey(message: string, context?: any): string {
    const contextStr = context ? JSON.stringify(context) : '';
    return `${message.toLowerCase()}_${contextStr}`;
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const aiChatService = new AIChatService();