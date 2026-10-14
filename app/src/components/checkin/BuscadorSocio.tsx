import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { buscarSocios } from '@/lib/search'
import { cn } from '@/lib/utils'
import type { Membresia, Plan, Socio } from '@/mocks/types'
import { clasesEstado, etiquetaEstado, estadoDeSocio, planDeSocio } from './membresia-ui'

type BuscadorSocioProps = {
  socios: readonly Socio[]
  placeholder: string
  onSelect: (socio: Socio) => void
  className?: string
  /** Membresías reales: con backend activo resuelven plan/estado del socio;
   *  sin ellas se cae a los mocks (modo demo). */
  membresias?: readonly Membresia[]
  planes?: readonly Plan[]
}

export function BuscadorSocio({
  socios,
  placeholder,
  onSelect,
  className,
  membresias,
  planes,
}: BuscadorSocioProps) {
  const [query, setQuery] = useState('')
  const [enfocado, setEnfocado] = useState(false)

  const resultados = useMemo(() => buscarSocios(socios, query), [socios, query])

  const planPorId = useMemo(
    () => new Map((planes ?? []).map((plan) => [plan.id, plan])),
    [planes],
  )
  const membresiaDe = useMemo(() => {
    if (membresias === undefined) return undefined
    const porSocio = new Map<string, Membresia>()
    for (const membresia of membresias) {
      const actual = porSocio.get(membresia.socioId)
      if (actual === undefined || membresia.fechaFin > actual.fechaFin) {
        porSocio.set(membresia.socioId, membresia)
      }
    }
    return porSocio
  }, [membresias])

  function infoDeSocio(socio: Socio): { estado: ReturnType<typeof estadoDeSocio>; plan?: Plan } {
    if (membresiaDe === undefined) {
      return { estado: estadoDeSocio(socio), plan: planDeSocio(socio.id) }
    }
    const membresia = membresiaDe.get(socio.id)
    if (membresia === undefined) return { estado: estadoDeSocio(socio), plan: undefined }
    return { estado: membresia.estado, plan: planPorId.get(membresia.planId) }
  }

  const abierto = enfocado && query.trim().length > 0

  function seleccionar(socio: Socio) {
    setQuery('')
    setEnfocado(false)
    onSelect(socio)
  }

  return (
    <div
      className={cn('relative', className)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setEnfocado(false)
        }
      }}
    >
      <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setEnfocado(true)
        }}
        onFocus={() => setEnfocado(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setEnfocado(false)
        }}
        placeholder={placeholder}
        aria-label="Buscar socio"
        className="h-16 rounded-xl border-border pr-4 pl-14 text-lg shadow-none md:text-lg"
      />
      {abierto && (
        <div
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border bg-popover shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          {resultados.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Sin resultados para "{query.trim()}"
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto p-1">
              {resultados.map((socio) => {
                const { estado, plan } = infoDeSocio(socio)
                return (
                  <li key={socio.id}>
                    <button
                      type="button"
                      onClick={() => seleccionar(socio)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {socio.nombre}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {plan?.nombre ?? 'Sin plan'} · DNI {socio.dni}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn('text-[11px]', clasesEstado[estado])}
                        >
                          {etiquetaEstado[estado]}
                        </Badge>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {socio.codigo}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
