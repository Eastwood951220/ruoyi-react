import react from '@vitejs/plugin-react'
import createAutoImport from './auto-import'

export default function createPlugins() {
  return [
    react(),
    createAutoImport(),
  ]
}
