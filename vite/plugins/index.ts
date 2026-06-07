import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import createAutoImport from './auto-import'
import createSvgIconsPluginConfig from './svg-icons'

export default function createPlugins() {
  return [
    tailwindcss(),
    react(),
    createAutoImport(),
    createSvgIconsPluginConfig(),
  ]
}
