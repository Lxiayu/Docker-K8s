import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth'
import { profileApi } from '@/services/auth'
import { toast } from 'sonner'
import { User, Mail, Shield, Calendar, Save, Loader2 } from 'lucide-react'

const profileSchema = z.object({
  real_name: z.string().optional(),
  avatar: z.string().optional(),
  github: z.string().optional(),
  gitlab: z.string().optional(),
  dockerhub: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  email: z.string().email('请输入有效的邮箱').optional().or(z.literal('')),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.get(),
    onSuccess: (data) => {
      setUser(data)
    },
  })

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      real_name: '',
      avatar: '',
      github: '',
      gitlab: '',
      dockerhub: '',
      language: 'zh',
      timezone: 'Asia/Shanghai',
      email: '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm) => profileApi.update(data),
    onSuccess: (data) => {
      setUser(data)
      queryClient.invalidateQueries('profile')
      toast.success('个人信息更新成功')
    },
    onError: () => {
      toast.error('更新失败，请重试')
    },
  })

  useEffect(() => {
    if (profileData || user) {
      const data = profileData || user
      form.reset({
        real_name: data?.real_name || '',
        avatar: data?.avatar || '',
        github: data?.github || '',
        gitlab: data?.gitlab || '',
        dockerhub: data?.dockerhub || '',
        language: data?.language || 'zh',
        timezone: data?.timezone || 'Asia/Shanghai',
        email: data?.email || '',
      })
    }
  }, [profileData, user, form])

  const onSubmit = (data: ProfileForm) => {
    updateMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">个人信息</h1>
        <p className="text-muted-foreground mt-2">管理您的账户信息和偏好设置</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>账户信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-12 w-12 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">{user?.username || '用户'}</h3>
                <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {user?.role && (
                  <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'developer' ? 'secondary' : 'outline'}>
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user?.email || '-'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  加入时间: {user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>编辑资料</CardTitle>
            <CardDescription>更新您的个人信息</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">用户名</Label>
                    <Input
                      id="username"
                      value={user?.username || ''}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">用户名无法修改</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="real_name">真实姓名</Label>
                    <Input
                      id="real_name"
                      placeholder="请输入真实姓名"
                      {...form.register('real_name')}
                    />
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
                      <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatar">头像 URL</Label>
                    <Input
                      id="avatar"
                      placeholder="https://example.com/avatar.jpg"
                      {...form.register('avatar')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github">GitHub</Label>
                  <Input
                    id="github"
                    placeholder="https://github.com/username"
                    {...form.register('github')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gitlab">GitLab</Label>
                  <Input
                    id="gitlab"
                    placeholder="https://gitlab.com/username"
                    {...form.register('gitlab')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dockerhub">Docker Hub</Label>
                  <Input
                    id="dockerhub"
                    placeholder="https://hub.docker.com/u/username"
                    {...form.register('dockerhub')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">语言</Label>
                    <Input
                      id="language"
                      {...form.register('language')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">时区</Label>
                    <Input
                      id="timezone"
                      {...form.register('timezone')}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={updateMutation.isLoading}>
                    {updateMutation.isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    保存修改
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
