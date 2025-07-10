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

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api/v1";
const API_BASE = "https://supplier-risk-detector2.onrender.com";

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

  const quickQuestions = [
    "What are the main risk factors?",
    "How can we mitigate these risks?",
    "What's the financial stability?",
    "Are there compliance issues?"
  ];

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {messages.length > 1 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center group-hover:scale-110 transition-transform">
                {messages.length - 1}
              </span>
            )}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50 max-h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm">{name ? `${name} Assistant` : 'AI Assistant'}</h3>
              <p className="text-xs text-white/80">Risk Analysis Support</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsMinimized(true)}
              className="text-white/80 hover:text-white p-1 rounded transition-colors"
              aria-label="Minimize chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white p-1 rounded transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm">Ask me anything about {name || 'this supplier'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200 rounded-bl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.role === 'assistant' && Array.isArray(message.sources) && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 font-medium mb-1">Sources:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.map((source, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {message.timestamp && (
                    <p className={`text-xs text-gray-500 mt-1 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 shadow-sm border border-gray-200 rounded-lg rounded-bl-sm p-3 max-w-[80%]">
                  <div className="flex space-x-2 items-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200"></div>
                    </div>
                    <span className="text-xs text-gray-500">AI is thinking...</span>
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
        <div className="px-4 py-2 border-t border-gray-200 bg-white">
          <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-1">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInput(question)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-xs">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 ml-auto"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${name || 'this supplier'}...`}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            disabled={loading}
            maxLength={500}
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              loading || !input.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
            }`}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            {input.length}/500 characters
          </p>
          <p className="text-xs text-gray-500">
            Press Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}

