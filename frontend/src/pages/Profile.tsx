import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { profileApi, User } from '@/services/auth'
import { useAuthStore } from '@/store/auth'
import { User as UserIcon, Mail, Shield, Calendar, Lock, Eye, EyeOff, Loader2, Upload } from 'lucide-react'

const profileSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符').max(50, '用户名最多50个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, '请输入当前密码'),
  new_password: z
    .string()
    .min(8, '密码至少8个字符')
    .regex(/[A-Z]/, '密码必须包含大写字母')
    .regex(/[a-z]/, '密码必须包含小写字母')
    .regex(/[0-9]/, '密码必须包含数字'),
  confirm_password: z.string().min(1, '请确认新密码'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: '两次输入的密码不一致',
  path: ['confirm_password'],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

function calculatePasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { score, label: '弱', color: 'bg-red-500' }
  if (score <= 4) return { score, label: '中等', color: 'bg-yellow-500' }
  return { score, label: '强', color: 'bg-green-500' }
}

export default function Profile() {
  const { user, setAuth, token } = useAuthStore()
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      email: '',
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        username: profile.username,
        email: profile.email,
      })
    }
  }, [profile])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await profileApi.get()
      setProfile(data)
    } catch {
      toast.error('获取用户信息失败')
    } finally {
      setLoading(false)
    }
  }

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      setSavingProfile(true)
      const updated = await profileApi.update(data)
      setProfile(updated)
      if (user && token) {
        setAuth(token, updated)
      }
      toast.success('个人资料更新成功')
    } catch {
      toast.error('更新失败，请重试')
    } finally {
      setSavingProfile(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setSavingPassword(true)
      await profileApi.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      })
      toast.success('密码修改成功')
      passwordForm.reset()
      setNewPassword('')
    } catch {
      toast.error('密码修改失败，请检查当前密码是否正确')
    } finally {
      setSavingPassword(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const passwordStrength = calculatePasswordStrength(newPassword)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">个人资料</h1>
        <p className="text-muted-foreground">管理您的账户信息和安全设置</p>
      </div>

      <Card>
        <Tabs defaultValue="profile" className="w-full">
          <CardHeader className="pb-0">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="profile">基本信息</TabsTrigger>
              <TabsTrigger value="security">安全设置</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-6">
            <TabsContent value="profile" className="space-y-6 mt-0">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="" alt={profile?.username} />
                    <AvatarFallback className="text-2xl">
                      {profile?.username?.charAt(0).toUpperCase() || <UserIcon className="h-10 w-10" />}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    上传头像
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    支持 JPG、PNG 格式<br />最大 2MB
                  </p>
                </div>

                <Separator orientation="vertical" className="h-48 hidden sm:block" />
                <Separator className="sm:hidden" />

                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="flex-1 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="username">用户名</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="username"
                          placeholder="请输入用户名"
                          className="pl-10"
                          {...profileForm.register('username')}
                        />
                      </div>
                      {profileForm.formState.errors.username && (
                        <p className="text-sm text-destructive">
                          {profileForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">邮箱地址</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="请输入邮箱"
                          className="pl-10"
                          {...profileForm.register('email')}
                        />
                      </div>
                      {profileForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {profileForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>角色</Label>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <span className="capitalize">{profile?.role || 'user'}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>注册时间</Label>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{profile?.created_at ? formatDate(profile.created_at) : '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={savingProfile}>
                      {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      保存更改
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    修改密码
                  </CardTitle>
                  <CardDescription>
                    请输入当前密码和新密码来更新您的登录密码
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">当前密码</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="current_password"
                          type={showCurrentPassword ? 'text' : 'password'}
                          placeholder="请输入当前密码"
                          className="pl-10 pr-10"
                          {...passwordForm.register('current_password')}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.current_password && (
                        <p className="text-sm text-destructive">
                          {passwordForm.formState.errors.current_password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new_password">新密码</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="new_password"
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="请输入新密码"
                          className="pl-10 pr-10"
                          {...passwordForm.register('new_password', {
                            onChange: (e) => setNewPassword(e.target.value),
                          })}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.new_password && (
                        <p className="text-sm text-destructive">
                          {passwordForm.formState.errors.new_password.message}
                        </p>
                      )}
                      {newPassword && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${passwordStrength.color}`}
                                style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">{passwordStrength.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            密码需包含：大写字母、小写字母、数字，至少8个字符
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">确认新密码</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm_password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="请再次输入新密码"
                          className="pl-10 pr-10"
                          {...passwordForm.register('confirm_password')}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.confirm_password && (
                        <p className="text-sm text-destructive">
                          {passwordForm.formState.errors.confirm_password.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={savingPassword}>
                        {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        更新密码
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
