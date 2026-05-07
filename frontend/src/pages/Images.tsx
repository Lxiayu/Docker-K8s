import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
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
import { Card, CardContent } from '@/components/ui/card'
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
import { imageApi, Image, ImageDetail, BuildImageParams } from '@/services/image'
import { repositoryApi } from '@/services/repository'
import { Pagination } from '@/components/ui/pagination'
import { PageHeader } from '@/components/PageHeader'
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Scan,
  Eye,
  XCircle,
} from 'lucide-react'

const scanStatusConfig: Record<string, { 
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
  icon: React.ReactNode
}> = {
  pending: { label: '待扫描', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  scanning: { label: '扫描中', variant: 'warning', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  completed: { label: '已完成', variant: 'success', icon: <CheckCircle className="h-3 w-3" /> },
  failed: { label: '失败', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function VulnerabilityBadge({ summary }: { summary: { critical: number; high: number; medium: number; low: number } }) {
  const hasVulnerabilities = summary.critical > 0 || summary.high > 0 || summary.medium > 0 || summary.low > 0
  
  if (!hasVulnerabilities) {
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        无漏洞
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {summary.critical > 0 && (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {summary.critical} 严重
        </Badge>
      )}
      {summary.high > 0 && (
        <Badge variant="warning" className="gap-1">
          {summary.high} 高危
        </Badge>
      )}
      {summary.medium > 0 && (
        <Badge variant="secondary" className="gap-1">
          {summary.medium} 中危
        </Badge>
      )}
      {summary.low > 0 && (
        <Badge variant="default" className="gap-1">
          {summary.low} 低危
        </Badge>
      )}
    </div>
  )
}

export default function Images() {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [project, setProject] = useState<string>('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [buildDialogVisible, setBuildDialogVisible] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageDetail | null>(null)
  const [deletingImage, setDeletingImage] = useState<Image | null>(null)
  
  const [buildForm, setBuildForm] = useState<BuildImageParams>({
    name: '',
    dockerfile_path: './Dockerfile',
    build_context: '.',
    tag: 'latest',
    repository_id: undefined,
  })
  const [buildFormErrors, setBuildFormErrors] = useState<Partial<Record<keyof BuildImageParams, string>>>({})

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(
    ['images', page, pageSize, project, search],
    () => imageApi.list({ 
      page, 
      page_size: pageSize, 
      project: project || undefined,
      search: search || undefined 
    })
  )

  const { data: reposData } = useQuery(
    ['repositories-all'],
    () => repositoryApi.list({ page: 1, page_size: 100 }),
    { staleTime: 5 * 60 * 1000 }
  )

  const projects = [...new Set((reposData?.list || []).map((r) => r.name))]

  const detailQuery = useQuery(
    ['image-detail', selectedImage?.id],
    () => imageApi.get(selectedImage!.id),
    {
      enabled: !!selectedImage?.id && detailVisible,
    }
  )

  const scanMutation = useMutation(imageApi.scan, {
    onSuccess: () => {
      toast.success('扫描任务已启动')
      queryClient.invalidateQueries('images')
      if (selectedImage?.id) {
        queryClient.invalidateQueries(['image-detail', selectedImage.id])
      }
    },
    onError: () => {
      toast.error('启动扫描失败')
    },
  })

  const buildMutation = useMutation(imageApi.build, {
    onSuccess: () => {
      toast.success('镜像构建任务已启动')
      queryClient.invalidateQueries('images')
      setBuildDialogVisible(false)
      resetBuildForm()
    },
    onError: () => {
      toast.error('镜像构建失败')
    },
  })

  const deleteMutation = useMutation(imageApi.delete, {
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries('images')
      setDeleteDialogOpen(false)
      setDeletingImage(null)
    },
    onError: () => {
      toast.error('删除失败')
    },
  })

  const resetBuildForm = () => {
    setBuildForm({
      name: '',
      dockerfile_path: './Dockerfile',
      build_context: '.',
      tag: 'latest',
      repository_id: undefined,
    })
    setBuildFormErrors({})
  }

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleViewDetail = async (record: Image) => {
    setSelectedImage(record as ImageDetail)
    setDetailVisible(true)
  }

  const handleScan = (id: number) => {
    scanMutation.mutate(id)
  }

  const handleDeleteClick = (record: Image) => {
    setDeletingImage(record)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (deletingImage) {
      deleteMutation.mutate(deletingImage.id)
    }
  }

  const validateBuildForm = (): boolean => {
    const errors: Partial<Record<keyof BuildImageParams, string>> = {}

    if (!buildForm.name.trim()) {
      errors.name = '请输入镜像名称'
    }
    if (!buildForm.dockerfile_path.trim()) {
      errors.dockerfile_path = '请输入 Dockerfile 路径'
    }
    if (!buildForm.build_context.trim()) {
      errors.build_context = '请输入构建上下文'
    }
    if (!buildForm.tag.trim()) {
      errors.tag = '请输入标签'
    }

    setBuildFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleBuildSubmit = () => {
    if (!validateBuildForm()) {
      return
    }
    buildMutation.mutate(buildForm)
  }

  const totalPages = Math.ceil((data?.total || 0) / pageSize)

  return (
    <div className="space-y-4">
      <PageHeader
        title="镜像管理"
        description="管理 Docker 镜像与 Harbor 集成"
        actions={
          <Button onClick={() => setBuildDialogVisible(true)}>
            <Plus className="mr-2 h-4 w-4" />
            构建镜像
          </Button>
        }
      />

      <div className="flex gap-4 items-center">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="搜索镜像名称..."
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
        <Select value={project} onValueChange={(value) => { setProject(value); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="选择项目" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部项目</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead>镜像名称</TableHead>
              <TableHead className="w-[100px]">标签数</TableHead>
              <TableHead className="w-[120px]">大小</TableHead>
              <TableHead>漏洞</TableHead>
              <TableHead className="w-[120px]">扫描状态</TableHead>
              <TableHead className="w-[180px]">最后更新</TableHead>
              <TableHead className="w-[200px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : (data?.list || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              (data?.list || []).map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{record.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[300px]" title={record.full_path}>
                          {record.full_path}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.tags_count}</Badge>
                  </TableCell>
                  <TableCell>{formatSize(record.size)}</TableCell>
                  <TableCell>
                    <VulnerabilityBadge summary={record.vulnerabilities} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={scanStatusConfig[record.scan_status]?.variant || 'default'} className="gap-1">
                      {scanStatusConfig[record.scan_status]?.icon}
                      {scanStatusConfig[record.scan_status]?.label || record.scan_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {record.last_updated}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(record)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        详情
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleScan(record.id)}
                        disabled={scanMutation.isLoading || record.scan_status === 'scanning'}
                      >
                        {record.scan_status === 'scanning' ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Scan className="h-4 w-4 mr-1" />
                        )}
                        扫描
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(record)}
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

      <Dialog open={detailVisible} onOpenChange={setDetailVisible}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>镜像详情</DialogTitle>
          </DialogHeader>
          {detailQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detailQuery.data ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">镜像名称</Label>
                  <p className="font-medium">{detailQuery.data.name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">项目</Label>
                  <p className="font-medium">{detailQuery.data.project}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-muted-foreground">完整路径</Label>
                  <p className="font-medium break-all font-mono text-sm bg-muted p-2 rounded">
                    {detailQuery.data.full_path}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">大小</Label>
                  <p className="font-medium">{formatSize(detailQuery.data.size)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">创建时间</Label>
                  <p className="font-medium">{detailQuery.data.created_at}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">漏洞摘要</Label>
                <Card>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-destructive">{detailQuery.data.vulnerabilities.critical}</p>
                        <p className="text-sm text-muted-foreground">严重</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-warning">{detailQuery.data.vulnerabilities.high}</p>
                        <p className="text-sm text-muted-foreground">高危</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-secondary-foreground">{detailQuery.data.vulnerabilities.medium}</p>
                        <p className="text-sm text-muted-foreground">中危</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{detailQuery.data.vulnerabilities.low}</p>
                        <p className="text-sm text-muted-foreground">低危</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">标签列表</Label>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>标签</TableHead>
                        <TableHead>大小</TableHead>
                        <TableHead>Digest</TableHead>
                        <TableHead>漏洞</TableHead>
                        <TableHead>创建时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(detailQuery.data.tags || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                            暂无标签
                          </TableCell>
                        </TableRow>
                      ) : (
                        detailQuery.data.tags.map((tag) => (
                          <TableRow key={tag.name}>
                            <TableCell className="font-medium">{tag.name}</TableCell>
                            <TableCell>{formatSize(tag.size)}</TableCell>
                            <TableCell className="font-mono text-xs max-w-[200px] truncate" title={tag.digest}>
                              {tag.digest.substring(0, 19)}...
                            </TableCell>
                            <TableCell>
                              <VulnerabilityBadge summary={tag.vulnerabilities} />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {tag.created_at}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={buildDialogVisible} onOpenChange={setBuildDialogVisible}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>构建新镜像</DialogTitle>
            <DialogDescription>
              填写以下信息构建新的 Docker 镜像
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">镜像名称 *</Label>
              <Input
                id="name"
                placeholder="例如：my-app"
                value={buildForm.name}
                onChange={(e) => setBuildForm({ ...buildForm, name: e.target.value })}
              />
              {buildFormErrors.name && (
                <p className="text-sm text-destructive">{buildFormErrors.name}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tag">标签 *</Label>
              <Input
                id="tag"
                placeholder="例如：latest"
                value={buildForm.tag}
                onChange={(e) => setBuildForm({ ...buildForm, tag: e.target.value })}
              />
              {buildFormErrors.tag && (
                <p className="text-sm text-destructive">{buildFormErrors.tag}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dockerfile_path">Dockerfile 路径 *</Label>
              <Input
                id="dockerfile_path"
                placeholder="例如：./Dockerfile"
                value={buildForm.dockerfile_path}
                onChange={(e) => setBuildForm({ ...buildForm, dockerfile_path: e.target.value })}
              />
              {buildFormErrors.dockerfile_path && (
                <p className="text-sm text-destructive">{buildFormErrors.dockerfile_path}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="build_context">构建上下文 *</Label>
              <Input
                id="build_context"
                placeholder="例如：."
                value={buildForm.build_context}
                onChange={(e) => setBuildForm({ ...buildForm, build_context: e.target.value })}
              />
              {buildFormErrors.build_context && (
                <p className="text-sm text-destructive">{buildFormErrors.build_context}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="repository">代码仓库（可选）</Label>
              <Select
                value={buildForm.repository_id?.toString() || ''}
                onValueChange={(value) => setBuildForm({ 
                  ...buildForm, 
                  repository_id: value ? Number(value) : undefined 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择代码仓库" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">不使用仓库</SelectItem>
                  {(reposData?.list || []).map((repo) => (
                    <SelectItem key={repo.id} value={String(repo.id)}>
                      {repo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setBuildDialogVisible(false)
                resetBuildForm()
              }}
            >
              取消
            </Button>
            <Button onClick={handleBuildSubmit} disabled={buildMutation.isLoading}>
              {buildMutation.isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              开始构建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除镜像 "{deletingImage?.name}" 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button 
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
