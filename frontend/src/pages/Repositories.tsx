import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'sonner'
import { Loader2, Plus, Pencil, Trash2, Plug, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { repositoryApi, Repository } from '@/services/repository'

const repositorySchema = z.object({
  name: z.string().min(1, '请输入名称'),
  url: z.string().min(1, '请输入仓库URL'),
  type: z.enum(['github', 'gitlab', 'gitee'], '请选择类型'),
  branch: z.string().optional(),
  credential: z.string().optional(),
})

type RepositoryFormData = z.infer<typeof repositorySchema>

const defaultValues: RepositoryFormData = {
  name: '',
  url: '',
  type: 'github',
  branch: '',
  credential: '',
}

const typeVariantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  github: 'default',
  gitlab: 'warning',
  gitee: 'destructive',
}

export default function Repositories() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [modalVisible, setModalVisible] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingRepo, setDeletingRepo] = useState<Repository | null>(null)
  const [editingRepo, setEditingRepo] = useState<Repository | null>(null)
  const [showCredential, setShowCredential] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<RepositoryFormData>({
    resolver: zodResolver(repositorySchema),
    defaultValues,
  })

  const { data, isLoading, isError, error, refetch } = useQuery(
    ['repositories', page, pageSize],
    () => repositoryApi.list({ page, page_size: pageSize })
  )

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">加载失败</h3>
          <p className="text-muted-foreground mt-1">
            {(error as Error)?.message || '无法加载代码仓库数据'}
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => refetch()}
            >
              重试
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              刷新页面
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const createMutation = useMutation(repositoryApi.create, {
    onSuccess: () => {
      toast.success('创建成功')
      queryClient.invalidateQueries('repositories')
      setModalVisible(false)
      form.reset(defaultValues)
    },
    onError: () => {
      toast.error('创建失败')
    },
  })

  const updateMutation = useMutation(
    (params: { id: number; data: Partial<Repository> }) =>
      repositoryApi.update(params.id, params.data),
    {
      onSuccess: () => {
        toast.success('更新成功')
        queryClient.invalidateQueries('repositories')
        setModalVisible(false)
        setEditingRepo(null)
        form.reset(defaultValues)
      },
      onError: () => {
        toast.error('更新失败')
      },
    }
  )

  const deleteMutation = useMutation(repositoryApi.delete, {
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries('repositories')
      setDeleteDialogOpen(false)
      setDeletingRepo(null)
    },
    onError: () => {
      toast.error('删除失败')
    },
  })

  const testMutation = useMutation(repositoryApi.test, {
    onSuccess: () => {
      toast.success('连接成功')
    },
    onError: () => {
      toast.error('连接失败')
    },
  })

  const handleCreate = () => {
    setEditingRepo(null)
    form.reset(defaultValues)
    setModalVisible(true)
  }

  const handleEdit = (record: Repository) => {
    setEditingRepo(record)
    form.reset({
      name: record.name,
      url: record.url,
      type: record.type,
      branch: record.branch || '',
      credential: '',
    })
    setModalVisible(true)
  }

  const handleDeleteClick = (record: Repository) => {
    setDeletingRepo(record)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (deletingRepo) {
      deleteMutation.mutate(deletingRepo.id)
    }
  }

  const handleTest = (id: number) => {
    testMutation.mutate(id)
  }

  const handleSubmit = (data: RepositoryFormData) => {
    if (editingRepo) {
      updateMutation.mutate({ id: editingRepo.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleCloseModal = () => {
    setModalVisible(false)
    setEditingRepo(null)
    form.reset(defaultValues)
    setShowCredential(false)
  }

  const totalPages = Math.ceil((data?.total || 0) / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">代码仓库</h1>
          <p className="text-muted-foreground">管理代码仓库配置</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          添加仓库
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>分支</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-[250px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : (data?.list || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              (data?.list || []).map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.id}</TableCell>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{record.url}</TableCell>
                  <TableCell>
                    <Badge variant={typeVariantMap[record.type] || 'default'}>
                      {record.type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.branch || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={record.status === 1 ? 'success' : 'secondary'}>
                      {record.status === 1 ? '正常' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTest(record.id)}
                        disabled={testMutation.isLoading}
                      >
                        {testMutation.isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plug className="h-4 w-4" />
                        )}
                        测试
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(record)}
                      >
                        <Pencil className="h-4 w-4" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(record)}
                      >
                        <Trash2 className="h-4 w-4" />
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

      {(data?.total || 0) > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {data?.total || 0} 条记录
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 条/页</SelectItem>
                <SelectItem value="20">20 条/页</SelectItem>
                <SelectItem value="50">50 条/页</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">
                {page} / {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={modalVisible} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingRepo ? '编辑仓库' : '添加仓库'}</DialogTitle>
            <DialogDescription>
              {editingRepo ? '修改仓库配置信息' : '添加新的代码仓库'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                placeholder="例如：frontend-app"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">仓库URL</Label>
              <Input
                id="url"
                placeholder="例如：https://github.com/example/app.git"
                {...form.register('url')}
              />
              {form.formState.errors.url && (
                <p className="text-sm text-destructive">{form.formState.errors.url.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">类型</Label>
              <Select
                value={form.watch('type')}
                onValueChange={(value) => form.setValue('type', value as 'github' | 'gitlab' | 'gitee')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择仓库类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="github">GitHub</SelectItem>
                  <SelectItem value="gitlab">GitLab</SelectItem>
                  <SelectItem value="gitee">Gitee</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.type && (
                <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">分支</Label>
              <Input
                id="branch"
                placeholder="默认：main"
                {...form.register('branch')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credential">认证凭据</Label>
              <div className="relative">
                <Input
                  id="credential"
                  type={showCredential ? 'text' : 'password'}
                  placeholder="SSH密钥或访问令牌"
                  {...form.register('credential')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCredential(!showCredential)}
                >
                  {showCredential ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                取消
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
              >
                {(createMutation.isLoading || updateMutation.isLoading) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingRepo ? '更新' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除仓库 "{deletingRepo?.name}" 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isLoading}
            >
              {deleteMutation.isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
