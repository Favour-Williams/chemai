interface LLMProvider {
  name: string;
  models: string[];
  generate: (
    messages: { role: string; content: string }[],
    model: string,
    maxTokens?: number
  ) => Promise<ReadableStream<Uint8Array>>;
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

export class OpenRouterProvider implements LLMProvider {
  name = "OpenRouter";
  models = [
    "mistralai/mistral-7b-instruct:free",
    "deepseek/deepseek-r1-0528:free", 
    "meta-llama/llama-4-scout:free",
    "microsoft/phi-3-mini-128k-instruct:free",
    "google/gemma-2-9b-it:free",
  ];

  async generate(messages: any[], model: string, maxTokens: number = 1000) {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    console.log("Sending request to OpenRouter:", { model, messageCount: messages.length });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "ChemAI Platform",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);
      throw new Error(`OpenRouter error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error("No response body from OpenRouter");
    }

    console.log("OpenRouter response received, starting stream...");
    return response.body;
  }

  async generateNonStreaming(messages: any[], model: string, maxTokens: number = 1000): Promise<LLMResponse> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "ChemAI Platform",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      model: data.model || model,
    };
  }
}

export class GroqProvider implements LLMProvider {
  name = "Groq";
  models = [
    "llama3-8b-8192",
    "llama3-70b-8192",
    "gemma2-9b-it",
    "mixtral-8x7b-32768",
  ];

  async generate(messages: any[], model: string, maxTokens: number = 1000) {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    console.log("Sending request to Groq:", { model, messageCount: messages.length });

    // Ensure messages have the correct format for Groq
    const formattedMessages = messages.map(msg => ({
      role: msg.role === "USER" ? "user" : msg.role === "ASSISTANT" ? "assistant" : msg.role,
      content: msg.content
    }));

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq error:", response.status, errorText);
      throw new Error(`Groq error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error("No response body from Groq");
    }

    console.log("Groq response received, starting stream...");
    return response.body;
  }

  async generateNonStreaming(messages: any[], model: string, maxTokens: number = 1000): Promise<LLMResponse> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const formattedMessages = messages.map(msg => ({
      role: msg.role === "USER" ? "user" : msg.role === "ASSISTANT" ? "assistant" : msg.role,
      content: msg.content
    }));

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      model: data.model || model,
    };
  }
}

export const providers: Record<string, LLMProvider> = {
  openrouter: new OpenRouterProvider(),
  groq: new GroqProvider(),
};

// Helper function to parse streaming response
export async function parseStreamingResponse(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let content = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            return content;
          }
          
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
            }
          } catch (e) {
            // Skip invalid JSON lines
            continue;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  
  return content;
}