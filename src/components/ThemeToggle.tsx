import { Button } from './ui/button'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const cycle = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const currentLabel = theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'
  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark'

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={cycle} title={`Theme: ${currentLabel}`}>
        {isDark ? '🌙' : '☀️'} <span className="ml-1 hidden sm:inline">{currentLabel}</span>
      </Button>
    </div>
  )
}
