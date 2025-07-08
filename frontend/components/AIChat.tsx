'use client';

import { useState, useRef, useEffect } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { ApiError } from '../lib/api';

// ✅ import the URL normalization helper
import { normalizeUrl } from '../lib/normalizeUrl';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

interface AIChatProps {
  url?: string;
  name?: string;
  riskScore?: string;
  onClose: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api/v1";

export default function AIChat({ url, name, riskScore, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { playAudio, stopAudio } = useAudioPlayer();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // ✅ Normalize the URL once
  const normalizedUrl = normalizeUrl(url);

  // Initial system message with supplier info
  useEffect(() => {
    if ((name || normalizedUrl) && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `I'm your AI assistant for ${name || 'this supplier'}. ${riskScore ? `Current risk score: ${riskScore}.` : ''} How can I help you?`
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
            { role: 'user', content: chat.question },
            { role: 'assistant', content: chat.answer, sources: chat.sources }
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

  // Auto-scroll and cleanup
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    return () => {
      mediaRecorderRef.current?.stop();
      stopAudio();
    };
  }, [messages, stopAudio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    setError(null);
    setLoading(true);

    try {
      const userMessage: ChatMessage = { role: 'user', content: trimmedInput };
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

      console.debug('Sending chat payload:', payload);

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
        sources: data.sources
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

  const handleVoiceInput = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    await startRecording();
  };

  const startRecording = async () => {
    setError(null);
    setIsRecording(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await processAudio(audioChunks);
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.state === 'recording' && stopRecording(), 10000);

    } catch (err) {
      console.error('Recording error:', err);
      setError('Microphone access denied. Please check permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const processAudio = async (chunks: BlobPart[]) => {
    try {
      const audioBlob = new Blob(chunks, { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');

      if (normalizedUrl) {
        formData.append('url', normalizedUrl);
      } else if (name) {
        formData.append('supplier_name', name);
      }

      formData.append('chat_history', JSON.stringify(
        messages.filter(m => m.role === 'user').map(m => ({
          role: m.role,
          content: m.content
        }))
      ));

      const response = await fetch(`${API_BASE}/voice/chat`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || 'Voice chat failed',
          response.status
        );
      }

      const data = await response.json();
      setMessages(prev => [
        ...prev,
        { role: 'user', content: data.question },
        { role: 'assistant', content: data.answer, sources: data.sources }
      ]);

      if (data.audio_url) {
        playAudio(data.audio_url);
      }
    } catch (err) {
      console.error('Voice processing error:', err);
      setError(err instanceof Error ? err.message : 'Voice processing failed');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50 max-h-[80vh]">
      <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
        <h3 className="font-semibold">{name ? `${name} Assistant` : 'Supplier AI Assistant'}</h3>
        <button 
          onClick={onClose} 
          className="text-white hover:text-gray-200 focus:outline-none"
          aria-label="Close chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Ask me anything about {name || 'this supplier'}</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-blue-100 text-blue-900' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {message.content}
                {message.role === 'assistant' && Array.isArray(message.sources) && message.sources.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Sources: {message.sources.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
        {loading && (
          <div className="text-left mb-4">
            <div className="inline-block p-3 rounded-lg bg-gray-100 text-gray-900">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 pb-2">
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>
        </div>
      )}

      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${name || 'this supplier'}...`}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading}
            aria-label="Type your message"
          />
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`p-2 rounded-full ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } disabled:opacity-50`}
            disabled={loading}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:opacity-50 transition-colors"
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            {loading ? (
              <span className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}









// 'use client';

// import { useState, useRef, useEffect } from 'react';
// import { useAudioPlayer } from '../hooks/useAudioPlayer';
// import { ApiError } from '../lib/api';

// interface ChatMessage {
//   role: 'user' | 'assistant';
//   content: string;
//   sources?: string[];
// }

// interface AIChatProps {
//   url?: string;
//   name?: string;
//   riskScore?: string;
//   onClose: () => void;
// }

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api/v1";

// export default function AIChat({ url, name, riskScore, onClose }: AIChatProps) {
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [input, setInput] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isRecording, setIsRecording] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const { playAudio, stopAudio } = useAudioPlayer();
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);

//   // Initial system message with supplier info
//   useEffect(() => {
//     if ((name || url) && messages.length === 0) {
//       setMessages([{
//         role: 'assistant',
//         content: `I'm your AI assistant for ${name || 'this supplier'}. ${riskScore ? `Current risk score: ${riskScore}.` : ''} How can I help you?`
//       }]);
//     }
//   }, [name, url, riskScore]);

//   // Load chat history when URL/name changes
//   useEffect(() => {
//     const loadChatHistory = async () => {
//       try {
//         setLoading(true);
//         const identifier = url || name;
//         if (!identifier) return;
        
//         const response = await fetch(`${API_BASE}/chat/history/${encodeURIComponent(identifier)}`);
        
//         if (!response.ok) {
//           if (response.status === 404) return; // No history exists
//           throw new Error(`Failed to load chat history: ${response.status}`);
//         }
        
//         const data = await response.json();
//         if (data.success && data.chats?.length) {
//           const history = data.chats.flatMap((chat: any) => [
//             { role: 'user', content: chat.question },
//             { role: 'assistant', content: chat.answer, sources: chat.sources }
//           ]);
//           setMessages(prev => [...prev, ...history]);
//         }
//       } catch (err) {
//         console.error('Failed to load chat history:', err);
//         setError('Failed to load chat history');
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadChatHistory();
//   }, [url, name]);

//   // Auto-scroll and cleanup
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     return () => {
//       mediaRecorderRef.current?.stop();
//       stopAudio();
//     };
//   }, [messages, stopAudio]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const trimmedInput = input.trim();
//     if (!trimmedInput || loading) return;

//     setError(null);
//     setLoading(true);

//     try {
//       const userMessage: ChatMessage = { role: 'user', content: trimmedInput };
//       setMessages(prev => [...prev, userMessage]);
      
//       // Store the question in a variable before clearing input
//       const question = trimmedInput;
//       setInput('');

//       // Validate we have either URL or name
//       if (!url && !name) {
//         throw new Error('Supplier identifier is missing');
//       }

//       const payload = {
//         question, // Use the stored, trimmed value
//         chat_history: messages
//           .filter(m => m.role === 'user')
//           .map(m => ({ role: m.role, content: m.content })),
//         ...(url ? { url } : {}),
//         ...(name && !url ? { supplier_name: name } : {})
//       };

//       // Log the payload for debugging
//       console.debug('Sending chat payload:', payload);

//       const response = await fetch(`${API_BASE}/chat`, {
//         method: 'POST',
//         headers: { 
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         throw new ApiError(
//           errorData.error || 'Chat failed',
//           response.status
//         );
//       }

//       const data = await response.json();
//       setMessages(prev => [...prev, {
//         role: 'assistant',
//         content: data.answer,
//         sources: data.sources
//       }]);

//     } catch (err) {
//       console.error('Chat error:', err);
//       setError(err instanceof Error ? err.message : 'Failed to get response');
//       // Only remove the last message if we didn't get a response
//       if (!messages[messages.length - 1]?.content) {
//         setMessages(prev => prev.slice(0, -1));
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleVoiceInput = async () => {
//     if (isRecording) {
//       stopRecording();
//       return;
//     }
//     await startRecording();
//   };

//   const startRecording = async () => {
//     setError(null);
//     setIsRecording(true);

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const mediaRecorder = new MediaRecorder(stream);
//       mediaRecorderRef.current = mediaRecorder;
//       const audioChunks: BlobPart[] = [];

//       mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
//       mediaRecorder.onstop = async () => {
//         stream.getTracks().forEach(track => track.stop());
//         await processAudio(audioChunks);
//       };

//       mediaRecorder.start();
//       setTimeout(() => mediaRecorder.state === 'recording' && stopRecording(), 10000);

//     } catch (err) {
//       console.error('Recording error:', err);
//       setError('Microphone access denied. Please check permissions.');
//       setIsRecording(false);
//     }
//   };

//   const stopRecording = () => {
//     mediaRecorderRef.current?.stop();
//     setIsRecording(false);
//   };

//   const processAudio = async (chunks: BlobPart[]) => {
//     try {
//       const audioBlob = new Blob(chunks, { type: 'audio/wav' });
//       const formData = new FormData();
//       formData.append('file', audioBlob, 'recording.wav');

//       if (url) {
//         formData.append('url', url);
//       } else if (name) {
//         formData.append('supplier_name', name);
//       }

//       // ✅ This is important — convert chat history into JSON string
//       formData.append('chat_history', JSON.stringify(
//         messages.filter(m => m.role === 'user').map(m => ({
//           role: m.role,
//           content: m.content
//         }))
//       ));

//       const response = await fetch(`${API_BASE}/voice/chat`, {
//         method: 'POST',
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         throw new ApiError(
//           errorData.error || 'Voice chat failed',
//           response.status
//         );
//       }

//       const data = await response.json();
//       setMessages(prev => [
//         ...prev,
//         { role: 'user', content: data.question },
//         { role: 'assistant', content: data.answer, sources: data.sources }
//       ]);

//       if (data.audio_url) {
//         playAudio(data.audio_url);
//       }
//     } catch (err) {
//       console.error('Voice processing error:', err);
//       setError(err instanceof Error ? err.message : 'Voice processing failed');
//     }
//   };


//   return (
//     <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50 max-h-[80vh]">
//       <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
//         <h3 className="font-semibold">{name ? `${name} Assistant` : 'Supplier AI Assistant'}</h3>
//         <button 
//           onClick={onClose} 
//           className="text-white hover:text-gray-200 focus:outline-none"
//           aria-label="Close chat"
//         >
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//             <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
//           </svg>
//         </button>
//       </div>

//       <div className="flex-1 p-4 overflow-y-auto">
//         {messages.length === 0 ? (
//           <div className="text-center text-gray-500 py-8">
//             <p>Ask me anything about {name || 'this supplier'}</p>
//           </div>
//         ) : (
//           messages.map((message, index) => (
//             <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
//               <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
//                 message.role === 'user' 
//                   ? 'bg-blue-100 text-blue-900' 
//                   : 'bg-gray-100 text-gray-900'
//               }`}>
//                 {message.content}
//                 {message.role === 'assistant' && Array.isArray(message.sources) && message.sources.length > 0 && (
//                   <div className="mt-2 text-xs text-gray-500">
//                     Sources: {message.sources.join(', ')}
//                   </div>
//                 )}
//               </div>
//             </div>
//           ))
//         )}
//         <div ref={messagesEndRef} />
//         {loading && (
//           <div className="text-left mb-4">
//             <div className="inline-block p-3 rounded-lg bg-gray-100 text-gray-900">
//               <div className="flex space-x-2">
//                 <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
//                 <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100"></div>
//                 <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200"></div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {error && (
//         <div className="px-4 pb-2">
//           <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>
//         </div>
//       )}

//       <div className="p-3 border-t border-gray-200 bg-gray-50">
//         <form onSubmit={handleSubmit} className="flex gap-2">
//           <input
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             placeholder={`Ask about ${name || 'this supplier'}...`}
//             className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
//             disabled={loading}
//             aria-label="Type your message"
//           />
//           <button
//             type="button"
//             onClick={handleVoiceInput}
//             className={`p-2 rounded-full ${
//               isRecording 
//                 ? 'bg-red-500 text-white animate-pulse' 
//                 : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//             } disabled:opacity-50`}
//             disabled={loading}
//             aria-label={isRecording ? 'Stop recording' : 'Start recording'}
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//               <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
//             </svg>
//           </button>
//           <button
//             type="submit"
//             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:opacity-50 transition-colors"
//             disabled={loading || !input.trim()}
//             aria-label="Send message"
//           >
//             {loading ? (
//               <span className="inline-flex items-center">
//                 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                 </svg>
//                 Sending...
//               </span>
//             ) : 'Send'}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }