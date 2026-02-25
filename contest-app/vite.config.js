import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "contest_app",
      filename: "remoteEntry.js",
      exposes: {
        "./ContestPage": "./src/App.jsx",
      },
      shared: ["react", "react-dom"]
    })
  ],
  server: { port: 5174 }
});