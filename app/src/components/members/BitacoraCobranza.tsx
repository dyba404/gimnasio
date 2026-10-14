import { useState } from 'react'
import { Bell, Footprints, MessageCircle, Phone, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  claseResultado,
  etiquetaResultado,
  etiquetaTipo,
  fechaHoyIso,
  fechaRelativa,
  gestionesDeSocio,
  registrarGestion as registrarGestionLocal,
  resultadosGestion,
  tiposGestion,
} from '@/mocks/bitacora'
import type { GestionCobranza, ResultadoGestion, TipoGestion } from '@/mocks/bitacora'
import { cn } from '@/lib/utils'

type BitacoraCobranzaProps = {
  socioId: string
  compacto?: boolean
  gestiones?: readonly GestionCobranza[]
  onRegistrar?: (input: {
    socioId: string
    tipo: string
    nota: string
    resultado: string
  }) => Promise<boolean>
}

const iconoPorTipo: Record<TipoGestion, LucideIcon> = {
  whatsapp: MessageCircle,
  llamada: Phone,
  visita: Footprints,
  recordatorio: Bell,
}

const selectClases =
  'h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none md:text-sm focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30'

export function BitacoraCobranza({
  socioId,
  compacto = false,
  gestiones: gestionesProp,
  onRegistrar,
}: BitacoraCobranzaProps) {
  const [gestiones, setGestiones] = useState<readonly GestionCobranza[]>(() =>
    gestionesProp ?? gestionesDeSocio(socioId),
  )
  const [expandido, setExpandido] = useState(false)
  const [formAbierto, setFormAbierto] = useState(false)
  const [tipo, setTipo] = useState<TipoGestion>('whatsapp')
  const [resultado, setResultado] = useState<ResultadoGestion>('pendiente')
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(false)
  const [socioIdPrevio, setSocioIdPrevio] = useState(socioId)

  if (socioIdPrevio !== socioId) {
    setSocioIdPrevio(socioId)
    setGestiones(gestionesProp ?? gestionesDeSocio(socioId))
    setExpandido(false)
    setFormAbierto(false)
  }

  const visibles = compacto && !expandido ? gestiones.slice(0, 3) : gestiones
  const ultima = gestiones[0]

  const guardar = async () => {
    const texto = nota.trim()
    if (!texto || guardando) return
    const nueva: GestionCobranza = {
      socioId,
      tipo,
      resultado,
      nota: texto,
      fecha: fechaHoyIso(),
      id: `local-${Date.now()}`,
    }
    if (onRegistrar !== undefined) {
      setGuardando(true)
      setError(false)
      const ok = await onRegistrar({
        socioId,
        tipo,
        nota: texto,
        resultado,
      })
      setGuardando(false)
      if (!ok) {
        setError(true)
        return
      }
      setGestiones((previas) => [nueva, ...previas])
    } else {
      setGestiones((previas) =>
        registrarGestionLocal(previas, {
          socioId,
          tipo,
          resultado,
          nota: texto,
          fecha: fechaHoyIso(),
        }),
      )
    }
    setNota('')
    setError(false)
    setFormAbierto(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Bitácora de cobranza</p>
        <Badge variant="outline" className="tabular-nums">
          {gestiones.length} {gestiones.length === 1 ? 'gestión' : 'gestiones'}
        </Badge>
      </div>
      {gestiones.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Sin gestiones de cobranza todavía
        </p>
      ) : (
        ultima && (
          <p className="text-xs text-muted-foreground">
            Última: {etiquetaResultado[ultima.resultado]} · {fechaRelativa(ultima.fecha)}
          </p>
        )
      )}
      {gestiones.length > 0 && (
        <div className="relative">
          <div aria-hidden className="absolute bottom-3 left-4 top-3 w-px bg-border" />
          <ul className="space-y-4">
            {visibles.map((gestion) => {
              const Icono = iconoPorTipo[gestion.tipo]
              return (
                <li key={gestion.id} className="flex gap-3">
                  <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
                    <Icono className="size-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{etiquetaTipo[gestion.tipo]}</p>
                      <Badge className={cn('text-[11px]', claseResultado[gestion.resultado])}>
                        {etiquetaResultado[gestion.resultado]}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{gestion.nota}</p>
                    <p className="text-xs text-muted-foreground/80">
                      {fechaRelativa(gestion.fecha)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {compacto && gestiones.length > 3 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => setExpandido((valor) => !valor)}
        >
          {expandido ? 'Ver menos' : `Ver todas (${gestiones.length})`}
        </Button>
      )}
      {formAbierto ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select
              aria-label="Tipo de gestión"
              value={tipo}
              onChange={(evento) => setTipo(evento.target.value as TipoGestion)}
              className={selectClases}
            >
              {tiposGestion.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {etiquetaTipo[opcion]}
                </option>
              ))}
            </select>
            <select
              aria-label="Resultado de la gestión"
              value={resultado}
              onChange={(evento) => setResultado(evento.target.value as ResultadoGestion)}
              className={selectClases}
            >
              {resultadosGestion.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {etiquetaResultado[opcion]}
                </option>
              ))}
            </select>
          </div>
          <Input
            value={nota}
            onChange={(evento) => setNota(evento.target.value)}
            onKeyDown={(evento) => {
              if (evento.key === 'Enter') {
                evento.preventDefault()
                void guardar()
              }
            }}
            placeholder="Nota de la gestión"
            required
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setFormAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={guardando}
              onClick={() => {
                void guardar()
              }}
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
              No se pudo registrar la gestión. Intenta de nuevo.
            </p>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setFormAbierto(true)}
        >
          <Plus />
          Registrar gestión
        </Button>
      )}
    </div>
  )
}
