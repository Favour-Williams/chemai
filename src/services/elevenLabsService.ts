// services/elevenLabsService.ts
import { LLMService, createLLMService, ChatContext } from './llmService';
import { voiceService } from './voiceService'; // Browser-native fallback (SpeechSynthesis)

interface ElevenLabsVoiceOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speakerBoost?: boolean;
}

interface ElevenLabsStreamOptions extends ElevenLabsVoiceOptions {
  onDataReceived?: (audioChunk: ArrayBuffer) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

interface ElevenLabsHistoryItem {
  id: string;
  text: string;
  timestamp: Date;
  elementSymbol?: string;
  audioUrl?: string;
}

// Structured error so callers (and our own fallback logic) can tell
// "no credits / needs upgrade" apart from "network blip" etc.
export class ElevenLabsApiError extends Error {
  status: number;
  code?: string;
  detailStatus?: string;

  constructor(status: number, message: string, code?: string, detailStatus?: string) {
    super(message);
    this.name = 'ElevenLabsApiError';
    this.status = status;
    this.code = code;
    this.detailStatus = detailStatus;
  }

  /** True for the "free tier can't use this voice / feature" family of errors. */
  get isPlanRestriction(): boolean {
    return (
      this.status === 402 ||
      this.detailStatus === 'payment_required' ||
      this.detailStatus === 'free_users_not_allowed'
    );
  }
}

async function parseElevenLabsError(response: Response, context: string): Promise<ElevenLabsApiError> {
  let detailMessage = response.statusText;
  let code: string | undefined;
  let detailStatus: string | undefined;

  try {
    const errorData = await response.json();
    // ElevenLabs errors come back as { detail: { status, message, code? } }
    // but occasionally as { detail: "some string" }, so handle both.
    const detail = errorData?.detail;
    if (detail && typeof detail === 'object') {
      detailMessage = detail.message || JSON.stringify(detail);
      code = detail.code;
      detailStatus = detail.status;
    } else if (typeof detail === 'string') {
      detailMessage = detail;
    } else {
      detailMessage = JSON.stringify(errorData);
    }
    console.error(`ElevenLabsService: ${context} error detail:`, JSON.stringify(errorData, null, 2));
  } catch {
    // Response body wasn't JSON (or was empty) — fall back to status text.
    console.error(`ElevenLabsService: ${context} error (non-JSON body):`, response.status, response.statusText);
  }

  return new ElevenLabsApiError(
    response.status,
    `ElevenLabsService: Failed to ${context}: ${response.status} ${response.statusText} - ${detailMessage}`,
    code,
    detailStatus
  );
}

class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private defaultVoiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice (library voice — free tier can't use via API)
  private defaultModelId = 'eleven_turbo_v2'; // Recommended for chat
  private audioContext: AudioContext | null = null;
  private audioQueue: ArrayBuffer[] = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private history: ElevenLabsHistoryItem[] = []; // In-memory history for demonstration
  private llmService: LLMService | null;

  // Once we hit a plan-restriction error, stop hammering ElevenLabs for the
  // rest of the session and just use the browser fallback — avoids a 402
  // on every single utterance.
  private planRestricted = false;

  constructor(apiKey: string, llmService: LLMService | null) {
    this.apiKey = apiKey;
    this.llmService = llmService;
    this.initAudioContext();
  }

  private initAudioContext() {
    if (!this.audioContext && (window.AudioContext || (window as any).webkitAudioContext)) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('ElevenLabsService: AudioContext initialized.');
      } catch (error) {
        console.error('ElevenLabsService: Failed to initialize AudioContext:', error);
        this.audioContext = null;
      }
    }
  }

  public isAvailable(): boolean {
    const isApiKeyConfigured = !!this.apiKey && this.apiKey !== 'your-elevenlabs-api-key-here';
    if (!isApiKeyConfigured) {
      console.warn('ElevenLabsService: API key is not configured. Voice features will be disabled.');
    }
    if (!this.audioContext) {
      console.warn('ElevenLabsService: AudioContext could not be initialized. Audio playback may fail.');
    }
    return isApiKeyConfigured && !!this.audioContext;
  }

  public async getVoices() {
    if (!this.isAvailable()) {
      throw new Error('ElevenLabs API key not configured or AudioContext unavailable.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw await parseElevenLabsError(response, 'get voices');
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error('ElevenLabsService: Error fetching voices:', error);
      throw error;
    }
  }

  public async textToSpeech(
    text: string,
    options: ElevenLabsVoiceOptions = {}
  ): Promise<ArrayBuffer> {
    if (!this.isAvailable()) {
      throw new Error('ElevenLabs API key not configured or AudioContext unavailable.');
    }

    try {
      const voiceId = options.voiceId || this.defaultVoiceId;
      const modelId = options.modelId || this.defaultModelId;

      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarityBoost || 0.75,
            style: options.style || 0.0,
            use_speaker_boost: options.speakerBoost !== undefined ? options.speakerBoost : true,
          },
          output_format: 'mp3_44100_128',
        }),
      });

      if (!response.ok) {
        const err = await parseElevenLabsError(response, 'convert text to speech');
        if (err.isPlanRestriction) this.planRestricted = true;
        throw err;
      }

      this.addToHistory(text, undefined);

      return await response.arrayBuffer();
    } catch (error) {
      console.error('ElevenLabsService: Error in text-to-speech:', error);
      throw error;
    }
  }

  /**
   * Streams TTS audio from ElevenLabs and plays it. If ElevenLabs is
   * unavailable, unconfigured, or blocked by a plan restriction (e.g. 402
   * "free users cannot use library voices via the API"), this transparently
   * falls back to the browser's built-in SpeechSynthesis via voiceService,
   * so callers don't need to handle both paths themselves.
   */
  public async streamTextToSpeech(
    text: string,
    options: ElevenLabsStreamOptions = {}
  ): Promise<void> {
    // Skip straight to fallback if we already know this account can't use
    // the API for this kind of voice, or ElevenLabs isn't usable at all.
    if (this.planRestricted || !this.isAvailable()) {
      return this.speakWithFallback(text, options);
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.error('ElevenLabsService: Failed to resume AudioContext before streaming:', e);
        return this.speakWithFallback(text, options);
      }
    }

    try {
      const voiceId = options.voiceId || this.defaultVoiceId;
      const modelId = options.modelId || this.defaultModelId;

      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}/stream`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarityBoost || 0.75,
            style: options.style || 0.0,
            use_speaker_boost: options.speakerBoost !== undefined ? options.speakerBoost : true,
          },
          output_format: 'mp3_44100_128',
        }),
      });

      if (!response.ok) {
        const err = await parseElevenLabsError(response, 'stream text to speech');
        if (err.isPlanRestriction) {
          this.planRestricted = true;
          console.warn(
            'ElevenLabsService: Plan restriction hit — falling back to browser speech synthesis for the rest of this session.'
          );
        }
        return this.speakWithFallback(text, options);
      }

      if (!response.body) {
        throw new Error('ElevenLabsService: ReadableStream not supported by response body.');
      }

      this.addToHistory(text, options.voiceId ? undefined : 'element');

      const reader = response.body.getReader();
      let chunks: Uint8Array[] = [];
      let totalLength = 0;

      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            const combinedChunks = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
              combinedChunks.set(chunk, offset);
              offset += chunk.length;
            }

            if (combinedChunks.byteLength > 0) {
              await this.playAudio(combinedChunks.buffer);
            }

            if (options.onComplete) {
              options.onComplete();
            }
            break;
          }

          chunks.push(value);
          totalLength += value.length;

          if (options.onDataReceived) {
            options.onDataReceived(value.buffer);
          }
        }
      };

      processStream().catch(error => {
        console.error('ElevenLabsService: Error processing audio stream:', error);
        // Something broke mid-stream (network drop, decode failure, etc) —
        // still try to get the text spoken via the fallback.
        this.speakWithFallback(text, options).catch(() => {});
      });
    } catch (error) {
      console.error('ElevenLabsService: Error in streaming text-to-speech request:', error);
      return this.speakWithFallback(text, options);
    }
  }

  /** Browser SpeechSynthesis fallback used whenever ElevenLabs can't fulfill the request. */
  private async speakWithFallback(text: string, options: ElevenLabsStreamOptions): Promise<void> {
    try {
      await voiceService.speak(text);
      this.addToHistory(text, options.voiceId ? undefined : 'element');
      if (options.onComplete) options.onComplete();
    } catch (fallbackError) {
      console.error('ElevenLabsService: Browser speech synthesis fallback also failed:', fallbackError);
      if (options.onError) options.onError(fallbackError as Error);
    }
  }

  public async playAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      console.error('ElevenLabsService: Audio context not initialized. Cannot play audio.');
      return;
    }

    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.error('ElevenLabsService: Failed to resume AudioContext during playAudio:', e);
        return;
      }
    }

    this.audioQueue.push(audioData);

    if (!this.isPlaying) {
      this.playNextInQueue();
    }
  }

  private async playNextInQueue(): Promise<void> {
    if (!this.audioContext || this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.audioQueue.shift()!;

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData);

      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;

      this.currentSource.connect(this.audioContext.destination);

      this.currentSource.start(0);

      this.currentSource.onended = () => {
        this.currentSource = null;
        this.playNextInQueue();
      };
    } catch (error) {
      console.error('ElevenLabsService: Error decoding or playing audio:', error);
      this.isPlaying = false;
      this.playNextInQueue();
    }
  }

  public stopAudio(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {
        console.warn('ElevenLabsService: Attempted to stop audio source that was not started or already stopped:', e);
      }
      this.currentSource = null;
    }

    voiceService.stopSpeaking(); // also stop any in-flight browser fallback speech

    this.audioQueue = [];
    this.isPlaying = false;
    console.log('ElevenLabsService: Audio playback stopped and queue cleared.');
  }

  public async generateElementConversation(
    elementName: string,
    userQuery: string
  ): Promise<string> {
    if (!this.llmService) {
      return `I'm sorry, my core knowledge base (LLM service) is not configured. I cannot generate a response about ${elementName}.`;
    }

    const context: ChatContext = {
      element: elementName,
      topic: 'periodic table element properties and uses',
    };

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: userQuery },
    ];

    try {
      const llmResponse = await this.llmService.generateResponse(userQuery, context, messages);
      return llmResponse.content;
    } catch (error) {
      console.error('ElevenLabsService: Error generating element conversation with LLM:', error);
      return `I'm sorry, I encountered an error trying to process your request about ${elementName} with my knowledge base. Please try again.`;
    }
  }

  private addToHistory(text: string, elementSymbol?: string): void {
    const historyItem: ElevenLabsHistoryItem = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      elementSymbol,
    };

    this.history.unshift(historyItem);

    if (this.history.length > 50) {
      this.history.pop();
    }
  }

  public getHistory(): ElevenLabsHistoryItem[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
    console.log('ElevenLabsService: History cleared.');
  }
}

// Create and export the service instance using environment variable
const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
const llmServiceInstance = createLLMService();
export const elevenLabsService = new ElevenLabsService(apiKey, llmServiceInstance);
