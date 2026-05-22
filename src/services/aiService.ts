const BACKEND_URL = "https://gyanamitra.onrender.com"; 

const SYSTEM_INSTRUCTION = `You are GyanMitra AI, a brilliant and friendly educational assistant. 
Your primary users are school students in grades 6 to 10. Always explain concepts simply, use fun analogies, and keep a supportive tone. 
However, if the user identifies themselves as a teacher, admin, or professional, instantly switch to a highly professional, advanced, and technical tone to assist them with pedagogy and deep research.`;

export const aiService = {
  async sendMessage(chatHistory: { role: 'user' | 'model'; text: string }[], currentInput: any) {
    try {
      const formattedContents = chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
      formattedContents.push({ role: 'user', parts: [{ text: currentInput.text }] });

      const response = await fetch(`${BACKEND_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formattedContents: formattedContents,
          systemInstruction: SYSTEM_INSTRUCTION
        })
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        console.error("🔴 Server Error:", response.status, errorDetails);
        throw new Error(`Backend Error ${response.status}`);
      }

      const data = await response.json();
      return data.text;

    } catch (error) {
      console.error("🔴 Connection error:", error);
      return "Unable to synchronize with AI Node. Is the Python server running?";
    }
  }
};