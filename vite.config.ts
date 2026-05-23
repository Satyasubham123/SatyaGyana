import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Vite automatically includes variables starting with VITE_
  // We don't need manual loading if we keep the VITE_ prefix.
  envPrefix: 'VITE_'
});