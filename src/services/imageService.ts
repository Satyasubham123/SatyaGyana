const BACKEND_URL = "https://SatyaGyana.onrender.com";

export const imageService = {
  generateImage: async (prompt: string, subject: string): Promise<string> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt, subject: subject }), 
      });

      if (!response.ok) throw new Error('Failed to generate image');
      
      const data = await response.json();
      return data.image_url; 
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }
};