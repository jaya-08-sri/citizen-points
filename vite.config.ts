import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Send every /api request to the backend, so the browser sees one website.
    proxy: { "/api": "http://localhost:4000" },
  },
});
