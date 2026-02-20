import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import mkcert from "vite-plugin-mkcert"

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    mode === "development" && mkcert(),
  ].filter(Boolean),

  server: {
    host: true,
  },
}))