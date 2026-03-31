import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Pencil,
  Ban,
  Loader2,
  Search,
} from 'lucide-react'
import { monitoringApi, Alert, AlertRule, Metric } from '@/services/monitoring'

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
}: {
  title: string
  value: number
  icon: React.ElementType
  iconColor: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${iconColor}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

function MetricCard({ name, value }: { name: string; value: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-blue-500">{value}</div>
      </CardContent>
    </Card>
  )
}

function InfoAlert({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string
  description: string
  actionLabel: string
  actionHref: string
}) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-blue-500" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">{title}</h3>
          <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">{description}</div>
        </div>
        <Button asChild size="sm">
          <a href={actionHref} target="_blank" rel="noopener noreferrer">
            {actionLabel}
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  )
}

function AlertRuleItem({
  rule,
  onToggle,
  isLoading,
}: {
  rule: AlertRule
  onToggle: (id: number, enabled: boolean) => void
  isLoading: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b py-4 last:border-0">
      <div className="flex-1">
        <div className="font-medium">{rule.name}</div>
        <div className="text-sm text-muted-foreground">条件: {rule.condition}</div>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant={rule.enabled ? 'success' : 'secondary'}>
          {rule.enabled ? '已启用' : '已禁用'}
        </Badge>
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle(rule.id, !rule.enabled)}
          disabled={isLoading}
        >
          <Ban className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function Monitoring() {
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery(
    ['monitoring', 'metrics'],
    () => monitoringApi.getMetrics(),
    { refetchInterval: 30000 }
  )

  const { data: alerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = useQuery(
    ['monitoring', 'alerts', severityFilter, searchQuery],
    () => monitoringApi.getAlerts({
      severity: severityFilter || undefined,
      search: searchQuery || undefined,
    }),
    { refetchInterval: 30000 }
  )

  const { data: alertRules = [], isLoading: rulesLoading, refetch: refetchRules } = useQuery(
    ['monitoring', 'alertRules'],
    () => monitoringApi.getAlertRules(),
    { refetchInterval: 30000 }
  )

  const acknowledgeMutation = useMutation(monitoringApi.acknowledgeAlert, {
    onSuccess: () => {
      toast.success('告警已确认')
      queryClient.invalidateQueries(['monitoring', 'alerts'])
      queryClient.invalidateQueries(['monitoring', 'metrics'])
    },
    onError: () => {
      toast.error('确认失败')
    },
  })

  const toggleRuleMutation = useMutation(
    ({ id, enabled }: { id: number; enabled: boolean }) =>
      monitoringApi.toggleAlertRule(id, enabled),
    {
      onSuccess: () => {
        toast.success('规则状态已更新')
        queryClient.invalidateQueries(['monitoring', 'alertRules'])
      },
      onError: () => {
        toast.error('更新失败')
      },
    }
  )

  const handleRefresh = () => {
    refetchMetrics()
    refetchAlerts()
    refetchRules()
    toast.success('数据已刷新')
  }

  const getSeverityBadge = (severity: Alert['severity']) => {
    const variants: Record<Alert['severity'], 'destructive' | 'warning' | 'secondary'> = {
      critical: 'destructive',
      warning: 'warning',
      info: 'secondary',
    }
    return (
      <Badge variant={variants[severity]}>
        {severity.toUpperCase()}
      </Badge>
    )
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter && alert.severity !== severityFilter) return false
    if (searchQuery && !alert.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !alert.message.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="总告警数"
          value={metricsData?.stats?.total || 0}
          icon={AlertTriangle}
          iconColor="text-yellow-500"
        />
        <StatCard
          title="严重告警"
          value={metricsData?.stats?.critical || 0}
          icon={AlertCircle}
          iconColor="text-red-500"
        />
        <StatCard
          title="警告告警"
          value={metricsData?.stats?.warning || 0}
          icon={AlertTriangle}
          iconColor="text-yellow-500"
        />
        <StatCard
          title="已处理"
          value={metricsData?.stats?.acknowledged || 0}
          icon={CheckCircle}
          iconColor="text-green-500"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="alerts">
            <TabsList>
              <TabsTrigger value="alerts">告警列表</TabsTrigger>
              <TabsTrigger value="metrics">监控指标</TabsTrigger>
              <TabsTrigger value="grafana">Grafana看板</TabsTrigger>
              <TabsTrigger value="rules">告警规则</TabsTrigger>
            </TabsList>

            <TabsContent value="alerts" className="space-y-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={handleRefresh}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  刷新
                </Button>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="全部级别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部级别</SelectItem>
                    <SelectItem value="critical">严重</SelectItem>
                    <SelectItem value="warning">警告</SelectItem>
                    <SelectItem value="info">信息</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索告警..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>告警名称</TableHead>
                    <TableHead>级别</TableHead>
                    <TableHead>消息</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filteredAlerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        暂无告警
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">{alert.name}</TableCell>
                        <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                        <TableCell>{alert.message}</TableCell>
                        <TableCell>{alert.time}</TableCell>
                        <TableCell>
                          <Badge variant={alert.acknowledged ? 'success' : 'secondary'}>
                            {alert.acknowledged ? '已处理' : '待处理'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            className="h-auto p-0"
                            onClick={() => acknowledgeMutation.mutate(alert.id)}
                            disabled={alert.acknowledged || acknowledgeMutation.isLoading}
                          >
                            {alert.acknowledged ? '已确认' : '处理'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="metrics">
              {metricsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-4">
                  {(metricsData?.metrics || []).map((metric: Metric, index: number) => (
                    <MetricCard key={index} name={metric.name} value={metric.value} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="grafana">
              <InfoAlert
                title="Grafana集成"
                description="请访问 http://grafana.local 查看完整的监控看板"
                actionLabel="打开Grafana"
                actionHref="http://grafana.local"
              />
            </TabsContent>

            <TabsContent value="rules">
              <Card>
                <CardHeader>
                  <CardTitle>告警规则配置</CardTitle>
                </CardHeader>
                <CardContent>
                  {rulesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : alertRules.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      暂无告警规则
                    </div>
                  ) : (
                    alertRules.map((rule) => (
                      <AlertRuleItem
                        key={rule.id}
                        rule={rule}
                        onToggle={(id, enabled) => toggleRuleMutation.mutate({ id, enabled })}
                        isLoading={toggleRuleMutation.isLoading}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
