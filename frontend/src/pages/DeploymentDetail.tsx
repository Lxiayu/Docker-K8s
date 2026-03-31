import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { deploymentApi, Deployment, PodInfo, EventInfo } from '@/services/deployment'
import {
  ArrowLeft,
  Rocket,
  RotateCcw,
  RefreshCw,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'

const environmentColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  dev: 'default',
  test: 'warning',
  prod: 'destructive',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  running: 'success',
  pending: 'secondary',
  failed: 'destructive',
  updating: 'warning',
  deploying: 'warning',
  rolling_back: 'warning',
}

const podStatusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  Running: 'success',
  Pending: 'secondary',
  Failed: 'destructive',
  CrashLoopBackOff: 'destructive',
  Error: 'destructive',
  Completed: 'outline',
  ContainerCreating: 'warning',
  Terminating: 'warning',
}

const eventTypeColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  Normal: 'success',
  Warning: 'warning',
}

export default function DeploymentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const deploymentId = Number(id)

  const [logsDialogOpen, setLogsDialogOpen] = useState(false)
  const [selectedPod, setSelectedPod] = useState<string>('')
  const [selectedContainer, setSelectedContainer] = useState<string>('')
  const [autoRefresh, setAutoRefresh] = useState(false)

  const { data: deployment, isLoading: loadingDeployment } = useQuery<Deployment>(
    ['deployment', deploymentId],
    () => deploymentApi.get(deploymentId),
    { enabled: !!deploymentId }
  )

  const { data: pods, isLoading: loadingPods, refetch: refetchPods } = useQuery<PodInfo[]>(
    ['deployment-pods', deploymentId],
    () => deploymentApi.pods(deploymentId),
    { enabled: !!deploymentId }
  )

  const { data: events, isLoading: loadingEvents } = useQuery<EventInfo[]>(
    ['deployment-events', deploymentId],
    () => deploymentApi.events(deploymentId),
    { enabled: !!deploymentId }
  )

  const { data: containers } = useQuery<string[]>(
    ['pod-containers', deploymentId, selectedPod],
    () => deploymentApi.podContainers(deploymentId, selectedPod),
    { enabled: !!deploymentId && !!selectedPod }
  )

  const { data: logs, isLoading: loadingLogs, refetch: refetchLogs } = useQuery<{ logs: string }>(
    ['pod-logs', deploymentId, selectedPod, selectedContainer],
    () => deploymentApi.podLogs(deploymentId, { pod: selectedPod, container: selectedContainer, tail_lines: 500 }),
    { enabled: !!deploymentId && !!selectedPod && logsDialogOpen }
  )

  const deployMutation = useMutation(() => deploymentApi.deploy(deploymentId), {
    onSuccess: () => {
      toast.success('部署已启动')
      queryClient.invalidateQueries(['deployment', deploymentId])
      queryClient.invalidateQueries(['deployment-pods', deploymentId])
      queryClient.invalidateQueries(['deployment-events', deploymentId])
    },
    onError: () => {
      toast.error('部署失败')
    },
  })

  const rollbackMutation = useMutation(() => deploymentApi.rollback(deploymentId, {}), {
    onSuccess: () => {
      toast.success('回滚已启动')
      queryClient.invalidateQueries(['deployment', deploymentId])
      queryClient.invalidateQueries(['deployment-pods', deploymentId])
      queryClient.invalidateQueries(['deployment-events', deploymentId])
    },
    onError: () => {
      toast.error('回滚失败')
    },
  })

  useEffect(() => {
    if (containers && containers.length > 0 && !selectedContainer) {
      setSelectedContainer(containers[0])
    }
  }, [containers, selectedContainer])

  useEffect(() => {
    if (!autoRefresh || !logsDialogOpen) return

    const interval = setInterval(() => {
      refetchLogs()
    }, 3000)

    return () => clearInterval(interval)
  }, [autoRefresh, logsDialogOpen, refetchLogs])

  const handleViewLogs = (podName: string) => {
    setSelectedPod(podName)
    setSelectedContainer('')
    setLogsDialogOpen(true)
  }

  const handleDeploy = () => {
    deployMutation.mutate()
  }

  const handleRollback = () => {
    rollbackMutation.mutate()
  }

  if (loadingDeployment) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!deployment) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">部署不存在</p>
        <Button variant="outline" onClick={() => navigate('/deployments')}>
          返回列表
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/deployments')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{deployment.name}</h1>
            <p className="text-muted-foreground">{deployment.namespace}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDeploy}
            disabled={deployMutation.isLoading || deployment.status === 'deploying'}
          >
            {deployMutation.isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="mr-2 h-4 w-4" />
            )}
            部署
          </Button>
          <Button
            variant="outline"
            onClick={handleRollback}
            disabled={rollbackMutation.isLoading || deployment.status === 'rolling_back'}
          >
            {rollbackMutation.isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            回滚
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              refetchPods()
              queryClient.invalidateQueries(['deployment-events', deploymentId])
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">镜像</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs font-medium truncate" title={deployment.image}>
              {deployment.image}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">副本数</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{deployment.replicas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">环境</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={environmentColors[deployment.environment] || 'default'}>
              {deployment.environment.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">状态</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={statusVariants[deployment.status] || 'default'}>
              {deployment.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pods" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pods">Pods</TabsTrigger>
          <TabsTrigger value="events">事件</TabsTrigger>
        </TabsList>

        <TabsContent value="pods">
          <Card>
            <CardHeader>
              <CardTitle>Pod 列表</CardTitle>
              <CardDescription>此部署关联的所有 Pod</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPods ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !pods || pods.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无 Pod
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pod 名称</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>Ready</TableHead>
                      <TableHead>CPU</TableHead>
                      <TableHead>内存</TableHead>
                      <TableHead>重启次数</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead className="w-[100px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pods.map((pod) => (
                      <TableRow key={pod.name}>
                        <TableCell className="font-medium">{pod.name}</TableCell>
                        <TableCell>
                          <Badge variant={podStatusColors[pod.status] || 'default'}>
                            {pod.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{pod.ready}</TableCell>
                        <TableCell>{pod.cpu || '-'}</TableCell>
                        <TableCell>{pod.memory || '-'}</TableCell>
                        <TableCell>{pod.restarts}</TableCell>
                        <TableCell>{pod.age}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewLogs(pod.name)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            日志
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>事件列表</CardTitle>
              <CardDescription>Kubernetes 事件记录</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !events || events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无事件
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">类型</TableHead>
                      <TableHead className="w-[120px]">原因</TableHead>
                      <TableHead>消息</TableHead>
                      <TableHead className="w-[80px]">次数</TableHead>
                      <TableHead className="w-[100px]">Age</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant={eventTypeColors[event.type] || 'default'}>
                            {event.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{event.reason}</TableCell>
                        <TableCell className="max-w-[400px] truncate" title={event.message}>
                          {event.message}
                        </TableCell>
                        <TableCell>{event.count}</TableCell>
                        <TableCell>{event.age}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Pod 日志</DialogTitle>
            <DialogDescription>
              查看 Pod 容器日志
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-sm font-medium">Pod</Label>
                <Select value={selectedPod} onValueChange={setSelectedPod}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择 Pod" />
                  </SelectTrigger>
                  <SelectContent>
                    {pods?.map((pod) => (
                      <SelectItem key={pod.name} value={pod.name}>
                        {pod.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-sm font-medium">容器</Label>
                <Select value={selectedContainer} onValueChange={setSelectedContainer}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择容器" />
                  </SelectTrigger>
                  <SelectContent>
                    {containers?.map((container) => (
                      <SelectItem key={container} value={container}>
                        {container}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label htmlFor="auto-refresh" className="text-sm">
                  自动刷新
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchLogs()}
                disabled={loadingLogs}
              >
                {loadingLogs ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="bg-muted rounded-md p-4 h-[400px] overflow-auto">
              {loadingLogs ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : logs?.logs ? (
                <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                  {logs.logs}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  暂无日志
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
