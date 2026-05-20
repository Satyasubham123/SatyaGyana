import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Sparkles, User, Brain, Paperclip, 
  MessageSquare, Plus, MoreVertical, Trash2, 
  Edit2, X, Image as ImageIcon, Loader2 
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { chatService, ChatSession, ChatMessage } from '../services/chatService';
import { aiService } from '../services/aiService';
import { toast, Toaster } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function AITeacher() {
  const { user } = useUser();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Image Upload State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load User's Chat History on Mount
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  // Load Messages when Active Session Changes
  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const loadSessions = async () => {
    if (!user) {
      console.log("No user found, skipping load");
      return;
    }
    console.log("Attempting to fetch chats for UID:", user.uid);
    const history = await chatService.getUserChats(user.uid);
    console.log("History result from Firestore:", history);
    
  
    setSessions(history);
    if (history.length > 0 && !activeSessionId) {
      setActiveSessionId(history[0].id);
    }
  };

  const loadMessages = async (chatId: string) => {
    const chatMsgs = await chatService.getChatMessages(chatId);
    setMessages(chatMsgs);
  };

  const createNewChat = async () => {
    if (!user) return;
    try {
      const newChatId = await chatService.createChat(user.uid, "New Conversation", false);
      await loadSessions();
      setActiveSessionId(newChatId);
      setMessages([]);
    } catch (error) {
      toast.error("Failed to initialize new neural link.");
    }
  };

  // 🚀 HANDLE IMAGE UPLOAD (Converts to Base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image too large. Limit is 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 🚀 THE MAIN SEND MESSAGE FUNCTION
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || !user || isTyping) return;

    // 1. Ensure we have an active chat session
    let currentChatId = activeSessionId;
    if (!currentChatId) {
      currentChatId = await chatService.createChat(user.uid, input.slice(0, 30) || "Image Query", false);
      setActiveSessionId(currentChatId);
      await loadSessions(); // Refresh sidebar
    }

    const userMsgText = input.trim();
    const userMsgImage = selectedImage;
    
    // Clear input UI immediately for good UX
    setInput('');
    setSelectedImage(null);
    setIsTyping(true);

    // 2. Add user message to local UI
    const newUserMsg: ChatMessage = { sender: 'user', text: userMsgText, imageUrl: userMsgImage || undefined, timestamp: new Date() };
    setMessages(prev => [...prev, newUserMsg]);

    // 3. Save user message to database
    await chatService.saveMessage(currentChatId, 'user', userMsgText, userMsgImage || undefined);

    try {
      // 4. Format history for AI
      const aiHistory = messages.map(m => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        text: m.text
      }));

      // 5. Call Gemini AI via our new Service
      const aiResponseText = await aiService.sendMessage(aiHistory, {
        text: userMsgText || "Analyze this image and explain what you see in the context of school studies.",
        base64Image: userMsgImage || undefined
      });

      // 6. Add AI response to local UI
      const newAiMsg: ChatMessage = { sender: 'ai', text: aiResponseText, timestamp: new Date() };
      setMessages(prev => [...prev, newAiMsg]);

      // 7. Save AI response to database
      await chatService.saveMessage(currentChatId, 'ai', aiResponseText);

    } catch (error) {
      toast.error("AI synchronization failed.");
    } finally {
      setIsTyping(false);
    }
  };

  const deleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Prevent clicking the chat row
    if (!window.confirm("Purge this conversation permanently?")) return;
    
    await chatService.deleteChat(chatId);
    if (activeSessionId === chatId) {
      setActiveSessionId(null);
      setMessages([]);
    }
    await loadSessions();
  };

  if (!user) return null; // Or a loading spinner/auth redirect

  return (
    <div className="flex h-[calc(100vh-80px)] bg-bg-deep overflow-hidden relative">
      <Toaster position="top-center" toastOptions={{ style: { background: '#0F172A', color: '#fff', border: '1px solid #1E293B', borderRadius: '16px' }}}/>

      {/* 🚀 LEFT SIDEBAR (History) */}
      <motion.div 
        initial={{ x: 0 }}
        animate={{ width: isSidebarOpen ? 300 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="h-full bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden shadow-2xl relative z-20"
      >
        <div className="p-4 border-b border-slate-800">
          <button 
            onClick={createNewChat}
            className="w-full flex items-center justify-between p-3 bg-brand/10 hover:bg-brand/20 border border-brand/30 rounded-xl transition-all group"
          >
            <span className="text-xs font-black uppercase tracking-widest text-brand flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Link
            </span>
            <Sparkles className="h-4 w-4 text-brand opacity-50 group-hover:opacity-100" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {sessions.length === 0 ? (
             <div className="text-center p-4 opacity-50 mt-10">
               <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-500" />
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">No active links</p>
             </div>
          ) : (
            sessions.map((session) => (
              <div 
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`w-full text-left p-3 rounded-xl flex items-center justify-between group cursor-pointer transition-all ${
                  activeSessionId === session.id 
                    ? 'bg-slate-800 border-l-2 border-brand' 
                    : 'hover:bg-slate-800/50 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className={`h-4 w-4 shrink-0 ${activeSessionId === session.id ? 'text-brand' : 'text-slate-500'}`} />
                  <span className="text-xs font-medium text-slate-300 truncate">{session.title}</span>
                </div>
                <button 
                  onClick={(e) => deleteChat(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* 🚀 MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Top Header */}
        <div className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center px-4 justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-slate-400" />
            </button>
            <div>
               <h2 className="text-sm font-black uppercase tracking-widest text-white italic">GyanMitra AI</h2>
               <p className="text-[9px] font-bold text-brand uppercase tracking-[0.2em]">Neural Mentor v2.0</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-brand/10 border border-brand/20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-brand/10">
                <Brain className="h-10 w-10 text-brand" />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">Initialize Core</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                I am your dedicated AI mentor. Ask me complex math problems, request historical summaries, or upload an image of a diagram you don't understand.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.sender === 'user' ? 'bg-slate-800 border border-slate-700' : 'bg-brand shadow-lg shadow-brand/20'
                }`}>
                  {msg.sender === 'user' ? <User className="h-4 w-4 text-slate-300" /> : <Sparkles className="h-4 w-4 text-white" />}
                </div>
                
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 ${
                  msg.sender === 'user' 
                    ? 'bg-slate-800 border border-slate-700 text-white rounded-tr-sm' 
                    : 'bg-transparent border border-slate-800 text-slate-300 rounded-tl-sm'
                }`}>
                  {msg.imageUrl && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-slate-700">
                      <img src={msg.imageUrl} alt="Uploaded query" className="max-w-full h-auto max-h-60 object-contain bg-slate-900" />
                    </div>
                  )}
                  <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))
          )}
          
          {isTyping && (
            <div className="flex gap-4">
               <div className="w-8 h-8 rounded-lg bg-brand shadow-lg shadow-brand/20 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-white" />
               </div>
               <div className="bg-transparent border border-slate-800 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 text-brand animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand">Processing...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 🚀 INPUT AREA WITH IMAGE ATTACHMENT */}
        <div className="p-4 bg-bg-deep shrink-0">
          <div className="max-w-4xl mx-auto">
            {/* Image Preview Area */}
            <AnimatePresence>
              {selectedImage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mb-3 relative inline-block"
                >
                  <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-brand" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-slate-800 text-white p-1 rounded-full border border-slate-700 hover:bg-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSendMessage} className="relative flex items-end gap-2 bg-slate-900 border border-slate-700 rounded-3xl p-2 focus-within:border-brand/50 focus-within:ring-1 focus-within:ring-brand/50 transition-all shadow-xl">
              
              <input 
                type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload}
              />
              <button 
                type="button" onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-brand bg-slate-800 rounded-full transition-colors shrink-0"
                title="Attach Image"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask GyanMitra AI..."
                className="flex-1 bg-transparent border-none outline-none text-white text-sm resize-none py-3 px-2 min-h-[44px] max-h-32 custom-scrollbar"
                rows={1}
              />

              <button 
                type="submit" disabled={isTyping || (!input.trim() && !selectedImage)}
                className="p-3 bg-brand text-white rounded-full hover:bg-blue-600 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand/20"
              >
                <Send className="h-5 w-5 ml-1" />
              </button>
            </form>
            <p className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-3">
              GyanMitra AI can process text and images. Verification of AI output is recommended.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}