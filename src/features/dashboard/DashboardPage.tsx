import { Card, Space, Typography } from 'antd'
import { useAuthStore } from '@/store/useAuthStore'
import styles from './DashboardPage.module.less'

export function DashboardPage() {
  const userInfo = useAuthStore((state) => state.userInfo)

  return (
    <main className={styles.dashboardPage}>
      <Card title="登录状态">
        <Space orientation="vertical" size={8}>
          <Typography.Text>用户：{userInfo?.username}</Typography.Text>
          <Typography.Text type="secondary">
            登录信息已通过 Zustand store 保存。
          </Typography.Text>
        </Space>
      </Card>
    </main>
  )
}
