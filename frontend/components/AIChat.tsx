'use client';

import { useState, useRef, useEffect } from 'react';
import { ApiError } from '../lib/api';
import { normalizeUrl } from '../lib/normalizeUrl';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  timestamp?: Date;
}

interface AIChatProps {
  url?: string;
  name?: string;
  riskScore?: string;
  onClose: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://supplier-risk-detector2.onrender.com/api/v1" || "http://localhost:8000/api/v1";

export default function AIChat({ url, name, riskScore, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedUrl = normalizeUrl(url);

  // Initial system message with supplier info
  useEffect(() => {
    if ((name || normalizedUrl) && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm your AI assistant for ${name || 'this supplier'}. ${riskScore ? `Current risk score: ${riskScore}.` : ''} I can help you understand the risk analysis, answer questions about the supplier, or provide additional insights. How can I assist you today?`,
        timestamp: new Date()
      }]);
    }
  }, [name, normalizedUrl, riskScore]);

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setLoading(true);
        const identifier = normalizedUrl || name;
        if (!identifier) return;

        const response = await fetch(`${API_BASE}/chat/history/${encodeURIComponent(identifier)}`);

        if (!response.ok) {
          if (response.status === 404) return;
          throw new Error(`Failed to load chat history: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.chats?.length) {
          const history = data.chats.flatMap((chat: any) => [
            { role: 'user', content: chat.question, timestamp: new Date(chat.timestamp) },
            { role: 'assistant', content: chat.answer, sources: chat.sources, timestamp: new Date(chat.timestamp) }
          ]);
          setMessages(prev => [...prev, ...history]);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
        setError('Failed to load chat history');
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();
  }, [normalizedUrl, name]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when not minimized
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    setError(null);
    setLoading(true);

    try {
      const userMessage: ChatMessage = { 
        role: 'user', 
        content: trimmedInput,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      const question = trimmedInput;
      setInput('');

      if (!normalizedUrl && !name) {
        throw new Error('Supplier identifier is missing');
      }

      const payload = {
        question,
        chat_history: messages
          .filter(m => m.role === 'user')
          .map(m => ({ role: m.role, content: m.content })),
        ...(normalizedUrl ? { url: normalizedUrl } : {}),
        ...(name && !normalizedUrl ? { supplier_name: name } : {})
      };

      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || 'Chat failed',
          response.status
        );
      }

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date()
      }]);

    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response');
      if (!messages[messages.length - 1]?.content) {
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatMessage = (content: string) => {
    // Split content into paragraphs and format
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      // Check if it's a list item
      if (paragraph.includes('•') || paragraph.includes('-') || /^\d+\./.test(paragraph)) {
        const items = paragraph.split(/\n(?=•|\d+\.|-)/);
        return (
          <div key={index} className="space-y-2">
            {items.map((item, itemIndex) => (
              <div key={itemIndex} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-sm leading-relaxed">{item.replace(/^[•\-]|\d+\.\s*/, '').trim()}</span>
              </div>
            ))}
          </div>
        );
      }
      
      // Regular paragraph
      return (
        <p key={index} className="text-sm leading-relaxed mb-3 last:mb-0">
          {paragraph}
        </p>
      );
    });
  };

  const quickQuestions = [
    "What are the main risk factors?",
    "How can we mitigate these risks?",
    "What's the financial stability?",
    "Are there compliance issues?",
    "Show me recent news",
    "Explain the risk score"
  ];

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group transform hover:scale-105"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {messages.length > 1 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center group-hover:scale-110 transition-transform font-medium">
                {Math.min(messages.length - 1, 99)}
              </span>
            )}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 max-h-[85vh] overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-5 rounded-t-2xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-base">{name ? `${name} Assistant` : 'AI Risk Assistant'}</h3>
              <p className="text-sm text-white/80">Intelligent Risk Analysis</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsMinimized(true)}
              className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
              aria-label="Minimize chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-5 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Welcome to AI Assistant</h4>
            <p className="text-gray-600 text-sm leading-relaxed">Ask me anything about {name || 'this supplier'} and I'll provide detailed insights</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  {/* Avatar */}
                  <div className={`flex items-end space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                    }`}>
                      {message.role === 'user' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      )}
                    </div>
                    
                    <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block p-4 rounded-2xl max-w-full ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-md shadow-lg' 
                          : 'bg-white text-gray-900 shadow-lg border border-gray-100 rounded-bl-md'
                      }`}>
                        {message.role === 'user' ? (
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        ) : (
                          <div className="space-y-3">
                            {formatMessage(message.content)}
                          </div>
                        )}
                        
                        {message.role === 'assistant' && Array.isArray(message.sources) && message.sources.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 font-medium mb-2 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              Sources:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {message.sources.map((source, idx) => (
                                <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 font-medium">
                                  {source}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {message.timestamp && (
                        <p className={`text-xs text-gray-400 mt-2 ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-end space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="bg-white text-gray-900 shadow-lg border border-gray-100 rounded-2xl rounded-bl-md p-4 max-w-[85%]">
                    <div className="flex space-x-3 items-center">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce delay-100"></div>
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-200"></div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">AI is analyzing...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && !loading && (
        <div className="px-5 py-4 border-t border-gray-100 bg-white">
          <p className="text-sm text-gray-600 mb-3 font-medium">Quick questions to get started:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInput(question)}
                className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-gray-700 px-3 py-2 rounded-lg transition-all duration-200 border border-gray-200 hover:border-blue-300 text-left hover:shadow-sm"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="px-5 py-3 bg-red-50 border-t border-red-100">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-700 text-sm flex-1">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-5 border-t border-gray-100 bg-white rounded-b-2xl">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${name || 'this supplier'}...`}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50 transition-all duration-200"
              disabled={loading}
              maxLength={500}
            />
            <button
              type="submit"
              className={`px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center min-w-[60px] ${
                loading || !input.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              {input.length}/500 characters
            </p>
            <p className="text-xs text-gray-500 flex items-center">
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs mr-1">Enter</kbd>
              to send
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

