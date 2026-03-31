import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'

interface PageErrorProps {
  title?: string
  message?: string
  error?: Error
  onRetry?: () => void
  showBack?: boolean
}

export function PageError({
  title = '加载失败',
  message = '数据加载时发生了错误，请稍后重试。',
  error,
  onRetry,
  showBack = true,
}: PageErrorProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">{message}</p>
          {import.meta.env.DEV && error && (
            <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3">
              <p className="text-sm font-mono text-yellow-600 dark:text-yellow-400 break-all">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex gap-2 justify-center flex-wrap">
            {showBack && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回
              </Button>
            )}
            {onRetry && (
              <Button variant="outline" onClick={onRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                重试
              </Button>
            )}
            <Button onClick={handleReload}>刷新页面</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
