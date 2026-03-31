import { useState } from 'react'
import { useQuery } from 'react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TimeRangeSelector } from '@/components/ui/time-range-selector'
import { LineChartComponent } from '@/components/charts/LineChartComponent'
import { BarChartComponent } from '@/components/charts/BarChartComponent'
import { PieChartComponent } from '@/components/charts/PieChartComponent'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  GitBranch,
  Rocket,
  Activity,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { dashboardApi, TimeRange } from '@/services/dashboard'

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('7days')

  const timeRangeToApiRange = (range: string): TimeRange => {
    switch (range) {
      case '7days':
        return '7d'
      case '30days':
        return '30d'
      case '90days':
        return '90d'
      default:
        return '7d'
    }
  }

  const { data: stats, isLoading, isError, error } = useQuery(
    ['dashboardStats', timeRange],
    () => dashboardApi.getStats(timeRangeToApiRange(timeRange)),
    {
      keepPreviousData: true,
    }
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
      success: 'success',
      failed: 'destructive',
      running: 'default',
      pending: 'secondary',
    }
    const icons: Record<string, React.ReactNode> = {
      success: <CheckCircle className="h-3 w-3" />,
      failed: <XCircle className="h-3 w-3" />,
      running: <Loader2 className="h-3 w-3 animate-spin" />,
      pending: <Clock className="h-3 w-3" />,
    }
    return (
      <Badge variant={variants[status] || 'outline'} className="flex items-center gap-1">
        {icons[status]}
        {status === 'success' ? '成功' : status === 'failed' ? '失败' : status === 'running' ? '运行中' : '等待中'}
      </Badge>
    )
  }

  const renderTrend = (trend: number, label: string = '较上周') => {
    const isPositive = trend >= 0
    return (
      <div className="flex items-center text-xs text-muted-foreground mt-1">
        {isPositive ? (
          <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
        )}
        <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
          {isPositive ? '+' : ''}{trend}%
        </span>
        <span className="ml-1">{label}</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">加载失败</h3>
          <p className="text-muted-foreground mt-1">
            {(error as Error)?.message || '无法加载数据看板数据'}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            重新加载
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">数据看板</h1>
          <p className="text-muted-foreground mt-1">
            CI/CD 平台运行状态概览
          </p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总构建次数</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32 mt-2" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.total_builds.toLocaleString() || 0}
                </div>
                {renderTrend(stats?.builds_trend || 0)}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">部署次数</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32 mt-2" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.total_deployments.toLocaleString() || 0}
                </div>
                {renderTrend(stats?.deployments_trend || 0)}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32 mt-2" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.success_rate.toFixed(1) || 0}%
                </div>
                {renderTrend(stats?.success_rate_trend || 0)}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32 mt-2" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.active_users || 0}
                </div>
                {renderTrend(stats?.active_users_trend || 0)}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[350px] w-full" />
              </CardContent>
            </Card>
          ) : (
            <LineChartComponent
              title="构建趋势"
              data={stats?.build_trend || []}
              lines={[
                { dataKey: 'success', stroke: '#10b981', name: '成功' },
                { dataKey: 'failed', stroke: '#ef4444', name: '失败' },
              ]}
              height={350}
            />
          )}
        </div>
        <div className="lg:col-span-3">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[350px] w-full" />
              </CardContent>
            </Card>
          ) : (
            <PieChartComponent
              title="环境部署分布"
              data={stats?.deploy_distribution || []}
              height={350}
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ) : (
            <BarChartComponent
              title="资源使用情况"
              data={[
                { name: 'CPU', 使用率: stats?.resource_usage?.cpu_avg || 0 },
                { name: '内存', 使用率: stats?.resource_usage?.memory_avg || 0 },
              ]}
              bars={[
                { dataKey: '使用率', fill: '#3b82f6', name: '使用率 (%)' },
              ]}
              height={300}
            />
          )}
        </div>
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">最近流水线</CardTitle>
              <CardDescription>最近的构建任务状态</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>耗时</TableHead>
                      <TableHead>时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.recent_pipelines && stats.recent_pipelines.length > 0 ? (
                      stats.recent_pipelines.map((pipeline) => (
                        <TableRow key={pipeline.id}>
                          <TableCell className="font-medium">{pipeline.name}</TableCell>
                          <TableCell>{getStatusBadge(pipeline.status)}</TableCell>
                          <TableCell>{pipeline.duration}</TableCell>
                          <TableCell className="text-muted-foreground text-sm flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {pipeline.time}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              待处理告警
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <div className="text-3xl font-bold text-yellow-500">
                {stats?.pending_alerts || 0}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              需要立即关注的告警
            </p>
            <Button variant="outline" size="sm" className="mt-3">
              查看详情
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              运行中任务
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <div className="text-3xl font-bold text-blue-500">
                {stats?.running_tasks || 0}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              正在执行的任务
            </p>
            <Button variant="outline" size="sm" className="mt-3">
              查看详情
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              今日完成
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <div className="text-3xl font-bold text-green-500">
                {stats?.completed_today || 0}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              今日完成的构建
            </p>
            <Button variant="outline" size="sm" className="mt-3">
              查看详情
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
