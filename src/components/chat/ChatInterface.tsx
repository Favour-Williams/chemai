import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Mic, MicOff, Copy, Trash2, Share2, MessageSquare, Plus, X, Volume2, VolumeX, Zap, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useSettingsStore } from '../../store/settingsStore';
import { chatService } from '../../services/chatService';
import { voiceService } from '../../services/voiceService';
import { useToast } from '../../hooks/useToast';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  reactions: string[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface ChatConversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: ChatMessage[];
}

// Helper to remove markdown and LaTeX so the voice doesn't read symbols
function stripMarkdown(text: string): string {
  return text
    // Remove fenced code blocks entirely
    .replace(/```[\s\S]*?```/g, ' ')
    // Remove inline code
    .replace(/`([^`]*)`/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Remove links, keep text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Remove bold/italic markers
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove headings markers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove horizontal rules
    .replace(/^\s*([-*_])\s*(?:\1\s*){2,}$/gm, '')
    // Remove blockquote markers
    .replace(/^\s*>\s?/gm, '')
    // Remove table pipes
    .replace(/\|/g, ' ')
    // Remove LaTeX / math markers
    .replace(/\\\(|\\\)|\\\[|\\\]/g, ' ')
    .replace(/\$/g, ' ')
    .replace(/\\[a-zA-Z]+/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

const ChatInterface: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const theme = useSettingsStore((state) => state.theme);
  const isDark = theme.mode === 'dark';
  const { success, info, error } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatService.isLLMAvailable()) {
      const config = chatService.getLLMConfig();
      if (config) {
        info('LLM Service', `Using ${config.provider} (${config.model})`);
      } else {
        info('LLM Service', 'Using fallback responses.');
      }
    }
  }, [info]);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const loadConversations = async () => {
    try {
      const convs = await chatService.getConversations();
      const formattedConvs: ChatConversation[] = convs.map(conv => ({
        id: conv.id,
        title: conv.title,
        lastMessage: '...', // Placeholder
        timestamp: new Date(conv.updated_at),
        messages: []
      }));
      setConversations(formattedConvs);
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const msgs = await chatService.getConversationMessages(conversationId);
      const formattedMsgs: ChatMessage[] = [];
      msgs.forEach(msg => {
        formattedMsgs.push({ id: `${msg.id}_user`, text: msg.message, sender: 'user', timestamp: new Date(msg.timestamp), reactions: [] });
        formattedMsgs.push({ id: `${msg.id}_ai`, text: msg.response, sender: 'ai', timestamp: new Date(msg.timestamp), reactions: [] });
      });
      setMessages(formattedMsgs);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    setActiveConversation(conversationId);
    await loadMessages(conversationId);
  };

  const handleNewConversation = () => {
    setActiveConversation(null);
    setMessages([]);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await chatService.deleteConversation(conversationId);
      if (activeConversation === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
      await loadConversations();
      success('Conversation deleted', 'The conversation was removed.');
    } catch (err) {
      console.error('Error deleting conversation:', err);
      error('Error', 'Failed to delete conversation.');
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isRecording || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
      reactions: []
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const result = await chatService.sendMessage(userMessage.text, activeConversation || undefined);

      if (!activeConversation) {
        setActiveConversation(result.conversationId);
        await loadConversations();
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: result.response,
        sender: 'ai',
        timestamp: new Date(),
        reactions: [],
        usage: result.usage
      };
      setMessages(prev => [...prev, aiMessage]);

      if (result.usage && chatService.isLLMAvailable()) {
        const config = chatService.getLLMConfig();
        // FIX: Check if config is not null before using it
        if (config) {
            info('Token Usage', `${config.provider}: ${result.usage.totalTokens} tokens (${result.usage.promptTokens} prompt + ${result.usage.completionTokens} completion)`);
        }
      }

      if (voiceEnabled && voiceService.isSupported().synthesis) {
        setIsSpeaking(true);
        try {
          await voiceService.speak(stripMarkdown(result.response), { voice: 'neutral', rate: 1.0 });
        } catch (voiceError) {
          console.error('Voice synthesis error:', voiceError);
        } finally {
          setIsSpeaking(false);
        }
      }

    } catch (err) {
      console.error('Error sending message:', err);
      // FIX: Handle 'unknown' type for error object
      const aiErrorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      error('AI Service Error', aiErrorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      voiceService.stopListening();
      setIsRecording(false);
      setAudioLevel(0);
      return;
    }

    if (!voiceService.isSupported().recognition) {
      error('Voice input not supported', 'Your browser does not support speech recognition');
      return;
    }

    try {
      setIsRecording(true);
      setAudioLevel(0.5);

      const result = await voiceService.startListening();
      setInputText(result.transcript);
      success('Voice input captured', `Confidence: ${Math.round(result.confidence * 100)}%`);
    } catch (err) {
      console.error('Voice recognition error:', err);
      error('Voice recognition error', 'Failed to capture voice input.');
    } finally {
      setIsRecording(false);
      setAudioLevel(0);
    }
  };

  const handleCopyMessage = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(id);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      error('Copy failed', 'Unable to copy message to clipboard.');
    }
  };

  const handleShareMessage = (text: string) => {
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      handleCopyMessage(text, 'share');
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
    }
  };
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="flex flex-col h-full max-w-4xl mx-auto">
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <MessageSquare className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>ChemAI Chat</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-lg transition-colors ${voiceEnabled ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600')}`}
              title={voiceEnabled ? 'Disable voice output' : 'Enable voice output'}
            >
              {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button onClick={handleNewConversation} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`} title="New conversation">
              <Plus className="h-5 w-5" />
            </button>
            <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className={`px-6 py-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center space-x-4">
              <Zap className="h-5 w-5 text-blue-500" />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {chatService.isLLMAvailable() ? 'LLM Connected' : 'LLM Not Connected'}
                </p>
                {chatService.getLLMConfig() && (
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Provider: {chatService.getLLMConfig()?.provider} • Model: {chatService.getLLMConfig()?.model}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {conversations.length > 0 && (
          <div className="flex space-x-2 px-4 py-2 overflow-x-auto">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${activeConversation === conv.id ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
              >
                <span>{conv.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                  className="hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </button>
            ))}
          </div>
        )}

        <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          {messages.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Start a conversation</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ask me anything about chemistry!</p>
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="group relative max-w-[80%]">
                <div className={`rounded-lg px-4 py-3 ${message.sender === 'user' ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 shadow-sm border')}`}>
                  {message.sender === 'ai' ? (
                    <div className="markdown-content">
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-xs ${message.sender === 'user' ? 'text-blue-200' : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {message.usage && (<span className="ml-2">• {message.usage.totalTokens} tokens</span>)}
                    </p>
                  </div>
                </div>
                <div className={`absolute top-0 ${message.sender === 'user' ? 'left-0 transform -translate-x-full' : 'right-0 transform translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 px-2`}>
                  <button onClick={() => handleCopyMessage(message.text, message.id)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`} title={copySuccess === message.id ? 'Copied!' : 'Copy message'}>
                    <Copy className="h-3 w-3" />
                  </button>
                  <button onClick={() => handleShareMessage(message.text)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`} title="Share message">
                    <Share2 className="h-3 w-3" />
                  </button>
                  {message.sender === 'ai' && voiceService.isSupported().synthesis && (
                    <button onClick={() => voiceService.speak(stripMarkdown(message.text))} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`} title="Read aloud">
                      <Volume2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center space-x-2">
              <div className={`rounded-lg px-4 py-3 ${isDark ? 'bg-gray-700' : 'bg-white shadow-sm border'}`}>
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {chatService.isLLMAvailable() ? 'AI is thinking...' : 'Generating response...'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={`px-4 py-4 border-t ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex space-x-3">
            <button
              onClick={handleVoiceInput}
              className={`p-2.5 rounded-lg transition-colors relative ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-500 hover:bg-gray-300')}`}
              title={isRecording ? 'Stop recording' : 'Start voice recording'}
              disabled={!voiceService.isSupported().recognition}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              {isRecording && (
                <div className="absolute inset-0 rounded-lg overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 bg-red-400 transition-all duration-100" style={{ height: `${audioLevel * 100}%`, opacity: 0.3 }} />
                </div>
              )}
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask me anything about chemistry..."
              className={`flex-1 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 transition-colors ${isDark ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500' : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-blue-400'}`}
              disabled={isRecording || isTyping}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isRecording || isTyping}
              className={`px-4 py-2.5 rounded-lg transition-colors ${inputText.trim() && !isRecording && !isTyping ? 'bg-blue-600 hover:bg-blue-700 text-white' : (isDark ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')}`}
              title="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          {(isSpeaking || isRecording) && (
            <div className="mt-2 flex items-center space-x-2">
              {isSpeaking && (
                <div className="flex items-center space-x-2 text-sm text-blue-500">
                  <Volume2 className="h-4 w-4" />
                  <span>AI is speaking...</span>
                  <button onClick={() => { voiceService.stopSpeaking(); setIsSpeaking(false); }} className="text-red-500 hover:text-red-600">
                    <VolumeX className="h-4 w-4" />
                  </button>
                </div>
              )}
              {isRecording && (
                <div className="flex items-center space-x-2 text-sm text-red-500">
                  <Mic className="h-4 w-4" />
                  <span>Listening...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
