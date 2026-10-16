import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the build works on GitHub Pages under /<repo>/ and when opened locally.
export default defineConfig({
  base: './',
  plugins: [react()],
  // build date, sent with feedback so reports can be matched to a release
  define: { __APP_VERSION__: JSON.stringify(new Date().toISOString().slice(0, 10)) },
})
