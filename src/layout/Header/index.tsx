import { useNavigate } from '@tanstack/react-router'
import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Button, Layout, Space } from 'antd'
import { ThemeModeToggle } from '@/components/ThemeModeToggle'
import { useAuthStore } from '@/store/useAuthStore'
import styles from './Header.module.less'

const { Header } = Layout

type LayoutHeaderProps = {
  darkMode?: boolean
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

export function LayoutHeader({ darkMode, collapsed, onCollapse }: LayoutHeaderProps) {
  const navigate = useNavigate()
  const userInfo = useAuthStore((state) => state.userInfo)
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    void navigate({ to: '/login', replace: true })
  }

  return (
    <Header className={darkMode ? `${styles.header} ${styles.dark}` : styles.header}>
      <div className={styles.left}>
        <span
          className={styles.collapseBtn}
          onClick={() => onCollapse?.(!collapsed)}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </span>
      </div>

      <Space size={12} className={styles.right}>
        <ThemeModeToggle size="middle" variant="header" />
        <div className={styles.user}>
          <span className={styles.avatar}>
            {userInfo?.displayName?.slice(0, 1).toUpperCase() || 'A'}
          </span>
          <span className={styles.userName}>{userInfo?.displayName}</span>
        </div>
        <Button
          aria-label="退出登录"
          title="退出登录"
          shape="circle"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
        />
      </Space>
    </Header>
  )
}
