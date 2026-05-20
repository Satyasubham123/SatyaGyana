import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

// 🚀 STRICT SYSTEM PROMPT TO WHITE-LABEL THE AI COMPLETELY
const SYSTEM_INSTRUCTION = `
  You are GyanMitra AI, a brilliant, empathetic, and encouraging AI Mentor built explicitly for school students (Classes 6 to 10) in India.
  
  CRITICAL RULES:
  1. NEVER reveal that you are "Gemini", created by "Google", or an "LLM". 
  2. If a student asks who created you, say: "I am GyanMitra AI, your dedicated learning assistant built by the GyanMitra team."
  3. Support multi-lingual explanations. If a student communicates or asks for help in English, Hindi, or Odia, adapt instantly.
  4. Break down complex math, science, and history questions into easy, step-by-step conceptual blocks suited for students.
  5. Use engaging emojis to keep students motivated.
`;

interface ChatMessageInput {
  text: string;
  base64Image?: string; // For question photo upload
}

export const aiService = {
  /**
   * Sends a message to the AI with full identity shielding and vision support
   */
  async sendMessage(chatHistory: { role: 'user' | 'model'; text: string }[], currentInput: ChatMessageInput) {
    try {
      if (!API_KEY) throw new Error("AI Stream configuration missing key.");

      // Format previous chat logs into Gemini's expected array structure
      const formattedContents = chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      // Assemble the current request parts (Text + optional Image)
      const currentParts: any[] = [{ text: currentInput.text }];
      
      if (currentInput.base64Image) {
        // Strip out the data:image/jpeg;base64, metadata prefix if present
        const cleanBase64 = currentInput.base64Image.split(',')[1] || currentInput.base64Image;
        currentParts.unshift({
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64
          }
        });
      }

      formattedContents.push({
        role: 'user',
        parts: currentParts
      });

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: formattedContents,
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      });

      if (!response.ok) throw new Error("AI Gateway handshaking fault.");
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "System connection timeout. Please resend query.";
    } catch (error) {
      console.error("AI Node internal error:", error);
      return "Unable to synchronize with AI Node. Check network connection.";
    }
  },

  /**
   * AI Dictionary Module: Parses a word/sentence and forces a structured breakdown
   */
  async lookUpDictionary(queryText: string, medium: string = 'English') {
    try {
      const prompt = `
        Act as an illustrated visual dictionary. The student wants to understand this word or phrase: "${queryText}".
        Provide the explanation tailored in a way that matches their language medium: ${medium}.
        
        Return ONLY a clean JSON object with this exact architecture (No markdown wrappers):
        {
          "word": "${queryText}",
          "meaning": "Clear, simple definition suited for a school student",
          "example": "A practical sentence using it",
          "imagePrompt": "A highly descriptive prompt to generate a historical, geographical, or scientific image explaining this concept visually."
        }
      `;

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) return null;
      const data = await response.json();
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(rawText);
    } catch (e) {
      console.error("Dictionary lookup exception:", e);
      return null;
    }
  }
};