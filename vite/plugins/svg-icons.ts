import path from 'path'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons-ng'

export default function createSvgIconsPluginConfig() {
  return createSvgIconsPlugin({
    iconDirs: [path.resolve(process.cwd(), 'src/assets/icons/svg')],
    symbolId: 'icon-[dir]-[name]',
  })
}
