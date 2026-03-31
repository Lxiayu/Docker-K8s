import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '@/store/theme'
import { cn } from '@/lib/utils'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-md transition-colors',
        'text-gray-600 hover:bg-gray-100 hover:text-blue-600',
        'dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-blue-400'
      )}
      title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  )
}
