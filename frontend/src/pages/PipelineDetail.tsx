import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogFooter,
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
import { pipelineApi, Pipeline, Build } from '@/services/pipeline'
import {
  Play,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  GitBranch,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react'

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'success':
    case 'completed':
      return 'success'
    case 'failed':
    case 'error':
      return 'destructive'
    case 'running':
    case 'pending':
      return 'warning'
    default:
      return 'secondary'
  }
}

const getStatusText = (status: string) => {
  switch (status.toLowerCase()) {
    case 'success':
    case 'completed':
      return '成功'
    case 'failed':
    case 'error':
      return '失败'
    case 'running':
      return '运行中'
    case 'pending':
      return '等待中'
    default:
      return status
  }
}

const formatDuration = (seconds: number) => {
  if (!seconds) return '-'
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes === 0) return `${secs}秒`
  return `${minutes}分${secs}秒`
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const shortenCommit = (commit: string) => {
  if (!commit) return '-'
  return commit.substring(0, 8)
}

export default function PipelineDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false)
  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const [selectedBuild, setSelectedBuild] = useState<Build | null>(null)
  const [triggerBranch, setTriggerBranch] = useState('main')

  const pipelineId = Number(id)

  const { data: pipeline, isLoading: pipelineLoading } = useQuery<Pipeline>(
    ['pipeline', pipelineId],
    () => pipelineApi.get(pipelineId),
    { enabled: !!pipelineId }
  )

  const { data: buildsData, isLoading: buildsLoading } = useQuery(
    ['builds', pipelineId, page, pageSize],
    () => pipelineApi.listBuilds(pipelineId, { page, page_size: pageSize }),
    { enabled: !!pipelineId }
  )

  const { data: buildDetail, isLoading: logLoading } = useQuery<Build>(
    ['build', pipelineId, selectedBuild?.id],
    () => pipelineApi.getBuild(pipelineId, selectedBuild!.id),
    {
      enabled: !!selectedBuild && logDialogOpen,
      refetchInterval: selectedBuild?.status === 'running' ? 3000 : false,
    }
  )

  const triggerMutation = useMutation(
    () => pipelineApi.trigger(pipelineId, { branch: triggerBranch }),
    {
      onSuccess: () => {
        toast.success('构建已触发')
        queryClient.invalidateQueries(['builds', pipelineId])
        queryClient.invalidateQueries(['pipeline', pipelineId])
        setTriggerDialogOpen(false)
      },
      onError: () => {
        toast.error('触发构建失败')
      },
    }
  )

  const filteredBuilds = buildsData?.list?.filter((build) => {
    if (statusFilter === 'all') return true
    return build.status.toLowerCase() === statusFilter.toLowerCase()
  })

  const totalPages = Math.ceil((buildsData?.total || 0) / pageSize)

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  const handleViewLogs = (build: Build) => {
    setSelectedBuild(build)
    setLogDialogOpen(true)
  }

  const handleTriggerBuild = () => {
    triggerMutation.mutate(undefined)
  }

  if (pipelineLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!pipeline) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">流水线不存在</p>
        <Button variant="outline" onClick={() => navigate('/pipelines')}>
          返回列表
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/pipelines')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">{pipeline.name}</h1>
        <Badge variant={getStatusBadgeVariant(pipeline.status)}>
          {getStatusText(pipeline.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              仓库 ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipeline.repo_id}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <GitBranch className="h-4 w-4" />
              分支
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">main</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              最后构建
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {formatDate(pipeline.last_build_at)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              操作
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setTriggerDialogOpen(true)}>
              <Play className="h-4 w-4 mr-2" />
              触发构建
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>构建历史</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="success">成功</SelectItem>
                  <SelectItem value="failed">失败</SelectItem>
                  <SelectItem value="running">运行中</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">构建号</TableHead>
                  <TableHead>Commit</TableHead>
                  <TableHead>分支</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>耗时</TableHead>
                  <TableHead>开始时间</TableHead>
                  <TableHead className="w-[120px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buildsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredBuilds && filteredBuilds.length > 0 ? (
                  filteredBuilds.map((build) => (
                    <TableRow key={build.id}>
                      <TableCell className="font-medium">#{build.id}</TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-muted rounded text-sm">
                          {shortenCommit(build.commit_hash)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" />
                          {build.branch}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(build.status)}>
                          {getStatusText(build.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDuration(build.duration)}</TableCell>
                      <TableCell>{formatDate(build.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewLogs(build)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          日志
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      暂无构建记录
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {buildsData?.total ? (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>每页</span>
                <select
                  className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                <span>条</span>
                <span className="ml-4">共 {buildsData.total} 条</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  第 {page} / {totalPages || 1} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={triggerDialogOpen} onOpenChange={setTriggerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>触发新构建</DialogTitle>
            <DialogDescription>
              确定要为流水线「{pipeline.name}」触发新的构建吗？
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="branch">构建分支</Label>
              <Input
                id="branch"
                placeholder="请输入分支名称"
                value={triggerBranch}
                onChange={(e) => setTriggerBranch(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTriggerDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleTriggerBuild}
              disabled={triggerMutation.isLoading}
            >
              {triggerMutation.isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              确认触发
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              构建日志 #{selectedBuild?.id}
              {buildDetail?.status === 'running' && (
                <Badge variant="warning" className="animate-pulse">
                  运行中
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              分支: {selectedBuild?.branch} | Commit: {shortenCommit(selectedBuild?.commit_hash || '')}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 overflow-auto max-h-[60vh] bg-muted rounded-lg p-4">
            {logLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : buildDetail?.log ? (
              <pre className="text-sm font-mono whitespace-pre-wrap break-all">
                {buildDetail.log}
              </pre>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                暂无日志
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
