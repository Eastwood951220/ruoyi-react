import AutoImport from 'unplugin-auto-import/vite'
import path from 'path'

export default function createAutoImport() {
  return AutoImport({
    imports: [
      'react',
      {
        '@tanstack/react-router': [
          'useNavigate',
          'useRouterState',
          'useParams',
          'useSearch',
          'useMatch',
          'Link',
          'Outlet',
        ],
        zustand: ['create'],
      },
    ],
    eslintrc: {
      enabled: true,
      filepath: path.resolve(__dirname, '../../.eslintrc-auto-import.json'),
      globalsPropValue: true,
    },
    dts: path.resolve(__dirname, '../../src/types/auto-imports.d.ts'),
  })
}
