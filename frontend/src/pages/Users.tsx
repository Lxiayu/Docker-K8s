import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'sonner'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { userApi, User } from '@/services/auth'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  User as UserIcon, 
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const userSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6个字符').optional(),
  role: z.enum(['admin', 'devops', 'developer', 'viewer']),
})

type UserFormData = z.infer<typeof userSchema>

const getRoleBadgeVariant = (role: string): "default" | "destructive" | "secondary" | "outline" => {
  const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
    admin: 'destructive',
    devops: 'secondary',
    developer: 'default',
    viewer: 'outline',
  }
  return variants[role] || 'default'
}

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    admin: '管理员',
    devops: 'DevOps',
    developer: '开发者',
    viewer: '查看者',
  }
  return labels[role] || role
}

export default function Users() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery(
    ['users', page, pageSize],
    () => userApi.list({ page, page_size: pageSize })
  )

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      role: 'developer',
    },
  })

  const createMutation = useMutation(userApi.create, {
    onSuccess: () => {
      toast.success('创建成功')
      queryClient.invalidateQueries('users')
      setModalVisible(false)
      form.reset()
    },
    onError: () => {
      toast.error('创建失败，请重试')
    },
  })

  const updateMutation = useMutation(
    (params: { id: number; data: Partial<User> }) =>
      userApi.update(params.id, params.data),
    {
      onSuccess: () => {
        toast.success('更新成功')
        queryClient.invalidateQueries('users')
        setModalVisible(false)
        setEditingUser(null)
        form.reset()
      },
      onError: () => {
        toast.error('更新失败，请重试')
      },
    }
  )

  const deleteMutation = useMutation(userApi.delete, {
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries('users')
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    },
    onError: () => {
      toast.error('删除失败，请重试')
    },
  })

  const handleCreate = () => {
    setEditingUser(null)
    form.reset({
      username: '',
      email: '',
      password: '',
      role: 'developer',
    })
    setModalVisible(true)
  }

  const handleEdit = (record: User) => {
    setEditingUser(record)
    form.reset({
      username: record.username,
      email: record.email,
      role: record.role as UserFormData['role'],
      password: undefined,
    })
    setModalVisible(true)
  }

  const handleDelete = (id: number) => {
    setUserToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete)
    }
  }

  const handleSubmit = form.handleSubmit((values) => {
    if (editingUser) {
      const updateData: Partial<User> = {
        username: values.username,
        email: values.email,
        role: values.role,
      }
      updateMutation.mutate({ id: editingUser.id, data: updateData })
    } else {
      if (!values.password) {
        form.setError('password', { message: '请输入密码' })
        return
      }
      createMutation.mutate({
        username: values.username,
        email: values.email,
        password: values.password,
        role: values.role,
      })
    }
  })

  const closeModal = () => {
    setModalVisible(false)
    setEditingUser(null)
    form.reset()
  }

  const totalPages = Math.ceil((data?.total || 0) / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
          <p className="text-muted-foreground">管理系统用户和权限</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          创建用户
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead>用户名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="w-[150px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : (data?.list || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              (data?.list || []).map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      {user.username}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 1 ? 'success' : 'secondary'}>
                      {user.status === 1 ? '正常' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.created_at}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(user.id)}
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

      {data && data.total > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {data.total} 条记录
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              第 {page} / {totalPages} 页
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? '编辑用户' : '创建用户'}</DialogTitle>
            <DialogDescription>
              {editingUser ? '修改用户信息' : '填写新用户信息'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                placeholder="请输入用户名"
                disabled={!!editingUser}
                {...form.register('username')}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">角色</Label>
              <Select
                value={form.watch('role')}
                onValueChange={(value) => 
                  form.setValue('role', value as UserFormData['role'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="devops">DevOps</SelectItem>
                  <SelectItem value="developer">开发者</SelectItem>
                  <SelectItem value="viewer">查看者</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                取消
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
              >
                {(createMutation.isLoading || updateMutation.isLoading) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingUser ? '更新' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个用户吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteMutation.isLoading}
            >
              {deleteMutation.isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
