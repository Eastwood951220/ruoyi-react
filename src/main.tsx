import 'virtual:svg-icons-register'
import { StrictMode } from 'react'
import { createRoot, type Root as ReactRoot } from 'react-dom/client'
import './styles/tailwind.css'
import 'antd/dist/reset.css'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

import './styles/view-transition.css'
import { Root } from './App'

declare global {
  interface Window {
    __reactAdminRoot?: ReactRoot
  }
}

const container = document.getElementById('root')!
const reactRoot = window.__reactAdminRoot ?? createRoot(container)

window.__reactAdminRoot = reactRoot

reactRoot.render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
