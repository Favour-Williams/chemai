interface VoiceOptions {
  voice?: 'male' | 'female' | 'neutral';
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

class VoiceService {
  private synthesis: SpeechSynthesis;
  private recognition: any; // SpeechRecognition
  private isListening = false;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeVoices();
    this.initializeSpeechRecognition();
  }

  private initializeVoices(): void {
    const loadVoices = () => {
      this.voices = this.synthesis.getVoices();
    };

    loadVoices();
    
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoices;
    }
  }

  private initializeSpeechRecognition(): void {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
    }

    if (this.recognition) {
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  async speak(text: string, options: VoiceOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported in this browser'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice based on preference
      const voice = this.selectVoice(options.voice || 'neutral');
      if (voice) {
        utterance.voice = voice;
      }

      // Set speech parameters
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

      this.synthesis.speak(utterance);
    });
  }

  async startListening(): Promise<SpeechRecognitionResult> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported in this browser'));
        return;
      }

      if (this.isListening) {
        reject(new Error('Already listening'));
        return;
      }

      this.isListening = true;

      this.recognition.onresult = (event: any) => {
        const result = event.results[0];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        resolve({
          transcript: transcript.trim(),
          confidence: confidence || 0.5
        });
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      try {
        this.recognition.start();
      } catch (error) {
        this.isListening = false;
        reject(error);
      }
    });
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  private selectVoice(preference: 'male' | 'female' | 'neutral'): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      return null;
    }

    // Filter voices by language (English)
    const englishVoices = this.voices.filter(voice => 
      voice.lang.startsWith('en')
    );

    if (englishVoices.length === 0) {
      return this.voices[0];
    }

    // Try to match preference
    switch (preference) {
      case 'female':
        return englishVoices.find(voice => 
          voice.name.toLowerCase().includes('female') ||
          voice.name.toLowerCase().includes('woman') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('victoria') ||
          voice.name.toLowerCase().includes('karen')
        ) || englishVoices[0];
      
      case 'male':
        return englishVoices.find(voice => 
          voice.name.toLowerCase().includes('male') ||
          voice.name.toLowerCase().includes('man') ||
          voice.name.toLowerCase().includes('alex') ||
          voice.name.toLowerCase().includes('daniel') ||
          voice.name.toLowerCase().includes('tom')
        ) || englishVoices[0];
      
      default:
        return englishVoices[0];
    }
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith('en'));
  }

  isSupported(): { synthesis: boolean; recognition: boolean } {
    return {
      synthesis: 'speechSynthesis' in window,
      recognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    };
  }

  getListeningState(): boolean {
    return this.isListening;
  }
}

export const voiceService = new VoiceService();