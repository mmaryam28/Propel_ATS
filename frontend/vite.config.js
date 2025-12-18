import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: (() => {
      const target = process.env.VITE_API_URL || 'https://cs490-backend.onrender.com';
      return {
        '/auth': target,
        '/applications': target,
      };
    })(),
  }
})
