import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SocioEstadoBadge } from '@/components/members/SocioEstadoBadge'
import { buscarSocios } from '@/lib/search'
import { navItems } from '@/lib/navigation'
import { SearchContext } from '@/hooks/use-search'
import { cargarSocios } from '@/lib/datos'
import { sociosMock } from '@/mocks/data'
import type { Socio } from '@/mocks/types'

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')
}

type CommandMenuProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [socios, setSocios] = useState<readonly Socio[] | null>(null)

  useEffect(() => {
    if (!open || socios !== null) return
    let cancelado = false
    void cargarSocios().then((remotos) => {
      if (!cancelado && remotos !== null) setSocios(remotos)
    })
    return () => {
      cancelado = true
    }
  }, [open, socios])

  const cerrar = useCallback(
    (next: boolean) => {
      onOpenChange(next)
      if (!next) setQuery('')
    },
    [onOpenChange],
  )

  const baseSocios = socios ?? sociosMock
  const resultadosSocios = useMemo<Socio[]>(() => {
    if (!open) return []
    const consulta = query.trim()
    if (!consulta) return [...baseSocios]
    return buscarSocios(baseSocios, consulta, 8)
  }, [open, query, baseSocios])

  const navegar = (path: string) => {
    cerrar(false)
    navigate(path)
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={cerrar}
      label="Buscador global"
      shouldFilter={false}
      overlayClassName="fixed inset-0 z-50 bg-black/60"
      contentClassName="fixed top-[15vh] left-1/2 z-50 w-full max-w-lg -translate-x-1/2"
      className="overflow-hidden rounded-xl border bg-background shadow-lg"
    >
      <div className="flex items-center gap-3 border-b px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Buscar socios o secciones…"
          className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Buscar socios o secciones"
        />
      </div>
      <Command.List className="max-h-80 overflow-y-auto overflow-x-hidden p-2">
        {query.trim() && resultadosSocios.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            No encontramos socios que coincidan con «{query.trim()}».
          </p>
        ) : null}
        <Command.Group heading="Navegación" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
          {navItems.map((item) => (
            <Command.Item
              key={item.path}
              value={item.title}
              onSelect={() => navegar(item.path)}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
            >
              <item.icon className="size-4 text-muted-foreground" />
              <span>{item.title}</span>
            </Command.Item>
          ))}
        </Command.Group>
        {resultadosSocios.length > 0 ? (
          <Command.Group heading="Socios" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
            {resultadosSocios.map((socio) => (
              <Command.Item
                key={socio.id}
                value={`${socio.nombre} ${socio.dni}`}
                onSelect={() => navegar(`/socios?buscar=${encodeURIComponent(socio.dni)}`)}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                    {iniciales(socio.nombre)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium leading-tight">{socio.nombre}</span>
                  <span className="block text-xs text-muted-foreground tabular-nums">{socio.dni}</span>
                </span>
                <SocioEstadoBadge estado={socio.estado} />
              </Command.Item>
            ))}
          </Command.Group>
        ) : null}
      </Command.List>
      <div className="flex items-center gap-4 border-t px-4 py-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            Esc
          </kbd>
          Cerrar
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            <CornerDownLeft className="size-3" />
          </kbd>
          Ir
        </span>
      </div>
    </Command.Dialog>
  )
}

type SearchProviderProps = {
  children: ReactNode
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const listener = (evento: KeyboardEvent) => {
      if (evento.key.toLowerCase() === 'k' && (evento.metaKey || evento.ctrlKey)) {
        evento.preventDefault()
        setOpen((previo) => !previo)
      }
    }
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [])

  return (
    <SearchContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandMenu open={open} onOpenChange={setOpen} />
    </SearchContext.Provider>
  )
}
