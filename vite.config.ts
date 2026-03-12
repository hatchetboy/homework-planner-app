import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

const MAJOR_VERSION = 1;
const buildNumber = parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(`${MAJOR_VERSION}.${buildNumber}`),
  },
  server: {
    port: 5174,
    strictPort: true,
  }
})
