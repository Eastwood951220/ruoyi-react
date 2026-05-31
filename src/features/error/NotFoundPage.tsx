import { Button, Result } from 'antd'
import { useNavigate } from '@tanstack/react-router'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center h-full">
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在。"
        extra={
          <Button type="primary" onClick={() => void navigate({ to: '/' })}>
            返回首页
          </Button>
        }
      />
    </div>
  )
}
