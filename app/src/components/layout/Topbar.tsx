import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronsUpDown, LogOut, Search } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useSearch } from '@/hooks/use-search'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { navItems } from '@/lib/navigation'
import { clienteSupabase, supabaseDisponible } from '@/lib/supabase'

function inicialesDeEmail(email: string): string {
  const primera = email.trim().charAt(0)
  return primera === '' ? '?' : primera.toUpperCase()
}

export function Topbar() {
  const { pathname } = useLocation()
  const navegar = useNavigate()
  const { setOpen } = useSearch()
  const current = navItems.find((item) => item.path === pathname)
  const conBackend = supabaseDisponible()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!conBackend) return
    const cliente = clienteSupabase()
    if (!cliente) return
    let activo = true
    void cliente.auth.getUser().then(({ data }) => {
      if (activo && data.user !== null) setEmail(data.user.email ?? null)
    })
    const { data: suscripcion } = cliente.auth.onAuthStateChange((_evento, sesion) => {
      if (!activo) return
      setEmail(sesion?.user?.email ?? null)
    })
    return () => {
      activo = false
      suscripcion.subscription.unsubscribe()
    }
  }, [conBackend])

  async function cerrarSesion() {
    if (conBackend) {
      const cliente = clienteSupabase()
      if (cliente) await cliente.auth.signOut()
    }
    navegar('/login')
  }

  const etiquetaCuenta = conBackend ? (email ?? 'Cuenta') : 'Modo demo'

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger aria-label="Alternar menú" />
      <Separator orientation="vertical" className="mr-1 h-5" />
      <h1 className="text-sm font-semibold">{current?.title ?? 'Marsmode'}</h1>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-muted-foreground"
          onClick={() => setOpen(true)}
          aria-keyshortcuts="Control+K Meta+K"
          aria-label="Buscar (Ctrl K)"
        >
          <Search />
          <span className="hidden sm:inline">Buscar…</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
            Ctrl K
          </kbd>
        </Button>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md px-1.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Menú de la cuenta"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                  {conBackend && email !== null
                    ? inicialesDeEmail(email)
                    : 'M'}
                </AvatarFallback>
              </Avatar>
              <ChevronsUpDown className="size-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{etiquetaCuenta}</p>
              {conBackend && email !== null && (
                <p className="text-xs text-muted-foreground">{email}</p>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/config">Configuración</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void cerrarSesion()}>
              <LogOut /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
