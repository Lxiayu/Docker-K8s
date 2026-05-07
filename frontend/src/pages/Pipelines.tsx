import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Pagination } from '@/components/ui/pagination'
import { pipelineApi, Pipeline } from '@/services/pipeline'
import {
  Plus,
  Pencil,
  Trash2,
  Play,
  Loader2,
  Search,
  AlertTriangle,
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'

const pipelineSchema = z.object({
  name: z.string().min(1, '请输入名称'),
  config: z.string().optional(),
})

type PipelineFormData = z.infer<typeof pipelineSchema>

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive'; className?: string }> = {
  success: { variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  failed: { variant: 'destructive' },
  running: { variant: 'default', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  pending: { variant: 'secondary' },
}

export default function Pipelines() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null)
  const [deletingPipeline, setDeletingPipeline] = useState<Pipeline | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(
    ['pipelines', page, pageSize],
    () => pipelineApi.list({ page, page_size: pageSize })
  )

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const filteredList = useMemo(() => {
    if (!data?.list) return []
    if (!search) return data.list
    return data.list.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [data?.list, search])

  const form = useForm<PipelineFormData>({
    resolver: zodResolver(pipelineSchema),
    defaultValues: {
      name: '',
      config: '',
    },
  })

  const createMutation = useMutation(pipelineApi.create, {
    onSuccess: () => {
      toast.success('创建成功')
      queryClient.invalidateQueries('pipelines')
      setDialogOpen(false)
      form.reset()
    },
    onError: () => {
      toast.error('创建失败')
    },
  })

  const updateMutation = useMutation(
    (params: { id: number; data: Partial<Pipeline> }) =>
      pipelineApi.update(params.id, params.data),
    {
      onSuccess: () => {
        toast.success('更新成功')
        queryClient.invalidateQueries('pipelines')
        setDialogOpen(false)
        setEditingPipeline(null)
        form.reset()
      },
      onError: () => {
        toast.error('更新失败')
      },
    }
  )

  const deleteMutation = useMutation(pipelineApi.delete, {
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries('pipelines')
      setDeleteDialogOpen(false)
      setDeletingPipeline(null)
    },
    onError: () => {
      toast.error('删除失败')
    },
  })

  const triggerMutation = useMutation(pipelineApi.trigger, {
    onSuccess: () => {
      toast.success('触发成功')
      queryClient.invalidateQueries('pipelines')
    },
    onError: () => {
      toast.error('触发失败')
    },
  })

  const handleCreate = () => {
    setEditingPipeline(null)
    form.reset({ name: '', config: '' })
    setDialogOpen(true)
  }

  const handleEdit = (record: Pipeline) => {
    setEditingPipeline(record)
    form.reset({
      name: record.name,
      config: record.config || '',
    })
    setDialogOpen(true)
  }

  const handleDeleteClick = (record: Pipeline) => {
    setDeletingPipeline(record)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (deletingPipeline) {
      deleteMutation.mutate(deletingPipeline.id)
    }
  }

  const handleTrigger = (id: number) => {
    triggerMutation.mutate(id)
  }

  const onSubmit = (values: PipelineFormData) => {
    if (editingPipeline) {
      updateMutation.mutate({ id: editingPipeline.id, data: values })
    } else {
      createMutation.mutate(values)
    }
  }

  const totalPages = Math.ceil((data?.total || 0) / pageSize)

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  const isLoadingMutation = createMutation.isLoading || updateMutation.isLoading

  return (
    <div className="space-y-4">
      <PageHeader
        title="流水线管理"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            新建流水线
          </Button>
        }
      />

      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="搜索流水线名称..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button variant="secondary" onClick={handleSearch}>
          <Search className="h-4 w-4 mr-1" />
          搜索
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>最后构建时间</TableHead>
              <TableHead className="w-[280px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredList.length > 0 ? (
              filteredList.map((pipeline) => (
                <TableRow key={pipeline.id}>
                  <TableCell>{pipeline.id}</TableCell>
                  <TableCell className="font-medium">{pipeline.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusConfig[pipeline.status]?.variant || 'secondary'}
                      className={statusConfig[pipeline.status]?.className}
                    >
                      {pipeline.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{pipeline.last_build_at || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTrigger(pipeline.id)}
                        disabled={triggerMutation.isLoading}
                      >
                        <Play className="mr-1 h-4 w-4" />
                        触发
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(pipeline)}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(pipeline)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data?.total ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={data.total}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPipeline ? '编辑流水线' : '新建流水线'}
            </DialogTitle>
            <DialogDescription>
              {editingPipeline ? '修改流水线信息' : '创建一个新的流水线'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                placeholder="请输入名称"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="config">配置</Label>
              <Textarea
                id="config"
                placeholder="请输入配置内容"
                rows={10}
                {...form.register('config')}
              />
              {form.formState.errors.config && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.config.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false)
                  setEditingPipeline(null)
                  form.reset()
                }}
              >
                取消
              </Button>
              <Button type="submit" disabled={isLoadingMutation}>
                {isLoadingMutation && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                确定
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              确定要删除流水线「{deletingPipeline?.name}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeletingPipeline(null)
              }}
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
