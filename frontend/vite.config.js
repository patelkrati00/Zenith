import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      "Content-Security-Policy":
        "default-src *; " +
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' *; " +
        "worker-src * blob:; " +
        "connect-src *; " +
        "img-src * data: blob:; " +
        "style-src * 'unsafe-inline'; " +
        "font-src * data:; " +
        "frame-src *; " +
        "child-src * blob:; " +
        "wasm-unsafe-eval;"
    },
  },
});

