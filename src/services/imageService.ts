export const imageService = {
  generateImage: async (prompt: string, subject: string): Promise<string> => {
    try {
      // 1. Create a detailed, optimized prompt
      const enhancedPrompt = `High resolution crisp educational vector graphic diagram of ${subject}, ${prompt}. Clean white background, highly detailed, sharp lines. Clear English labels.`;
      
      // 2. Encode for URL safety
      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      
      // 3. Use a random seed for variety
      const seed = Math.floor(Math.random() * 100000);
      
      // 4. Construct URL using the free 'turbo' model
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1024&height=1024&nologo=true&model=turbo`;

      // 5. Preload the image so the UI doesn't break
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(imageUrl);
        img.onerror = () => reject(new Error('Failed to generate image'));
        img.src = imageUrl;
      });

    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }
};