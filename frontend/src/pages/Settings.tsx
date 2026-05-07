import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { settingsApi, Setting } from '@/services/settings'
import { 
  Save, 
  Loader2, 
  Settings as SettingsIcon, 
  Server, 
  Container, 
  Bell, 
  Shield,
  Eye,
  EyeOff,
  TestTube
} from 'lucide-react'

const generalSchema = z.object({
  systemName: z.string().min(1, '请输入系统名称').max(100, '系统名称最多100个字符'),
  systemDescription: z.string().max(500, '系统描述最多500个字符').optional(),
  defaultNamespace: z.string().min(1, '请输入默认命名空间'),
})

const kubernetesSchema = z.object({
  clusterName: z.string().min(1, '请输入集群名称'),
  apiServer: z.string().url('请输入有效的API Server地址'),
  namespaces: z.string().min(1, '请输入命名空间'),
})

const registrySchema = z.object({
  harborUrl: z.string().url('请输入有效的Harbor地址'),
  harborUsername: z.string().min(1, '请输入用户名'),
  harborPassword: z.string().min(1, '请输入密码'),
  defaultProject: z.string().min(1, '请输入默认项目'),
})

const notificationSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.string().regex(/^\d+$/, '端口必须是数字').optional().or(z.literal('')),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  dingtalkWebhook: z.string().url('请输入有效的Webhook地址').optional().or(z.literal('')),
  wechatWebhook: z.string().url('请输入有效的Webhook地址').optional().or(z.literal('')),
})

const securitySchema = z.object({
  enableImageScanning: z.boolean(),
  scanSeverity: z.enum(['critical', 'high', 'medium', 'low']),
  blockHighSeverity: z.boolean(),
  enableAuditLog: z.boolean(),
  auditLogRetention: z.string().regex(/^\d+$/, '请输入有效的天数'),
})

type GeneralFormData = z.infer<typeof generalSchema>
type KubernetesFormData = z.infer<typeof kubernetesSchema>
type RegistryFormData = z.infer<typeof registrySchema>
type NotificationFormData = z.infer<typeof notificationSchema>
type SecurityFormData = z.infer<typeof securitySchema>

const defaultGeneralValues: GeneralFormData = {
  systemName: 'CI/CD Platform',
  systemDescription: '',
  defaultNamespace: 'default',
}

const defaultKubernetesValues: KubernetesFormData = {
  clusterName: '',
  apiServer: 'https://kubernetes.default.svc',
  namespaces: 'default',
}

const defaultRegistryValues: RegistryFormData = {
  harborUrl: 'http://harbor.local',
  harborUsername: '',
  harborPassword: '',
  defaultProject: 'production',
}

const defaultNotificationValues: NotificationFormData = {
  smtpHost: '',
  smtpPort: '',
  smtpUser: '',
  smtpPassword: '',
  dingtalkWebhook: '',
  wechatWebhook: '',
}

const defaultSecurityValues: SecurityFormData = {
  enableImageScanning: true,
  scanSeverity: 'high',
  blockHighSeverity: true,
  enableAuditLog: true,
  auditLogRetention: '90',
}

function parseSettings(settings: Setting[]): Record<string, string> {
  const result: Record<string, string> = {}
  settings.forEach((s) => {
    result[s.key] = s.value
  })
  return result
}

export default function Settings() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('general')
  const [showHarborPassword, setShowHarborPassword] = useState(false)
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)
  const [testingRegistry, setTestingRegistry] = useState(false)
  const [testingNotification, setTestingNotification] = useState(false)

  const { data: settings, isLoading } = useQuery('settings', () => settingsApi.getAll(), {
    onError: () => {
      toast.error('加载设置失败')
    },
  })

  const generalForm = useForm<GeneralFormData>({
    resolver: zodResolver(generalSchema),
    defaultValues: defaultGeneralValues,
  })

  const kubernetesForm = useForm<KubernetesFormData>({
    resolver: zodResolver(kubernetesSchema),
    defaultValues: defaultKubernetesValues,
  })

  const registryForm = useForm<RegistryFormData>({
    resolver: zodResolver(registrySchema),
    defaultValues: defaultRegistryValues,
  })

  const notificationForm = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: defaultNotificationValues,
  })

  const securityForm = useForm<SecurityFormData>({
    resolver: zodResolver(securitySchema),
    defaultValues: defaultSecurityValues,
  })

  useEffect(() => {
    if (settings && settings.length > 0) {
      const settingsMap = parseSettings(settings)
      
      generalForm.reset({
        systemName: settingsMap.systemName || defaultGeneralValues.systemName,
        systemDescription: settingsMap.systemDescription || defaultGeneralValues.systemDescription,
        defaultNamespace: settingsMap.defaultNamespace || defaultGeneralValues.defaultNamespace,
      })

      kubernetesForm.reset({
        clusterName: settingsMap.clusterName || defaultKubernetesValues.clusterName,
        apiServer: settingsMap.apiServer || defaultKubernetesValues.apiServer,
        namespaces: settingsMap.namespaces || defaultKubernetesValues.namespaces,
      })

      registryForm.reset({
        harborUrl: settingsMap.harborUrl || defaultRegistryValues.harborUrl,
        harborUsername: settingsMap.harborUsername || defaultRegistryValues.harborUsername,
        harborPassword: settingsMap.harborPassword || defaultRegistryValues.harborPassword,
        defaultProject: settingsMap.defaultProject || defaultRegistryValues.defaultProject,
      })

      notificationForm.reset({
        smtpHost: settingsMap.smtpHost || defaultNotificationValues.smtpHost,
        smtpPort: settingsMap.smtpPort || defaultNotificationValues.smtpPort,
        smtpUser: settingsMap.smtpUser || defaultNotificationValues.smtpUser,
        smtpPassword: settingsMap.smtpPassword || defaultNotificationValues.smtpPassword,
        dingtalkWebhook: settingsMap.dingtalkWebhook || defaultNotificationValues.dingtalkWebhook,
        wechatWebhook: settingsMap.wechatWebhook || defaultNotificationValues.wechatWebhook,
      })

      securityForm.reset({
        enableImageScanning: settingsMap.enableImageScanning === 'true',
        scanSeverity: (settingsMap.scanSeverity as 'critical' | 'high' | 'medium' | 'low') || defaultSecurityValues.scanSeverity,
        blockHighSeverity: settingsMap.blockHighSeverity === 'true',
        enableAuditLog: settingsMap.enableAuditLog === 'true',
        auditLogRetention: settingsMap.auditLogRetention || defaultSecurityValues.auditLogRetention,
      })
    }
  }, [settings])

  const saveMutation = useMutation(
    (data: Record<string, string>) => settingsApi.update(data),
    {
      onSuccess: () => {
        toast.success('设置已保存')
        queryClient.invalidateQueries('settings')
      },
      onError: () => {
        toast.error('保存失败，请重试')
      },
    }
  )

  const onGeneralSubmit = (data: GeneralFormData) => {
    saveMutation.mutate(data as Record<string, string>)
  }

  const onKubernetesSubmit = (data: KubernetesFormData) => {
    saveMutation.mutate(data as Record<string, string>)
  }

  const onRegistrySubmit = (data: RegistryFormData) => {
    saveMutation.mutate(data as Record<string, string>)
  }

  const onNotificationSubmit = (data: NotificationFormData) => {
    saveMutation.mutate(data as Record<string, string>)
  }

  const onSecuritySubmit = (data: SecurityFormData) => {
    const dataToSave: Record<string, string> = {
      ...data,
      enableImageScanning: String(data.enableImageScanning),
      blockHighSeverity: String(data.blockHighSeverity),
      enableAuditLog: String(data.enableAuditLog),
    }
    saveMutation.mutate(dataToSave)
  }

  const handleTestRegistry = async () => {
    setTestingRegistry(true)
    try {
      await settingsApi.testRegistry()
      toast.success('镜像仓库连接成功')
    } catch {
      toast.error('镜像仓库连接失败')
    } finally {
      setTestingRegistry(false)
    }
  }

  const handleTestNotification = async (type: 'email' | 'dingtalk' | 'wechat') => {
    setTestingNotification(true)
    try {
      await settingsApi.testNotification(type)
      const typeNames = { email: '邮件', dingtalk: '钉钉', wechat: '企业微信' }
      toast.success(`${typeNames[type]}通知测试成功`)
    } catch {
      toast.error('通知测试失败')
    } finally {
      setTestingNotification(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
        <p className="text-muted-foreground">管理系统配置和参数</p>
      </div>

      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="pb-0">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                <span className="hidden sm:inline">基本设置</span>
              </TabsTrigger>
              <TabsTrigger value="kubernetes" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span className="hidden sm:inline">Kubernetes</span>
              </TabsTrigger>
              <TabsTrigger value="registry" className="flex items-center gap-2">
                <Container className="h-4 w-4" />
                <span className="hidden sm:inline">镜像仓库</span>
              </TabsTrigger>
              <TabsTrigger value="notification" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">通知配置</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">安全设置</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-6">
            <TabsContent value="general" className="space-y-6 mt-0">
              <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-6 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="systemName">系统名称</Label>
                  <Input
                    id="systemName"
                    placeholder="请输入系统名称"
                    {...generalForm.register('systemName')}
                  />
                  {generalForm.formState.errors.systemName && (
                    <p className="text-sm text-destructive">
                      {generalForm.formState.errors.systemName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="systemDescription">系统描述</Label>
                  <Textarea
                    id="systemDescription"
                    placeholder="请输入系统描述"
                    rows={3}
                    {...generalForm.register('systemDescription')}
                  />
                  {generalForm.formState.errors.systemDescription && (
                    <p className="text-sm text-destructive">
                      {generalForm.formState.errors.systemDescription.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultNamespace">默认命名空间</Label>
                  <Input
                    id="defaultNamespace"
                    placeholder="请输入默认命名空间"
                    {...generalForm.register('defaultNamespace')}
                  />
                  {generalForm.formState.errors.defaultNamespace && (
                    <p className="text-sm text-destructive">
                      {generalForm.formState.errors.defaultNamespace.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saveMutation.isLoading}>
                    {saveMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    保存设置
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="kubernetes" className="space-y-6 mt-0">
              <form onSubmit={kubernetesForm.handleSubmit(onKubernetesSubmit)} className="space-y-6 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="clusterName">集群名称</Label>
                  <Input
                    id="clusterName"
                    placeholder="请输入集群名称"
                    {...kubernetesForm.register('clusterName')}
                  />
                  {kubernetesForm.formState.errors.clusterName && (
                    <p className="text-sm text-destructive">
                      {kubernetesForm.formState.errors.clusterName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiServer">API Server地址</Label>
                  <Input
                    id="apiServer"
                    placeholder="https://kubernetes.default.svc"
                    {...kubernetesForm.register('apiServer')}
                  />
                  {kubernetesForm.formState.errors.apiServer && (
                    <p className="text-sm text-destructive">
                      {kubernetesForm.formState.errors.apiServer.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="namespaces">命名空间</Label>
                  <Input
                    id="namespaces"
                    placeholder="多个命名空间用逗号分隔"
                    {...kubernetesForm.register('namespaces')}
                  />
                  <p className="text-xs text-muted-foreground">
                    多个命名空间请用逗号分隔，如: default, production, staging
                  </p>
                  {kubernetesForm.formState.errors.namespaces && (
                    <p className="text-sm text-destructive">
                      {kubernetesForm.formState.errors.namespaces.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saveMutation.isLoading}>
                    {saveMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    保存设置
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="registry" className="space-y-6 mt-0">
              <form onSubmit={registryForm.handleSubmit(onRegistrySubmit)} className="space-y-6 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="harborUrl">Harbor地址</Label>
                  <Input
                    id="harborUrl"
                    placeholder="http://harbor.local"
                    {...registryForm.register('harborUrl')}
                  />
                  {registryForm.formState.errors.harborUrl && (
                    <p className="text-sm text-destructive">
                      {registryForm.formState.errors.harborUrl.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="harborUsername">用户名</Label>
                  <Input
                    id="harborUsername"
                    placeholder="请输入用户名"
                    {...registryForm.register('harborUsername')}
                  />
                  {registryForm.formState.errors.harborUsername && (
                    <p className="text-sm text-destructive">
                      {registryForm.formState.errors.harborUsername.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="harborPassword">密码</Label>
                  <div className="relative">
                    <Input
                      id="harborPassword"
                      type={showHarborPassword ? 'text' : 'password'}
                      placeholder="请输入密码"
                      {...registryForm.register('harborPassword')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowHarborPassword(!showHarborPassword)}
                    >
                      {showHarborPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registryForm.formState.errors.harborPassword && (
                    <p className="text-sm text-destructive">
                      {registryForm.formState.errors.harborPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultProject">默认项目</Label>
                  <Input
                    id="defaultProject"
                    placeholder="请输入默认项目"
                    {...registryForm.register('defaultProject')}
                  />
                  {registryForm.formState.errors.defaultProject && (
                    <p className="text-sm text-destructive">
                      {registryForm.formState.errors.defaultProject.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <Button type="submit" disabled={saveMutation.isLoading}>
                    {saveMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    保存设置
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestRegistry}
                    disabled={testingRegistry}
                  >
                    {testingRegistry && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <TestTube className="mr-2 h-4 w-4" />
                    测试连接
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="notification" className="space-y-6 mt-0">
              <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6 max-w-xl">
                <div>
                  <h3 className="text-lg font-medium mb-4">邮件通知</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtpHost">SMTP服务器</Label>
                        <Input
                          id="smtpHost"
                          placeholder="smtp.example.com"
                          {...notificationForm.register('smtpHost')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpPort">SMTP端口</Label>
                        <Input
                          id="smtpPort"
                          placeholder="587"
                          {...notificationForm.register('smtpPort')}
                        />
                        {notificationForm.formState.errors.smtpPort && (
                          <p className="text-sm text-destructive">
                            {notificationForm.formState.errors.smtpPort.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">发件人邮箱</Label>
                      <Input
                        id="smtpUser"
                        placeholder="noreply@example.com"
                        {...notificationForm.register('smtpUser')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">邮箱密码</Label>
                      <div className="relative">
                        <Input
                          id="smtpPassword"
                          type={showSmtpPassword ? 'text' : 'password'}
                          placeholder="请输入密码"
                          {...notificationForm.register('smtpPassword')}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                        >
                          {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestNotification('email')}
                      disabled={testingNotification}
                    >
                      {testingNotification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <TestTube className="mr-2 h-4 w-4" />
                      测试邮件
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">钉钉通知</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dingtalkWebhook">Webhook地址</Label>
                      <Input
                        id="dingtalkWebhook"
                        placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
                        {...notificationForm.register('dingtalkWebhook')}
                      />
                      {notificationForm.formState.errors.dingtalkWebhook && (
                        <p className="text-sm text-destructive">
                          {notificationForm.formState.errors.dingtalkWebhook.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestNotification('dingtalk')}
                      disabled={testingNotification}
                    >
                      {testingNotification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <TestTube className="mr-2 h-4 w-4" />
                      测试钉钉
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">企业微信通知</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="wechatWebhook">Webhook地址</Label>
                      <Input
                        id="wechatWebhook"
                        placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
                        {...notificationForm.register('wechatWebhook')}
                      />
                      {notificationForm.formState.errors.wechatWebhook && (
                        <p className="text-sm text-destructive">
                          {notificationForm.formState.errors.wechatWebhook.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestNotification('wechat')}
                      disabled={testingNotification}
                    >
                      {testingNotification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <TestTube className="mr-2 h-4 w-4" />
                      测试企业微信
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saveMutation.isLoading}>
                    {saveMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    保存设置
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="security" className="space-y-6 mt-0">
              <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6 max-w-xl">
                <div>
                  <h3 className="text-lg font-medium mb-4">镜像安全</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>启用镜像扫描</Label>
                        <p className="text-sm text-muted-foreground">
                          在部署前自动扫描镜像漏洞
                        </p>
                      </div>
                      <Switch
                        checked={securityForm.watch('enableImageScanning')}
                        onCheckedChange={(checked) => securityForm.setValue('enableImageScanning', checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>扫描级别</Label>
                      <Select
                        value={securityForm.watch('scanSeverity')}
                        onValueChange={(value) => securityForm.setValue('scanSeverity', value as 'critical' | 'high' | 'medium' | 'low')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择扫描级别" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">仅严重漏洞</SelectItem>
                          <SelectItem value="high">高危及以上</SelectItem>
                          <SelectItem value="medium">中危及以上</SelectItem>
                          <SelectItem value="low">所有漏洞</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>阻止高危漏洞镜像</Label>
                        <p className="text-sm text-muted-foreground">
                          阻止存在高危漏洞的镜像部署
                        </p>
                      </div>
                      <Switch
                        checked={securityForm.watch('blockHighSeverity')}
                        onCheckedChange={(checked) => securityForm.setValue('blockHighSeverity', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">审计日志</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>启用审计日志</Label>
                        <p className="text-sm text-muted-foreground">
                          记录用户操作和系统事件
                        </p>
                      </div>
                      <Switch
                        checked={securityForm.watch('enableAuditLog')}
                        onCheckedChange={(checked) => securityForm.setValue('enableAuditLog', checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="auditLogRetention">日志保留天数</Label>
                      <Input
                        id="auditLogRetention"
                        type="number"
                        placeholder="90"
                        {...securityForm.register('auditLogRetention')}
                      />
                      {securityForm.formState.errors.auditLogRetention && (
                        <p className="text-sm text-destructive">
                          {securityForm.formState.errors.auditLogRetention.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saveMutation.isLoading}>
                    {saveMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    保存设置
                  </Button>
                </div>
              </form>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            配置指南
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            需要帮助配置系统？查看详细的配置指南文档，了解如何配置 Kubernetes、Harbor、Prometheus 等。
          </p>
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <h4 className="font-medium mb-2">快速启动命令</h4>
            <code className="text-sm bg-background px-2 py-1 rounded block">
              ./quick-start.sh
            </code>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <h4 className="font-medium mb-2">初始化测试数据</h4>
            <code className="text-sm bg-background px-2 py-1 rounded block">
              cd backend && go run cmd/seed/main.go
            </code>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <h4 className="font-medium mb-2">默认登录账号</h4>
            <div className="text-sm">
              <span className="text-muted-foreground">用户名:</span> admin &nbsp;|&nbsp;
              <span className="text-muted-foreground">密码:</span> password123
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              onClick={() => {
                const guidePath = '/CONFIGURATION_GUIDE.md'
                window.open(guidePath, '_blank')
              }}
            >
              查看配置指南
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const testDocPath = '/TEST_DATA_README.md'
                window.open(testDocPath, '_blank')
              }}
            >
              测试数据说明
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            配置指南文档位置: <code className="bg-muted px-1 rounded">/CONFIGURATION_GUIDE.md</code>（项目根目录）
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
