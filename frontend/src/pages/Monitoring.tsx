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
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Plus,
} from 'lucide-react'
import { monitoringApi, Alert, AlertRule, Metric, CreateAlertRuleParams } from '@/services/monitoring'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/ui/pagination'

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

function MetricCard({ name, value, color }: { name: string; value: string; color?: string }) {
  const colorClass = color || 'text-blue-500'
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

function getMetricColor(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('error') || lower.includes('错误') || lower.includes('失败')) return 'text-red-500'
  if (lower.includes('success') || lower.includes('成功')) return 'text-green-500'
  if (lower.includes('response') || lower.includes('延迟') || lower.includes('响应')) return 'text-yellow-500'
  if (lower.includes('pipeline') || lower.includes('流水线') || lower.includes('活跃')) return 'text-blue-500'
  return 'text-blue-500'
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
  onEdit,
  isLoading,
}: {
  rule: AlertRule
  onToggle: (id: number, enabled: boolean) => void
  onEdit: (rule: AlertRule) => void
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
        <Button variant="ghost" size="sm" onClick={() => onEdit(rule)}>
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
  const [alertPage, setAlertPage] = useState(1)
  const alertPageSize = 10
  const queryClient = useQueryClient()

  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null)
  const [ruleForm, setRuleForm] = useState<CreateAlertRuleParams>({
    name: '',
    query: '',
    duration: '5m',
    severity: 'warning',
    description: '',
    enabled: true,
  })

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

  const createRuleMutation = useMutation(monitoringApi.createAlertRule, {
    onSuccess: () => {
      toast.success('告警规则已创建')
      queryClient.invalidateQueries(['monitoring', 'alertRules'])
      setRuleDialogOpen(false)
      resetRuleForm()
    },
    onError: () => {
      toast.error('创建失败')
    },
  })

  const updateRuleMutation = useMutation(
    ({ id, data }: { id: number; data: CreateAlertRuleParams }) =>
      monitoringApi.updateAlertRule(id, data),
    {
      onSuccess: () => {
        toast.success('告警规则已更新')
        queryClient.invalidateQueries(['monitoring', 'alertRules'])
        setRuleDialogOpen(false)
        resetRuleForm()
      },
      onError: () => {
        toast.error('更新失败')
      },
    }
  )

  const resetRuleForm = () => {
    setRuleForm({
      name: '',
      query: '',
      duration: '5m',
      severity: 'warning',
      description: '',
      enabled: true,
    })
    setEditingRule(null)
  }

  const handleCreateRule = () => {
    resetRuleForm()
    setEditingRule(null)
    setRuleDialogOpen(true)
  }

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule)
    setRuleForm({
      name: rule.name,
      query: rule.condition || '',
      duration: '5m',
      severity: 'warning',
      description: '',
      enabled: rule.enabled,
    })
    setRuleDialogOpen(true)
  }

  const handleSaveRule = () => {
    if (!ruleForm.name.trim()) {
      toast.error('请输入规则名称')
      return
    }
    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data: ruleForm })
    } else {
      createRuleMutation.mutate(ruleForm)
    }
  }

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

  const alertTotalPages = Math.ceil(filteredAlerts.length / alertPageSize)
  const paginatedAlerts = filteredAlerts.slice(
    (alertPage - 1) * alertPageSize,
    alertPage * alertPageSize
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="监控告警"
        description="系统监控与告警管理"
        actions={
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
        }
      />

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
                <Select value={severityFilter} onValueChange={(value) => { setSeverityFilter(value); setAlertPage(1); }}>
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
                    onChange={(e) => { setSearchQuery(e.target.value); setAlertPage(1); }}
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
                  ) : paginatedAlerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        暂无告警
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAlerts.map((alert) => (
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
              {alertTotalPages > 1 && (
                <Pagination
                  page={alertPage}
                  totalPages={alertTotalPages}
                  total={filteredAlerts.length}
                  pageSize={alertPageSize}
                  onPageChange={setAlertPage}
                />
              )}
            </TabsContent>

            <TabsContent value="metrics">
              {metricsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-4">
                  {(metricsData?.metrics || []).map((metric: Metric, index: number) => (
                    <MetricCard
                      key={index}
                      name={metric.name}
                      value={metric.value}
                      color={getMetricColor(metric.name)}
                    />
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>告警规则配置</CardTitle>
                  <Button size="sm" onClick={handleCreateRule}>
                    <Plus className="h-4 w-4 mr-2" />
                    新建规则
                  </Button>
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
                        onEdit={handleEditRule}
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

      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingRule ? '编辑告警规则' : '新建告警规则'}</DialogTitle>
            <DialogDescription>
              配置告警规则的详细参数
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rule-name">规则名称</Label>
              <Input
                id="rule-name"
                placeholder="例如: CPU使用率过高"
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rule-query">PromQL 表达式</Label>
              <Input
                id="rule-query"
                placeholder="例如: cpu_usage > 80"
                value={ruleForm.query}
                onChange={(e) => setRuleForm({ ...ruleForm, query: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="rule-duration">持续时间</Label>
                <Input
                  id="rule-duration"
                  placeholder="5m"
                  value={ruleForm.duration}
                  onChange={(e) => setRuleForm({ ...ruleForm, duration: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rule-severity">严重程度</Label>
                <Select
                  value={ruleForm.severity}
                  onValueChange={(value) => setRuleForm({ ...ruleForm, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择严重程度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">警告</SelectItem>
                    <SelectItem value="critical">严重</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rule-description">描述</Label>
              <Input
                id="rule-description"
                placeholder="规则描述"
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="rule-enabled"
                checked={ruleForm.enabled}
                onCheckedChange={(checked) => setRuleForm({ ...ruleForm, enabled: checked })}
              />
              <Label htmlFor="rule-enabled">启用规则</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRuleDialogOpen(false); resetRuleForm(); }}>
              取消
            </Button>
            <Button
              onClick={handleSaveRule}
              disabled={createRuleMutation.isLoading || updateRuleMutation.isLoading}
            >
              {(createRuleMutation.isLoading || updateRuleMutation.isLoading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingRule ? '更新' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
