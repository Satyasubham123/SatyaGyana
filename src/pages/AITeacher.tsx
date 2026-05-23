import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Loader2, Globe, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import axios from 'axios';

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
  
  // New state for image handling
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle 10-second spam protection cooldown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Handle image selection
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
    // Allow sending if there is text OR an image
    if ((!input.trim() && !selectedImage) || cooldown > 0 || isLoading) return;

    const userMessage = input.trim();
    const currentPreview = imagePreview; // Capture current state before clearing
    
    // 1. Add user message to UI immediately
    setMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      sender: 'user', 
      text: userMessage,
      imageUrl: currentPreview 
    }]);

    // 2. Clear inputs immediately for good UX
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    setIsLoading(true);
    setCooldown(10); // Start 10s cooldown

    try {
      let response;

      // 3. Logic Fork: Is it an Image request or a Text request?
      if (currentPreview) {
        // Send to Vision API
        response = await axios.post('https://gyanamitra.onrender.com/api/analyze-image', {
          image_base64: currentPreview,
          prompt: userMessage,
          targetLanguage: language
        });
      } else {
        // Send to standard Chat API
        response = await axios.post('https://gyanamitra.onrender.com/api/chat', {
          prompt: userMessage,
          targetLanguage: language,
          history: [] 
        });
      }

      // 4. Add AI response to UI
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
            className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
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
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm flex flex-col gap-2 ${
              msg.sender === 'user' 
                ? 'bg-purple-600 text-white rounded-br-none' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
            }`}>
              {/* Display image if attached */}
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Uploaded" className="max-w-full rounded-lg max-h-64 object-cover" />
              )}
              {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 rounded-bl-none shadow-sm flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              <span className="text-gray-500 text-sm animate-pulse">Analyzing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 rounded-b-2xl border-t border-gray-100 shadow-sm relative">
        {cooldown > 0 && !isLoading && (
          <div className="flex items-center gap-2 text-amber-600 text-xs mb-2 ml-1">
            <AlertCircle className="w-3 h-3" /> Please wait {cooldown}s before sending another message.
          </div>
        )}
        
        {/* Image Preview Area */}
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg border-2 border-purple-200" />
            <button 
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="relative flex items-center gap-2">
          {/* Hidden File Input & Upload Button */}
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors shrink-0"
            disabled={isLoading || cooldown > 0}
            title="Upload an image (Homework, diagrams, math problems)"
          >
            <ImageIcon className="w-6 h-6" />
          </button>

          {/* Text Area */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={imagePreview ? "Ask a question about this image..." : `Ask your question in ${language}...`}
            className="w-full h-14 p-4 rounded-xl border border-gray-300 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none shadow-inner"
            disabled={cooldown > 0 || isLoading}
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !selectedImage) || cooldown > 0 || isLoading}
            className={`p-3 rounded-xl flex items-center justify-center transition-all shrink-0 h-14 w-14 ${
              (!input.trim() && !selectedImage) || cooldown > 0 || isLoading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg active:scale-95'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}