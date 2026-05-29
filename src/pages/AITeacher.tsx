import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Globe, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiService } from '../services/aiService'; // 🚀 FIXED: Importing our secure bridge!

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  imageUrl?: string | null;
}

export default function AITeacher() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('English');
  const [cooldown, setCooldown] = useState(0);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || cooldown > 0 || isLoading) return;

    const userMessage = input.trim();
    const currentPreview = imagePreview;
    
    setMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      sender: 'user', 
      text: userMessage,
      imageUrl: currentPreview 
    }]);

    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    setIsLoading(true);
    setCooldown(10); 

    try {
      let responseText = "";
      
      if (currentPreview) {
        // 🚀 ROUTE 1: Secure Image Analysis
        responseText = await aiService.analyzeImage(currentPreview, userMessage, language);
      } else {
        // 🚀 ROUTE 2: Secure Text Chat
        const historyForBackend: { role: 'user' | 'model'; text: string }[] = messages.map(msg => ({          
          role: msg.sender === 'user' ? 'user' : 'model',
          text: msg.text
        }));

        responseText = await aiService.sendMessage(historyForBackend, userMessage);
      }

      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: responseText 
      }]);

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: "Sorry, I am experiencing high traffic. Please make sure the local Python server is running!" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto p-4 relative">
      <div className="flex justify-between items-center p-4 rounded-t-2xl border-b border-white/20 bg-white/70 backdrop-blur-md shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg shadow-inner">
            <Bot className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">SatyaGyana Tutor</h1>
            <p className="text-sm text-gray-500 font-medium">Your AI Study Companion</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-all">
          <Globe className="w-4 h-4 text-purple-500" />
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="English">English</option>
            <option value="Odia">ଓଡ଼ିଆ (Odia)</option>
            <option value="Hindi">हिंदी (Hindi)</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/30 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
            <Bot className="w-16 h-16 opacity-20" />
            <p className="text-center font-medium">Hello! Upload a photo of your homework or ask a question.<br/>I can teach in English, Odia, and Hindi.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] rounded-2xl p-5 shadow-sm flex flex-col gap-3 leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-none' 
                : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-md'
            }`}>
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Uploaded" className="max-w-full rounded-xl max-h-72 object-cover border border-white/20 shadow-sm" />
              )}
              
              {msg.text && (
                <div className={`prose prose-sm md:prose-base max-w-none ${msg.sender === 'user' ? 'text-white prose-invert' : 'text-gray-800'}`}>
                  {msg.sender === 'user' ? (
                    <p className="whitespace-pre-wrap m-0">{msg.text}</p>
                  ) : (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-md font-bold mt-2 mb-1" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="marker:text-purple-500" {...props} />,
                        a: ({node, ...props}) => <a className="text-purple-600 hover:underline font-medium" {...props} />,
                        code: ({node, inline, ...props}: any) => 
                          inline 
                            ? <code className="bg-gray-100 text-purple-700 px-1.5 py-0.5 rounded-md text-sm font-mono" {...props} />
                            : <pre className="bg-gray-800 text-gray-100 p-3 rounded-xl overflow-x-auto my-2 text-sm font-mono shadow-inner"><code {...props} /></pre>
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 rounded-bl-none shadow-md flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></span>
              </div>
              <span className="text-gray-500 text-sm font-medium tracking-wide">Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white/80 backdrop-blur-md p-4 rounded-b-2xl border-t border-white/20 shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)] relative z-10">
        {cooldown > 0 && !isLoading && (
          <div className="flex items-center gap-2 text-amber-600 text-xs mb-3 ml-2 font-medium bg-amber-50 w-fit px-3 py-1 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" /> Please wait {cooldown}s before sending again.
          </div>
        )}
        
        {imagePreview && (
          <div className="mb-3 relative inline-block animate-in zoom-in-95 duration-200">
            <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-purple-300 shadow-sm" />
            <button 
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-all hover:scale-110 shadow-md"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="relative flex items-end gap-2">
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all shrink-0 border border-transparent hover:border-purple-100"
            disabled={isLoading || cooldown > 0}
            title="Upload an image (Homework, diagrams, math problems)"
          >
            <ImageIcon className="w-6 h-6" />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={imagePreview ? "Ask a question about this image..." : `Ask your question in ${language}... (Shift+Enter for new line)`}
            className="w-full min-h-[56px] max-h-32 p-4 rounded-xl border border-gray-200 bg-white/50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white resize-none shadow-inner transition-all leading-relaxed"
            disabled={cooldown > 0 || isLoading}
          />

          <button
            onClick={handleSend}
            disabled={(!input.trim() && !selectedImage) || cooldown > 0 || isLoading}
            className={`p-3.5 rounded-xl flex items-center justify-center transition-all shrink-0 shadow-sm ${
              (!input.trim() && !selectedImage) || cooldown > 0 || isLoading
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-md hover:scale-105 active:scale-95'
            }`}
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}