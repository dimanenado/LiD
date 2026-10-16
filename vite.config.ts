import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

const commit = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'dev'
  }
}

// Relative base so the build works on GitHub Pages under /<repo>/ and when opened locally.
export default defineConfig({
  base: './',
  plugins: [react()],
  // build date and commit, shown in About and sent with feedback so reports can be matched to a release
  define: { __APP_VERSION__: JSON.stringify(`${new Date().toISOString().slice(0, 10)} (${commit()})`) },
})
