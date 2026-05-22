// Use the Render URL as the ultimate fallback so it never fails!
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://gyanamitra-backend.onrender.com';

export const imageService = {
  generateImage: async (prompt: string, subject: string): Promise<string> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // We combine the subject and prompt to give the AI better context!
        body: JSON.stringify({ prompt: `A detailed educational diagram of ${subject}: ${prompt}` }), 
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      return data.image_url; // This is the ImgBB 3-day link!
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }
};