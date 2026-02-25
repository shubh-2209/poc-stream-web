import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "auth_app",
      filename: "remoteEntry.js",   // Ye file generate hogi
      exposes: {
        "./AuthPage": "./src/App.jsx",  // Jo component expose karna hai
      },
      shared: ["react", "react-dom"]
    })
  ],
  server: { 
    port: 5175 
  }
});