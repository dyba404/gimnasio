import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

type DataTableToolbarProps = {
  busqueda: string
  onBusquedaChange: (valor: string) => void
  placeholder?: string
  title?: string
  description?: string
  children?: ReactNode
}

export function DataTableToolbar({
  busqueda,
  onBusquedaChange,
  placeholder = 'Buscar…',
  title,
  description,
  children,
}: DataTableToolbarProps) {
  return (
    <div className="space-y-4">
      {title || description ? (
        <div className="space-y-1">
          {title ? <h3 className="text-lg font-semibold tracking-tight">{title}</h3> : null}
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(evento) => onBusquedaChange(evento.target.value)}
            placeholder={placeholder}
            className="pl-9"
            aria-label={placeholder}
          />
        </div>
        {children}
      </div>
    </div>
  )
}
