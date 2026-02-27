import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' 
import federation from '@originjs/vite-plugin-federation'
 
export default defineConfig({
  plugins: [
    react(),
    federation({ 
      name: 'shellApp',
      remotes: {
        authApp: 'http://localhost:5001/assets/remoteEntry.js',
        contestApp: 'http://localhost:5002/assets/remoteEntry.js',
        remoteApp1: 'http://192.168.0.136:5003/assets/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, eager: true },
        'react-dom': { singleton: true, eager: true },
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
  },
  server: {
    port: 5000,
    strictPort: true,
    cors: true,
  },
})