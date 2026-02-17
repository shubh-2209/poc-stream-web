// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'
// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(),tailwindcss(),],
// })

import { defineConfig } from 'vite'
 
import react from '@vitejs/plugin-react'
 
import tailwindcss from '@tailwindcss/vite'
 
import mkcert from 'vite-plugin-mkcert'
 
export default defineConfig({
 
  plugins: [
 
    react(),
 
    tailwindcss(),
 
    mkcert()
 
  ],
 
  server: {
 
    host: true 
 
  }
 
})
 
 
//export default defineConfig({   server: {     https: false,  // ← remove SSL from Vite     host: "0.0.0.0",     port: 5173,   } })
// import { defineConfig } from 'vite'
// import mkcert from 'vite-plugin-mkcert'
// export default defineConfig({
//   plugins: [mkcert()],
//   server: {
//     https: true  }
// })