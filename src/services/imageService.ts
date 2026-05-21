export const imageService = {
  async generateImage(prompt: string, subject: string): Promise<string> {
    try {
      // We combine the subject and prompt to get better results from the AI
      const enhancedPrompt = `Educational ${subject} visual: ${prompt}, highly detailed, clear, school textbook style`;

      const response = await fetch('http://localhost:8000/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: enhancedPrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      // The Python backend sends back a physical file, so we read it as a "Blob"
      const imageBlob = await response.blob();
      
      // We convert that file into a URL that an <img src="..."> tag can read!
      return URL.createObjectURL(imageBlob);
      
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }
  }
};