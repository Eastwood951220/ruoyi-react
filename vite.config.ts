import { defineConfig } from 'vite'
import autoprefixer from 'autoprefixer'
import path from 'path'
import createPlugins from './vite/plugins'

export default defineConfig({
  plugins: createPlugins(),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  server: {
    host: '0.0.0.0',
    open: true,
    proxy: {
      '/dev-api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (proxyPath) => proxyPath.replace(/^\/dev-api/, ''),
      },
    },
  },
  css: {
    postcss: {
      plugins: [
        autoprefixer(),
      ],
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router',
      '@tanstack/react-router',
      '@tanstack/react-query',
      'zustand',
      'axios',
      'antd',
      '@ant-design/icons',
      'lodash',
      'dayjs',
    ],
  },
})
