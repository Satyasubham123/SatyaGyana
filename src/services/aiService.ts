// src/services/aiService.ts

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://gyanamitra.onrender.com'}/api`;

export const aiService = {
  /**
   * Securely sends a standard text chat request through the Python backend.
   */
  async sendMessage(chatHistory: { role: 'user' | 'model'; text: string }[], currentInput: any) {
    try {
      // 1. Format the history to match the Python backend's expected structure
      const formattedHistory = chatHistory.map(msg => ({
        role: msg.role,
        parts: msg.text // Python backend expects parts to be a string
      }));

      // 2. Extract the actual text prompt
      const promptText = typeof currentInput === 'string' ? currentInput : currentInput.text;

      // 3. Send the secure request to Python
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          targetLanguage: "English", // Default to English for general service calls
          history: formattedHistory
        })
      });

      if (!response.ok) {
        throw new Error(`Backend Error ${response.status}`);
      }
      
      const data = await response.json();
      return data.text;

    } catch (error) {
      console.error("🔴 Connection error:", error);
      return "Unable to synchronize with the AI Node. Please check if the GyanMitra server is running.";
    }
  },

  /**
   * Securely analyzes an image through the Python backend.
   */
  async analyzeImage(imageBase64: string, promptText: string = "", targetLanguage: string = "English") {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: imageBase64,
          prompt: promptText,
          targetLanguage: targetLanguage
        })
      });

      if (!response.ok) {
        throw new Error(`Backend Error ${response.status}`);
      }
      
      const data = await response.json();
      return data.text;

    } catch (error) {
      console.error("🔴 Image Analysis error:", error);
      return "Unable to analyze the image at this time. Please try again.";
    }
  }
};