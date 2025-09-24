import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const isNetlifyDev = !!process.env.NETLIFY || process.env.NETLIFY_DEV === "true";

  return {
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: { "@": path.resolve(__dirname, ".") }
    },
    server: {
      host: true,                 // accept requests from Netlify's proxy
      port: 5173,
      strictPort: true,
      allowedHosts: isNetlifyDev
        ? true                    // disable host check inside Netlify dev/preview box
        : [
            "localhost",
            "127.0.0.1",
            "devserver-main--kapunka-new.netlify.app",
            "devserver-preview--kapunka-new.netlify.app"
          ],
      hmr: { protocol: "wss", clientPort: 443 } // reliable HMR behind Netlify proxy
    }
  };
});
