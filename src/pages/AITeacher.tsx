import { useState, useRef, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Sparkles, Languages, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { syncUserProfile, UserProfile, handleFirestoreError, OperationType } from '../services/userService';

// This block tells TypeScript that 'env' exists on import.meta globally, removing all red underlines!
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_GEMINI_API_KEY?: string;
    };
  }
}

interface AITeacherProps {
  user: FirebaseUser;
  profile: UserProfile | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AITeacher({ user, profile: initialProfile }: AITeacherProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [language, setLanguage] = useState<'English' | 'Hindi' | 'Odia'>('English');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const chatDoc = await getDoc(doc(db, 'aiConversations', user.uid));
        if (chatDoc.exists()) {
          const data = chatDoc.data();
          if (data.messages) {
            setMessages(data.messages);
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    if (user) {
      loadChatHistory();
    }
  }, [user]);

  // Sync messages to Firestore
  useEffect(() => {
    const syncChatHistory = async () => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      if (messages.length === 0) return;

      try {
        await setDoc(doc(db, 'aiConversations', user.uid), {
          userId: user.uid,
          messages,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `aiConversations/${user.uid}`);
      }
    };

    const timer = setTimeout(() => {
      syncChatHistory();
    }, 1000);

    return () => clearTimeout(timer);
  }, [messages, user.uid]);

  useEffect(() => {
    setProfile(initialProfile);
    if (initialProfile?.medium) {
      setLanguage(initialProfile.medium);
    }
  }, [initialProfile]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Vite requires this EXACT literal format to replace your key during deployment
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
      
      if (!apiKey) {
        throw new Error("API Key compilation missing on build server!");
      }

      const systemContext = `You are GyanMitra, an AI teacher. The student is in ${profile?.classLevel || "Class 10"} and learning in ${language}. Answer this query clearly and educationally: ${input}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemContext }] }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const googleReason = errorData.error?.message || `Status Code ${response.status}`;
        throw new Error(`Google API Reject: ${googleReason}`);
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having a bit of trouble thinking right now. Could you try asking again?";
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiText,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `System Diagnostics: ${error.message || "Failed to parse stream."}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    "Explain Newton's 1st Law",
    "How to solve quadratic equations?",
    "Science Chapter 5 summary",
    "Need help with math formula"
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100dvh-5rem)] sm:h-[calc(100vh-8rem)] flex flex-col pt-4 sm:pt-8 px-2 sm:px-4">
        <div className="flex-1 flex flex-col border border-border-strong bg-white dark:bg-bg-surface rounded-2xl sm:rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(37,99,235,0.08)] dark:shadow-none transition-all">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-border-strong bg-white dark:bg-bg-card flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
               <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
               </div>
               <div>
                  <h3 className="font-black text-sm sm:text-base uppercase tracking-tighter text-slate-900 dark:text-brand italic leading-none mb-1">Neural Assistant</h3>
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></div>
                     <span className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">Linked & Active</span>
                  </div>
               </div>
            </div>
            
            <div className="flex items-center gap-1 sm: gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
               {['English', 'Hindi', 'Odia'].map((lang) => (
                 <button
                  key={lang}
                  onClick={() => setLanguage(lang as any)}
                  className={cn(
                    "flex-1 sm:flex-none px-3 sm:px-4 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap",
                    language === lang 
                      ? "bg-white dark:bg-slate-700 shadow-sm text-brand" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                 >
                   {lang}
                 </button>
               ))}
            </div>
          </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-bg-deep scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
               <div className="w-20 h-20 bg-bg-card border-2 border-brand/20 rounded-full flex items-center justify-center mb-8 rotate-12">
                  <Bot className="h-10 w-10 text-brand" />
               </div>
               <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 text-main">Initialize Query</h2>
               <p className="text-muted font-medium uppercase tracking-widest text-xs mb-10 max-w-xs">
                 Ask anything about your curriculum. Multilingual processing active.
               </p>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                  {QUICK_PROMPTS.map(p => (
                     <button
                      key={p}
                      onClick={() => { setInput(p); }}
                      className="p-4 bg-bg-card border border-border-strong rounded-xl text-[10px] text-left text-brand font-black uppercase tracking-wider hover:border-brand transition-all shadow-xl shadow-black/40"
                     >
                       {p} →
                     </button>
                  ))}
               </div>
            </div>
          )}

          {messages.map((message, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex w-full mb-4",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "flex flex-col max-w-[85%] md:max-w-[75%]",
                message.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "p-6 rounded-2xl leading-relaxed whitespace-pre-wrap text-[15px] font-medium shadow-sm transition-all",
                  message.role === 'user' 
                    ? "bg-brand text-white rounded-tr-none shadow-xl shadow-brand/10 border border-brand/20" 
                    : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-border-strong"
                )}>
                  {message.content}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 uppercase font-black tracking-widest italic px-1">
                  {message.role === 'user' ? 'Local Stream' : 'Neural Uplink'} • {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-bg-card border border-border-strong p-6 rounded-2xl rounded-tl-none flex flex-col gap-3 shadow-xl">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-brand rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-brand rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-brand rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand animate-pulse">Neural Path Analysis...</span>
               </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-bg-surface border-t border-border-subtle">
          <div className="flex gap-2 items-center bg-bg-card p-2 rounded-xl border border-border-strong shadow-2xl">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Inject command or query..."
              className="flex-1 bg-transparent border-none text-sm outline-none px-4 font-medium placeholder:text-muted text-main"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 bg-brand text-white rounded-lg flex items-center justify-center font-black hover:scale-95 disabled:bg-border-strong transition-all shadow-xl shadow-brand/10 active:rotate-3"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="text-[10px] text-center text-muted mt-4 uppercase tracking-[0.2em] font-black italic">
            Telemetry Secure • AI Model: Gemini 2.0 High-Thinking
          </p>
        </div>
      </div>
    </div>
  );
}