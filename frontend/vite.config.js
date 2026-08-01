import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Local `npm run dev` → base `/` (unchanged)
// Production `npm run build` → base `/bookworm/` for Hostinger
export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  base: mode === 'production' ? '/bookworm/' : '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
  },
}))
