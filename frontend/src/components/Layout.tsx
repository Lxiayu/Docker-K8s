import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Cloud,
  Code,
  Rocket,
  Container,
  Activity,
  FileText,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/theme'
import ThemeToggle from './ThemeToggle'
import { Breadcrumb } from './Breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    key: '/',
    icon: LayoutDashboard,
    label: '仪表盘',
  },
  {
    key: '/pipelines',
    icon: Cloud,
    label: '流水线',
  },
  {
    key: '/repositories',
    icon: Code,
    label: '代码仓库',
  },
  {
    key: '/deployments',
    icon: Rocket,
    label: '部署管理',
  },
  {
    key: '/images',
    icon: Container,
    label: '镜像管理',
  },
  {
    key: '/monitoring',
    icon: Activity,
    label: '监控告警',
  },
  {
    key: '/audit-logs',
    icon: FileText,
    label: '审计日志',
  },
  {
    key: '/users',
    icon: Users,
    label: '用户管理',
  },
  {
    key: '/settings',
    icon: Settings,
    label: '系统设置',
  },
  {
    key: '/profile',
    icon: User,
    label: '个人信息',
  },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { theme } = useThemeStore()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  const handleMenuClick = (key: string) => {
    navigate(key)
  }

  const handleLogout = () => {
    setLogoutDialogOpen(true)
  }

  const confirmLogout = () => {
    logout()
    setLogoutDialogOpen(false)
    toast.success('已成功退出登录')
    navigate('/login')
  }

  const handleProfileClick = () => {
    navigate('/profile')
  }

  const handleSettingsClick = () => {
    navigate('/settings')
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          'flex flex-col bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] transition-all duration-300 shadow-lg',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-16 items-center justify-center bg-[hsl(var(--sidebar-accent))] text-lg font-bold">
          {collapsed ? 'CI/CD' : 'CI/CD Platform'}
        </div>
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.key
              return (
                <li key={item.key}>
                  <button
                    onClick={() => handleMenuClick(item.key)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                      collapsed && 'justify-center px-2',
                      isActive
                        ? 'border-l-2 border-primary bg-accent/50 text-primary'
                        : 'border-l-2 border-transparent hover:bg-accent/30 hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between bg-card px-6 shadow">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-accent">
                  <Avatar>
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user?.username}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleProfileClick}>
                  <User className="mr-2 h-4 w-4" />
                  个人信息
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSettingsClick}>
                  <Settings className="mr-2 h-4 w-4" />
                  设置
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-background">
          <div className="p-6">
            <Breadcrumb />
            <Outlet />
          </div>
        </div>
      </div>

      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认退出</DialogTitle>
            <DialogDescription>
              您确定要退出登录吗？退出后需要重新登录才能访问系统。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmLogout}>
              确认退出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
