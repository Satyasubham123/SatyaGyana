export const imageService = {
  async generateImage(prompt: string, subject: string): Promise<string> {
    try {
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

      // 🚀 UPDATED: We now read the Firebase URL directly from the JSON response!
      const data = await response.json();
      return data.image_url;
      
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }
  }
};