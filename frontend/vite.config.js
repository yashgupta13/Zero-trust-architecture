import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/receive-access-request': { target: 'http://localhost:5000', changeOrigin: true },
      '/receivePolicyConfigurations': { target: 'http://localhost:5000', changeOrigin: true },
      '/privilegedAccess': { target: 'http://localhost:5000', changeOrigin: true },
      '/approve_request': { target: 'http://localhost:5000', changeOrigin: true },
      '/approval_status': { target: 'http://localhost:5000', changeOrigin: true },
      '/resource-1': { target: 'http://localhost:5000', changeOrigin: true },
      '/resource-2': { target: 'http://localhost:5000', changeOrigin: true },
      '/login': { target: 'http://localhost:5000', changeOrigin: true },
      '/revokeToken': { target: 'http://localhost:5000', changeOrigin: true },
      '/hidden_resource': { target: 'http://localhost:5000', changeOrigin: true },
      '/enterSecretKey': { target: 'http://localhost:5000', changeOrigin: true },
    }
  }
})
