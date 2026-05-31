import { Button, Result } from 'antd'
import { useNavigate } from '@tanstack/react-router'

export default function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问此页面。"
        extra={
          <Button type="primary" onClick={() => void navigate({ to: '/' })}>
            返回首页
          </Button>
        }
      />
    </div>
  )
}
