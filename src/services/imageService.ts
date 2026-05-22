const BACKEND_URL = "https://gyanamitra.onrender.com";

export const imageService = {
  generateImage: async (prompt: string, subject: string): Promise<string> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `A detailed educational diagram of ${subject}: ${prompt}` }), 
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        console.error("🔴 Server Error generating image:", response.status, errorDetails);
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      return data.image_url; 
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }
};