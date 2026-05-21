const SYSTEM_INSTRUCTION = "You are GyanMitra AI, a helpful educational assistant for college students.";

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
      const response = await fetch("http://localhost:8000/ask", {
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