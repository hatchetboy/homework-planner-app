import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { config as loadDotenv } from 'dotenv'
import { execSync } from 'child_process'

loadDotenv(); // ensures .env is loaded into process.env at config time

const MAJOR_VERSION = 1;
const buildNumber = process.env.VITE_APP_BUILD_NUMBER
    ?? (() => { try { return execSync('git rev-list --count HEAD').toString().trim(); } catch { return '0'; } })();

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
