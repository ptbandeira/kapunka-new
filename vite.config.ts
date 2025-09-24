// vite.config.ts
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isNetlifyDev = !!process.env.NETLIFY || process.env.NETLIFY_DEV === 'true';

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    server: {
      // expose to the Netlify proxy
      host: true,

      // easiest: no host checks in Netlify Dev boxes
      allowedHosts: isNetlifyDev ? true : [
        'devserver-preview--kapunka-new.netlify.app',
        'devserver-main--kapunka-new.netlify.app'
      ]
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, '.') }
    }
  };
});
