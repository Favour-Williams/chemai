import { providers, OpenRouterProvider, GroqProvider } from './llmProviders';

interface LLMConfig {
  provider: 'openrouter' | 'groq' | 'openai' | 'anthropic' | 'cohere' | 'huggingface';
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

interface ChatContext {
  element?: string;
  reaction?: string;
  topic?: string;
}

class LLMService {
  private config: LLMConfig;
  private systemPrompt = `You are ChemAI, an expert chemistry assistant and educator. You help students, researchers, and chemistry enthusiasts understand chemical concepts, reactions, and solve chemistry problems.

Key guidelines:
- Provide accurate, educational chemistry information
- Use proper chemical notation (H₂O, CO₂, C₆H₁₂O₆, etc.)
- Explain concepts clearly and step-by-step
- Include safety warnings when discussing hazardous reactions or chemicals
- Be encouraging and supportive in your responses
- If you're unsure about something, say so rather than guessing
- Focus on chemistry education and practical applications
- Use examples and analogies to make complex concepts accessible
- Mention real-world applications when relevant

Topics you excel at:
- Organic and inorganic chemistry
- Chemical reactions and mechanisms
- Periodic table and element properties
- Chemical bonding and molecular structure
- Thermodynamics and kinetics
- Laboratory safety and procedures
- Chemical calculations and stoichiometry
- Spectroscopy and analytical chemistry

Always maintain a helpful, professional tone while making chemistry accessible and interesting.`;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async generateResponse(
    message: string, 
    context?: ChatContext,
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
  ): Promise<LLMResponse> {
    const enhancedPrompt = this.buildContextualPrompt(message, context);
    
    switch (this.config.provider) {
      case 'openrouter':
        return this.callOpenRouter(enhancedPrompt, conversationHistory);
      case 'groq':
        return this.callGroq(enhancedPrompt, conversationHistory);
      case 'openai':
        return this.callOpenAI(enhancedPrompt, conversationHistory);
      case 'anthropic':
        return this.callAnthropic(enhancedPrompt, conversationHistory);
      case 'cohere':
        return this.callCohere(enhancedPrompt, conversationHistory);
      case 'huggingface':
        return this.callHuggingFace(enhancedPrompt, conversationHistory);
      default:
        throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
    }
  }

  private buildContextualPrompt(message: string, context?: ChatContext): string {
    let enhancedPrompt = message;
    
    if (context?.element) {
      enhancedPrompt = `Context: The user is asking about the element ${context.element}.\n\nUser question: ${message}`;
    } else if (context?.reaction) {
      enhancedPrompt = `Context: The user is asking about the chemical reaction: ${context.reaction}.\n\nUser question: ${message}`;
    } else if (context?.topic) {
      enhancedPrompt = `Context: The user is asking about ${context.topic}.\n\nUser question: ${message}`;
    }
    
    return enhancedPrompt;
  }

  private async callOpenRouter(
    prompt: string, 
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}>
  ): Promise<LLMResponse> {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: prompt }
    ];

    const provider = providers.openrouter as OpenRouterProvider;
    const model = this.config.model || 'mistralai/mistral-7b-instruct:free';
    
    return await provider.generateNonStreaming(messages, model, this.config.maxTokens);
  }

  private async callGroq(
    prompt: string, 
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}>
  ): Promise<LLMResponse> {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: prompt }
    ];

    const provider = providers.groq as GroqProvider;
    const model = this.config.model || 'llama3-8b-8192';
    
    return await provider.generateNonStreaming(messages, model, this.config.maxTokens);
  }

  private async callOpenAI(
    prompt: string, 
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}>
  ): Promise<LLMResponse> {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: prompt }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-3.5-turbo',
        messages,
        max_tokens: this.config.maxTokens || 1000,
        temperature: this.config.temperature || 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      model: data.model,
    };
  }

  private async callAnthropic(
    prompt: string, 
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}>
  ): Promise<LLMResponse> {
    const messages = [
      ...conversationHistory.slice(-10),
      { role: 'user', content: prompt }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: this.config.maxTokens || 1000,
        temperature: this.config.temperature || 0.7,
        system: this.systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      model: data.model,
    };
  }

  private async callCohere(
    prompt: string, 
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}>
  ): Promise<LLMResponse> {
    const chatHistory = conversationHistory.slice(-10).map(msg => ({
      role: msg.role === 'assistant' ? 'CHATBOT' : 'USER',
      message: msg.content,
    }));

    const response = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'command',
        message: prompt,
        chat_history: chatHistory,
        preamble: this.systemPrompt,
        max_tokens: this.config.maxTokens || 1000,
        temperature: this.config.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cohere API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.text,
      usage: {
        promptTokens: data.meta?.billed_units?.input_tokens || 0,
        completionTokens: data.meta?.billed_units?.output_tokens || 0,
        totalTokens: (data.meta?.billed_units?.input_tokens || 0) + (data.meta?.billed_units?.output_tokens || 0),
      },
      model: data.meta?.model || this.config.model || 'command',
    };
  }

  private async callHuggingFace(
    prompt: string, 
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}>
  ): Promise<LLMResponse> {
    const fullPrompt = `${this.systemPrompt}\n\n${conversationHistory.slice(-5).map(msg => 
      `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
    ).join('\n')}\nHuman: ${prompt}\nAssistant:`;

    const response = await fetch(`https://api-inference.huggingface.co/models/${this.config.model || 'microsoft/DialoGPT-large'}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: this.config.maxTokens || 500,
          temperature: this.config.temperature || 0.7,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Hugging Face API error: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    let content = '';
    
    if (Array.isArray(data) && data[0]?.generated_text) {
      content = data[0].generated_text.replace(fullPrompt, '').trim();
    } else if (data.generated_text) {
      content = data.generated_text.replace(fullPrompt, '').trim();
    } else {
      throw new Error('Unexpected response format from Hugging Face');
    }
    
    return {
      content,
      model: this.config.model || 'microsoft/DialoGPT-large',
    };
  }

  updateConfig(newConfig: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }

  getAvailableModels(): string[] {
    switch (this.config.provider) {
      case 'openrouter':
        return (providers.openrouter as OpenRouterProvider).models;
      case 'groq':
        return (providers.groq as GroqProvider).models;
      default:
        return [];
    }
  }
}

// Factory function to create LLM service with environment variables
export function createLLMService(): LLMService | null {
  // Check for API keys in environment variables (priority order)
  const openrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const groqKey = import.meta.env.VITE_GROQ_API_KEY;
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  const cohereKey = import.meta.env.VITE_COHERE_API_KEY;
  const huggingfaceKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;

  if (openrouterKey) {
    console.log('Using OpenRouter LLM service');
    return new LLMService({
      provider: 'openrouter',
      apiKey: openrouterKey,
      model: 'mistralai/mistral-7b-instruct:free',
      maxTokens: 1000,
      temperature: 0.7,
    });
  }

  if (groqKey) {
    console.log('Using Groq LLM service');
    return new LLMService({
      provider: 'groq',
      apiKey: groqKey,
      model: 'llama3-8b-8192',
      maxTokens: 1000,
      temperature: 0.7,
    });
  }

  if (openaiKey) {
    console.log('Using OpenAI LLM service');
    return new LLMService({
      provider: 'openai',
      apiKey: openaiKey,
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7,
    });
  }

  if (anthropicKey) {
    console.log('Using Anthropic LLM service');
    return new LLMService({
      provider: 'anthropic',
      apiKey: anthropicKey,
      model: 'claude-3-sonnet-20240229',
      maxTokens: 1000,
      temperature: 0.7,
    });
  }

  if (cohereKey) {
    console.log('Using Cohere LLM service');
    return new LLMService({
      provider: 'cohere',
      apiKey: cohereKey,
      model: 'command',
      maxTokens: 1000,
      temperature: 0.7,
    });
  }

  if (huggingfaceKey) {
    console.log('Using Hugging Face LLM service');
    return new LLMService({
      provider: 'huggingface',
      apiKey: huggingfaceKey,
      model: 'microsoft/DialoGPT-large',
      maxTokens: 500,
      temperature: 0.7,
    });
  }

  console.warn('No LLM API keys found in environment variables');
  return null;
}

export { LLMService };
export type { LLMConfig, LLMResponse, ChatContext };