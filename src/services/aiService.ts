const SYSTEM_INSTRUCTION = `You are GyanMitra AI, a brilliant and friendly educational assistant. 
Your primary users are school students in grades 6 to 10. Always explain concepts simply, use fun analogies, and keep a supportive tone. 
However, if the user identifies themselves as a teacher, admin, or professional, instantly switch to a highly professional, advanced, and technical tone to assist them with pedagogy and deep research.`;
export const aiService = {
  async sendMessage(chatHistory: { role: 'user' | 'model'; text: string }[], currentInput: any) {
    try {
      // 1. Format the chat history exactly like before
      const formattedContents = chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
      
      // Add the user's newest message
      formattedContents.push({ role: 'user', parts: [{ text: currentInput.text }] });

      // 2. We changed 127.0.0.1 to localhost to bypass Chrome's security block!
      const response = await fetch("https://gyanamitra.onrender.com/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formattedContents: formattedContents,
          systemInstruction: SYSTEM_INSTRUCTION
        })
      });

      // X-Ray Logging: If there is an error, this will print the EXACT reason.
      if (!response.ok) {
        const errorDetails = await response.text();
        console.error("🔴 Server rejected the request:", response.status, errorDetails);
        throw new Error(`Backend Error ${response.status}`);
      }

      // 3. Extract the text sent back by Python
      const data = await response.json();
      return data.text;

    } catch (error) {
      console.error("🔴 Connection error:", error);
      return "Unable to synchronize with AI Node. Is the Python server running?";
    }
  }
};