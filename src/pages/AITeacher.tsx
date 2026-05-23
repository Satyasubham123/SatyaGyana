import React, { useState, useEffect } from 'react';
import { Send, Bot, User, Loader2, Globe, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export default function AITeacher() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('English');
  const [cooldown, setCooldown] = useState(0);

  // Handle 10-second spam protection cooldown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSend = async () => {
    if (!input.trim() || cooldown > 0 || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userMessage }]);
    setIsLoading(true);
    setCooldown(10); // Start 10s cooldown

    try {
      // Calls your secure backend instead of exposing API keys
      const response = await axios.post('https://gyanamitra.onrender.com/api/chat', {
        prompt: userMessage,
        targetLanguage: language,
        history: [] 
      });

      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: response.data.text 
      }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: "Sorry, I am experiencing high traffic. Please try again in a moment." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto p-4">
      {/* Header & Language Selector */}
      <div className="flex justify-between items-center bg-white p-4 rounded-t-2xl border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg"><Bot className="w-6 h-6 text-purple-600" /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">GyanMitra Tutor</h1>
            <p className="text-sm text-gray-500">Your AI Study Companion</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
          <Globe className="w-4 h-4 text-gray-500" />
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
          >
            <option value="English">English</option>
            <option value="Odia">ଓଡ଼ିଆ (Odia)</option>
            <option value="Hindi">हिंदी (Hindi)</option>
          </select>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-purple-600 text-white rounded-br-none' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 rounded-bl-none shadow-sm flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              <span className="text-gray-500 text-sm animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Using your exact requested CSS fixes */}
      <div className="bg-white p-4 rounded-b-2xl border-t border-gray-100 shadow-sm">
        {cooldown > 0 && !isLoading && (
          <div className="flex items-center gap-2 text-amber-600 text-xs mb-2 ml-1">
            <AlertCircle className="w-3 h-3" /> Please wait {cooldown}s before sending another message.
          </div>
        )}
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Ask your question in ${language}...`}
            className="w-full h-32 p-4 rounded-xl border border-gray-300 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none shadow-inner"
            disabled={cooldown > 0 || isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || cooldown > 0 || isLoading}
            className={`absolute bottom-3 right-3 p-3 rounded-xl flex items-center justify-center transition-all ${
              !input.trim() || cooldown > 0 || isLoading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg active:scale-95'
            }`}
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}