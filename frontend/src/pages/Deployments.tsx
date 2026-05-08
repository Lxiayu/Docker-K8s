import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { deploymentApi, Deployment } from '@/services/deployment'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/ui/pagination'
import {
  Plus,
  Pencil,
  Trash2,
  Rocket,
  RotateCcw,
  FileText,
  Loader2,
} from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  loading?: boolean
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const deploymentSchema = z.object({
  name: z.string().min(1, '请输入名称'),
  namespace: z.string().min(1, '请输入命名空间'),
  image: z.string().min(1, '请输入镜像地址'),
  replicas: z.number().min(1, '副本数至少为1'),
  strategy: z.enum(['rolling', 'canary', 'blue-green']),
  environment: z.enum(['dev', 'test', 'prod']),
})

type DeploymentFormData = z.infer<typeof deploymentSchema>

const strategyText: Record<string, string> = {
  rolling: '滚动更新',
  canary: '灰度发布',
  'blue-green': '蓝绿部署',
}

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
}

const statusText: Record<string, string> = {
  running: '运行中',
  success: '成功',
  succeeded: '成功',
  failed: '失败',
  pending: '等待中',
  stopped: '已停止',
}

export default function Deployments() {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [environment, setEnvironment] = useState<string>('all')
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [editingDeployment, setEditingDeployment] = useState<Deployment | null>(null)
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null)

  const form = useForm<DeploymentFormData>({
    resolver: zodResolver(deploymentSchema),
    defaultValues: {
      name: '',
      namespace: '',
      image: '',
      replicas: 1,
      strategy: 'rolling',
      environment: 'dev',
    },
  })

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  })

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(
    ['deployments', page, pageSize, environment],
    () => deploymentApi.list({ page, page_size: pageSize, environment: environment === 'all' ? undefined : environment })
  )

  const createMutation = useMutation(deploymentApi.create, {
    onSuccess: () => {
      toast.success('创建成功')
      queryClient.invalidateQueries('deployments')
      setModalVisible(false)
      resetForm()
    },
    onError: () => {
      toast.error('创建失败')
    },
  })

  const deployMutation = useMutation(deploymentApi.deploy, {
    onSuccess: () => {
      toast.success('部署已启动')
      queryClient.invalidateQueries('deployments')
    },
    onError: () => {
      toast.error('部署失败')
    },
  })

  const rollbackMutation = useMutation(
    (id: number) => deploymentApi.rollback(id, {}),
    {
      onSuccess: () => {
        toast.success('回滚已启动')
        queryClient.invalidateQueries('deployments')
      },
      onError: () => {
        toast.error('回滚失败')
      },
    }
  )

  const deleteMutation = useMutation(deploymentApi.delete, {
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries('deployments')
    },
    onError: () => {
      toast.error('删除失败')
    },
  })

  const updateMutation = useMutation(
    (params: { id: number; data: Partial<Deployment> }) =>
      deploymentApi.update(params.id, params.data),
    {
      onSuccess: () => {
        toast.success('更新成功')
        queryClient.invalidateQueries('deployments')
        setModalVisible(false)
        resetForm()
      },
      onError: () => {
        toast.error('更新失败')
      },
    }
  )

  const resetForm = () => {
    form.reset({
      name: '',
      namespace: '',
      image: '',
      replicas: 1,
      strategy: 'rolling',
      environment: 'dev',
    })
    setEditingDeployment(null)
  }

  const handleCreate = () => {
    resetForm()
    setModalVisible(true)
  }

  const handleEdit = (record: Deployment) => {
    setEditingDeployment(record)
    form.reset({
      name: record.name,
      namespace: record.namespace,
      image: record.image,
      replicas: record.replicas,
      strategy: record.strategy || 'rolling',
      environment: record.environment,
    })
    setModalVisible(true)
  }

  const handleDelete = (id: number) => {
    setConfirmDialog({
      open: true,
      title: '确认删除',
      description: '确定要删除这个部署吗？此操作不可撤销。',
      onConfirm: () => {
        deleteMutation.mutate(id)
        setConfirmDialog((prev) => ({ ...prev, open: false }))
      },
    })
  }

  const handleDeploy = (id: number) => {
    setConfirmDialog({
      open: true,
      title: '确认部署',
      description: '确定要执行部署吗？',
      onConfirm: () => {
        deployMutation.mutate(id)
        setConfirmDialog((prev) => ({ ...prev, open: false }))
      },
    })
  }

  const handleRollback = (id: number) => {
    setConfirmDialog({
      open: true,
      title: '确认回滚',
      description: '确定要回滚到上一个版本吗？',
      onConfirm: () => {
        rollbackMutation.mutate(id)
        setConfirmDialog((prev) => ({ ...prev, open: false }))
      },
    })
  }

  const handleViewDetail = (record: Deployment) => {
    setSelectedDeployment(record)
    setDetailVisible(true)
  }

  const onFormSubmit = (data: DeploymentFormData) => {
    if (editingDeployment) {
      updateMutation.mutate({
        id: editingDeployment.id,
        data,
      })
    } else {
      createMutation.mutate(data)
    }
  }

  const totalPages = Math.ceil((data?.total || 0) / pageSize)

  return (
    <div className="space-y-4">
      <PageHeader
        title="部署管理"
        actions={
          <>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              创建部署
            </Button>
            <Select value={environment} onValueChange={setEnvironment}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="选择环境" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部环境</SelectItem>
                <SelectItem value="dev">开发环境</SelectItem>
                <SelectItem value="test">测试环境</SelectItem>
                <SelectItem value="prod">生产环境</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>命名空间</TableHead>
              <TableHead>镜像</TableHead>
              <TableHead className="w-[80px]">副本数</TableHead>
              <TableHead>策略</TableHead>
              <TableHead>环境</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-[300px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : (data?.list || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              (data?.list || []).map((record: Deployment) => (
                <TableRow key={record.id}>
                  <TableCell>{record.id}</TableCell>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell>{record.namespace}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={record.image}>
                    {record.image}
                  </TableCell>
                  <TableCell>{record.replicas}</TableCell>
                  <TableCell>{strategyText[record.strategy || 'rolling'] || record.strategy}</TableCell>
                  <TableCell>
                    <Badge variant={environmentColors[record.environment] || 'default'}>
                      {record.environment.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[record.status] || 'default'}>
                      {statusText[record.status] || record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeploy(record.id)}
                        disabled={deployMutation.isLoading}
                      >
                        <Rocket className="h-4 w-4 mr-1" />
                        部署
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRollback(record.id)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        回滚
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(record)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        详情
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(record)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(record.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={data?.total || 0}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}

      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingDeployment ? '编辑部署' : '创建部署'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                placeholder="应用名称"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="namespace">命名空间</Label>
              <Input
                id="namespace"
                placeholder="例如：prod"
                {...form.register('namespace')}
              />
              {form.formState.errors.namespace && (
                <p className="text-sm text-destructive">{form.formState.errors.namespace.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">镜像</Label>
              <Input
                id="image"
                placeholder="例如：harbor.local/app:v1.0.0"
                {...form.register('image')}
              />
              {form.formState.errors.image && (
                <p className="text-sm text-destructive">{form.formState.errors.image.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="replicas">副本数</Label>
              <Input
                id="replicas"
                type="number"
                min={1}
                {...form.register('replicas', { valueAsNumber: true })}
              />
              {form.formState.errors.replicas && (
                <p className="text-sm text-destructive">{form.formState.errors.replicas.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="strategy">部署策略</Label>
              <Select
                value={form.watch('strategy')}
                onValueChange={(value) => form.setValue('strategy', value as 'rolling' | 'canary' | 'blue-green')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择部署策略" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rolling">滚动更新</SelectItem>
                  <SelectItem value="canary">灰度发布</SelectItem>
                  <SelectItem value="blue-green">蓝绿部署</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="environment">环境</Label>
              <Select
                value={form.watch('environment')}
                onValueChange={(value) => form.setValue('environment', value as 'dev' | 'test' | 'prod')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择环境" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dev">开发环境</SelectItem>
                  <SelectItem value="test">测试环境</SelectItem>
                  <SelectItem value="prod">生产环境</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.environment && (
                <p className="text-sm text-destructive">{form.formState.errors.environment.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setModalVisible(false)
                  resetForm()
                }}
              >
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading}>
                {(createMutation.isLoading || updateMutation.isLoading) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingDeployment ? '更新' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailVisible} onOpenChange={setDetailVisible}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>部署详情</DialogTitle>
          </DialogHeader>
          {selectedDeployment && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">基本信息</TabsTrigger>
                <TabsTrigger value="config">配置</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">名称</Label>
                    <p className="font-medium">{selectedDeployment.name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">命名空间</Label>
                    <p className="font-medium">{selectedDeployment.namespace}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-muted-foreground">镜像</Label>
                    <p className="font-medium break-all">{selectedDeployment.image}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">副本数</Label>
                    <p className="font-medium">{selectedDeployment.replicas}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">部署策略</Label>
                    <p className="font-medium">
                      {strategyText[selectedDeployment.strategy || 'rolling'] || selectedDeployment.strategy}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">环境</Label>
                    <Badge variant={environmentColors[selectedDeployment.environment] || 'default'}>
                      {selectedDeployment.environment.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">状态</Label>
                    <Badge variant={statusVariants[selectedDeployment.status] || 'default'}>
                      {selectedDeployment.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-muted-foreground">创建时间</Label>
                    <p className="font-medium">{selectedDeployment.created_at}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="config" className="mt-4">
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-[400px]">
                  {selectedDeployment.config || '暂无配置'}
                </pre>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        loading={deleteMutation.isLoading || deployMutation.isLoading || rollbackMutation.isLoading}
      />
    </div>
  )
}
