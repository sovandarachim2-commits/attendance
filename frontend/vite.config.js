import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const frontendDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(frontendDir, '..')

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')
  const certPath = path.join(frontendDir, 'cert.pem')
  const keyPath = path.join(frontendDir, 'key.pem')
  const lanIp = env.DEV_LAN_IP?.trim() || ''
  const hasHttps = env.DEV_HTTPS === 'true' && fs.existsSync(certPath) && fs.existsSync(keyPath)

  return {
    envDir: rootDir,
    cacheDir: '../.vite-cache',
    plugins: [react(), tailwindcss()],
    server: {
      host: '0.0.0.0',
      port: 5174,
      strictPort: true,
      ...(hasHttps ? {
        https: {
          cert: fs.readFileSync(certPath),
          key: fs.readFileSync(keyPath),
        },
      } : {}),
      hmr: lanIp ? {
        host: lanIp,
        port: 5174,
        protocol: hasHttps ? 'wss' : 'ws',
        clientPort: 5174,
      } : {
        protocol: hasHttps ? 'wss' : 'ws',
        clientPort: 5174,
      },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          xfwd: true,
        },
      },
    },
  }
})
