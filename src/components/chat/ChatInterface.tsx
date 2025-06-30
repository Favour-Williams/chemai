import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Mic, MicOff, Copy, Trash2, Share2, Download, MessageSquare, Plus, X, Moon, Sun, MoreVertical, Volume2, VolumeX, Zap, ZapOff, Settings } from 'lucide-react';
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


const ChatInterface: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { success, error, info } = useToast();
  
  const theme = useSettingsStore((state) => state.theme);
  const updateTheme = useSettingsStore((state) => state.updateTheme);
  
  const isDark = theme.mode === 'dark';
  const toggleTheme = () => {
    updateTheme({ mode: isDark ? 'light' : 'dark' });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

 useEffect(() => {
    if (isOpen) {
      loadConversations();
      try {
        const config = chatService.getLLMConfig();
        // FIX: Check if config is not null before accessing its properties
        if (config) {
          success('LLM Service', `Connected to ${config.provider} (${config.model})`);
        } else {
          info('LLM Service', 'Using fallback responses.');
        }
      } catch (err) {
        // FIX: Handle 'unknown' type for error object
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        error('LLM Service Error', errorMessage);
      }
    }
  }, [isOpen, success, info, error]); // Added dependencies to satisfy ESLint

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation);
    } else {
        setMessages([]); // Clear messages when no conversation is active
    }
  }, [activeConversation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target?.closest('[data-chat-menu]')) {
        setShowChatMenu(null);
      }
      // FIX: Removed unused 'showEmojiPicker' logic
      if (!target?.closest('[data-settings-menu]')) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      
      if (formattedConvs.length > 0 && !activeConversation) {
        setActiveConversation(formattedConvs[0].id);
      }
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

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
      reactions: [],
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const result = await chatService.sendMessage(
        userMessage.text,
        activeConversation || undefined
      );

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
          await voiceService.speak(result.response, { voice: 'neutral', rate: 1.0 });
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
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: `⚠️ ${aiErrorMessage}`,
        sender: 'ai',
        timestamp: new Date(),
        reactions: []
      };
      setMessages(prev => [...prev, errorMessage]);
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
      console.error('Voice input error:', err);
      error('Voice input failed', 'Please try again or check microphone permissions');
    } finally {
      setIsRecording(false);
      setAudioLevel(0);
    }
  };

  const handleCopyMessage = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(messageId);
      success('Message copied', 'Text copied to clipboard');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleShareMessage = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ text: text, title: 'Shared from ChemAI Chat' });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      await navigator.clipboard.writeText(text);
      success('Message copied', 'Text copied to clipboard for sharing');
    }
  };

  const handleExportChat = () => {
    if (!activeConversation) return;
    
    const conversation = conversations.find(c => c.id === activeConversation);
    if (!conversation) return;

    const exportData = {
      title: conversation.title,
      timestamp: conversation.timestamp.toISOString(),
      llmProvider: chatService.getLLMConfig()?.provider || 'fallback',
      messages: messages.map(msg => ({
        sender: msg.sender, text: msg.text, timestamp: msg.timestamp.toISOString(),
        reactions: msg.reactions, usage: msg.usage
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chemai-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteChat = async (chatId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      try {
        await chatService.deleteConversation(chatId);
        await loadConversations();
        if (activeConversation === chatId) {
          setActiveConversation(null);
        }
        setShowChatMenu(null);
        success('Conversation deleted', 'The conversation has been removed');
      } catch (err) {
        error('Failed to delete conversation', 'Please try again');
      }
    }
  };

  const handleNewChat = () => {
    setActiveConversation(null);
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return timestamp.toLocaleDateString();
  };

  const renderLLMSettings = () => {
    const config = chatService.getLLMConfig();

    return (
      <div className={`absolute top-full right-0 mt-2 w-80 rounded-lg shadow-lg border p-4 z-50 ${
        isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
      }`} data-settings-menu>
        <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          LLM Settings
        </h3>
        {config ? (
          <div className="space-y-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Provider</label>
              <div className={`px-3 py-2 rounded border ${ isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}>
                {config.provider.charAt(0).toUpperCase() + config.provider.slice(1)}
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Model</label>
              <div className={`px-3 py-2 rounded border text-sm ${ isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}>
                {config.model}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-500">Connected</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <ZapOff className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No LLM configured. Add API keys to .env file.
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative w-full max-w-6xl h-[90vh] max-h-[800px] rounded-lg shadow-2xl flex overflow-hidden">
        {/* Chat History Sidebar */}
        <div className={`w-64 border-r flex flex-col ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="p-4 border-b flex items-center justify-between dark:border-gray-700">
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Chats</h3>
            <button onClick={handleNewChat} className={`p-1.5 rounded-lg transition-colors ${ isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600'}`} title="New Chat">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div key={conv.id} className="relative group">
                  <button onClick={() => setActiveConversation(conv.id)} className={`w-full p-3 rounded-lg text-left transition-colors pr-10 ${
                      activeConversation === conv.id ? (isDark ? 'bg-gray-700 text-white' : 'bg-blue-50 text-blue-900 border border-blue-200') : (isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50')
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate text-sm font-medium">{conv.title}</span>
                    </div>
                    <p className="text-xs opacity-50 mt-1">{formatTimestamp(conv.timestamp)}</p>
                  </button>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" data-chat-menu>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowChatMenu(showChatMenu === conv.id ? null : conv.id); }} className={`p-1 rounded-md transition-colors ${ isDark ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}>
                      <MoreVertical className="h-3 w-3" />
                    </button>
                    {showChatMenu === conv.id && (
                      <div className={`absolute top-full right-0 mt-1 w-32 rounded-md shadow-lg border z-50 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} data-chat-menu>
                        <button onClick={(e) => handleDeleteChat(conv.id, e)} className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors flex items-center space-x-2 ${isDark ? 'text-red-400 hover:bg-gray-600' : 'text-red-600 hover:bg-gray-50'}`}>
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className={`px-6 py-4 border-b flex justify-between items-center ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold">Chemistry AI Assistant</h2>
              {/* FIX: Wrap icons with a span to apply the title attribute */}
              <div className="flex items-center space-x-1">
                {chatService.isLLMAvailable() ? (
                  <span title="LLM Connected">
                    <Zap className="h-4 w-4 text-green-500" />
                  </span>
                ) : (
                  <span title="Using Fallback Responses">
                    <ZapOff className="h-4 w-4 text-yellow-500" />
                  </span>
                )}
                <span className={`text-xs ${ chatService.isLLMAvailable() ? 'text-green-500' : 'text-yellow-500'}`}>
                  {chatService.getLLMConfig()?.provider || 'Fallback'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative" data-settings-menu>
                <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg transition-colors ${ isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`} title="LLM Settings">
                  <Settings className="h-5 w-5" />
                </button>
                {showSettings && renderLLMSettings()}
              </div>
              <button onClick={toggleVoice} className={`p-2 rounded-lg transition-colors ${ voiceEnabled ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')}`} title={voiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}>
                {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
              <button onClick={toggleTheme} className={`p-2 rounded-lg transition-colors ${ isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button onClick={handleExportChat} disabled={!activeConversation} className={`p-2 rounded-lg transition-colors ${ activeConversation ? (isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600') : 'opacity-50 cursor-not-allowed'}`} title="Export Chat">
                <Download className="h-5 w-5" />
              </button>
              <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${ isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${ isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
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
                  <div className={`rounded-lg px-4 py-3 ${ message.sender === 'user' ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 shadow-sm border')}`}>
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs ${ message.sender === 'user' ? 'text-blue-200' : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {message.usage && (<span className="ml-2">• {message.usage.totalTokens} tokens</span>)}
                      </p>
                    </div>
                  </div>
                  <div className={`absolute top-0 ${ message.sender === 'user' ? 'left-0 transform -translate-x-full' : 'right-0 transform translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 px-2`}>
                    <button onClick={() => handleCopyMessage(message.text, message.id)} className={`p-1.5 rounded-lg transition-colors ${ isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`} title={copySuccess === message.id ? 'Copied!' : 'Copy message'}>
                      <Copy className="h-3 w-3" />
                    </button>
                    <button onClick={() => handleShareMessage(message.text)} className={`p-1.5 rounded-lg transition-colors ${ isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`} title="Share message">
                      <Share2 className="h-3 w-3" />
                    </button>
                    {message.sender === 'ai' && voiceService.isSupported().synthesis && (
                      <button onClick={() => voiceService.speak(message.text)} className={`p-1.5 rounded-lg transition-colors ${ isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`} title="Read aloud">
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

          <div className={`p-4 border-t ${ isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <div className="flex space-x-3">
              <button onClick={handleVoiceInput} className={`p-2.5 rounded-lg transition-colors relative ${ isRecording ? 'bg-red-500 hover:bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-500 hover:bg-gray-300')}`} title={isRecording ? 'Stop recording' : 'Start voice recording'} disabled={!voiceService.isSupported().recognition}>
                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                {isRecording && (<div className="absolute inset-0 rounded-lg overflow-hidden"><div className="absolute bottom-0 left-0 right-0 bg-red-400 transition-all duration-100" style={{ height: `${audioLevel * 100}%`, opacity: 0.3 }}/></div>)}
              </button>
              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Ask me anything about chemistry..." className={`flex-1 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 transition-colors ${ isDark ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500' : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-blue-400'}`} disabled={isRecording || isTyping}/>
              <button onClick={handleSend} disabled={!inputText.trim() || isRecording || isTyping} className={`px-4 py-2.5 rounded-lg transition-colors ${ inputText.trim() && !isRecording && !isTyping ? 'bg-blue-600 hover:bg-blue-700 text-white' : (isDark ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')}`} title="Send message">
                <Send className="h-5 w-5" />
              </button>
            </div>
            {(isSpeaking || isRecording) && (
              <div className="mt-2 flex items-center space-x-2">
                {isSpeaking && (
                  <div className="flex items-center space-x-2 text-sm text-blue-500">
                    <Volume2 className="h-4 w-4" />
                    <span>AI is speaking...</span>
                    <button onClick={() => { voiceService.stopSpeaking(); setIsSpeaking(false); }} className="text-red-500 hover:text-red-600"><VolumeX className="h-4 w-4" /></button>
                  </div>
                )}
                {isRecording && (
                  <div className="flex items-center space-x-2 text-sm text-red-500">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span>Listening...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;