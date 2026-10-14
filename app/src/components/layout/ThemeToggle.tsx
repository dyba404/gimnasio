import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )

  const toggle = () => {
    const siguiente = !dark
    document.documentElement.classList.toggle('dark', siguiente)
    setDark(siguiente)
    try {
      localStorage.setItem('marsmode-theme', siguiente ? 'dark' : 'light')
    } catch {
      return
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Cambiar tema"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
