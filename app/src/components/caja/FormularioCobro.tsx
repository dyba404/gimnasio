import { useState } from 'react'
import { Banknote, QrCode, Smartphone, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BuscadorSocio } from '@/components/checkin/BuscadorSocio'
import { planDeSocio } from '@/components/checkin/membresia-ui'
import { formatoSoles } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  etiquetaConcepto,
  etiquetaMetodo,
  nuevoId,
  horaAhora,
  precioInscripcion,
} from '@/mocks/caja-data'
import type {
  ConceptoCobro,
  MetodoPago,
  MovimientoCaja,
} from '@/mocks/caja-data'
import type { Membresia, Plan, Socio } from '@/mocks/types'
import { parseMonto } from './monto'

const conceptos: readonly ConceptoCobro[] = ['membresia', 'inscripcion', 'producto']

type MetodoUI = {
  valor: MetodoPago
  icono: LucideIcon
  activo: string
}

const metodosUI: readonly MetodoUI[] = [
  {
    valor: 'efectivo',
    icono: Banknote,
    activo: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    valor: 'yape',
    icono: Smartphone,
    activo: 'border-purple-500/60 bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  {
    valor: 'plin',
    icono: QrCode,
    activo: 'border-sky-500/60 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
]

type FormularioCobroProps = {
  socios: readonly Socio[]
  onRegistrar: (movimiento: MovimientoCaja, socio: Socio) => boolean | Promise<boolean>
  membresias?: readonly Membresia[]
  planes?: readonly Plan[]
}

export function FormularioCobro({ socios, onRegistrar, membresias, planes }: FormularioCobroProps) {
  const [socio, setSocio] = useState<Socio | null>(null)
  const [concepto, setConcepto] = useState<ConceptoCobro>('membresia')
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo')
  const [monto, setMonto] = useState('')
  const [exito, setExito] = useState(false)
  const [detalleExito, setDetalleExito] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [registrando, setRegistrando] = useState(false)

  const montoParseado = parseMonto(monto)
  const montoValor = montoParseado.valor
  const puedeRegistrar = socio !== null && montoValor !== null && !registrando

  function limpiarFeedback() {
    setExito(false)
    setDetalleExito(null)
    setError(false)
  }

  function planDelSocio(socio: Socio) {
    if (membresias === undefined || planes === undefined) {
      return planDeSocio(socio.id)
    }
    const candidatas = membresias.filter((fila) => fila.socioId === socio.id)
    if (candidatas.length === 0) return undefined
    let mejor = candidatas[0]
    for (const fila of candidatas) {
      if (fila.fechaFin > mejor.fechaFin) mejor = fila
    }
    return planes.find((candidato) => candidato.id === mejor.planId)
  }

  function seleccionarSocio(elegido: Socio) {
    setSocio(elegido)
    limpiarFeedback()
    if (concepto === 'membresia') {
      const plan = planDelSocio(elegido)
      setMonto(plan ? String(plan.precio) : '')
    }
  }

  function limpiarSocio() {
    setSocio(null)
    limpiarFeedback()
    if (concepto === 'membresia') setMonto('')
  }

  function cambiarConcepto(nuevo: ConceptoCobro) {
    setConcepto(nuevo)
    limpiarFeedback()
    if (nuevo === 'membresia' && socio) {
      const plan = planDeSocio(socio.id)
      setMonto(plan ? String(plan.precio) : '')
    } else if (nuevo === 'inscripcion') {
      setMonto(String(precioInscripcion))
    } else {
      setMonto('')
    }
  }

  async function registrar() {
    if (!socio || montoValor === null || registrando) return
    const movimiento: MovimientoCaja = {
      id: nuevoId(),
      hora: horaAhora(),
      socioNombre: socio.nombre,
      concepto,
      metodo,
      monto: montoValor,
    }
    setRegistrando(true)
    const ok = await onRegistrar(movimiento, socio)
    setRegistrando(false)
    if (ok === false) {
      setError(true)
      return
    }
    setExito(true)
    if (concepto === 'membresia') {
      setDetalleExito(
        socio.estado === 'moroso'
          ? 'Membresía renovada y socio reactivado ✓'
          : 'Membresía renovada ✓',
      )
    } else {
      setDetalleExito(null)
    }
    setSocio(null)
    setMonto('')
  }

  const planSeleccionado = socio ? planDelSocio(socio) : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar cobro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium">Socio</p>
          {socio ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{socio.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {socio.codigo} · {planSeleccionado?.nombre ?? 'Sin plan'}
                  {socio.estado === 'moroso' && (
                    <span className="text-red-600 dark:text-red-400">
                      {' '}
                      · moroso: el cobro renovará su membresía
                    </span>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Quitar socio"
                onClick={limpiarSocio}
              >
                <X />
              </Button>
            </div>
          ) : (
            <BuscadorSocio
              socios={socios}
              placeholder="Buscar socio por nombre o código..."
              onSelect={seleccionarSocio}
              membresias={membresias}
              planes={planes}
            />
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Concepto</p>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {conceptos.map((valor) => (
              <button
                key={valor}
                type="button"
                aria-pressed={concepto === valor}
                onClick={() => cambiarConcepto(valor)}
                className={cn(
                  'h-9 rounded-md text-sm font-medium transition-colors',
                  concepto === valor
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {etiquetaConcepto[valor]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="monto-cobro" className="text-sm font-medium">
            Monto
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              S/
            </span>
            <Input
              id="monto-cobro"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={monto}
              onChange={(e) => {
                setMonto(e.target.value)
                setExito(false)
                setError(false)
              }}
              placeholder="0.00"
              aria-invalid={montoParseado.error !== null}
              className="h-12 pl-9 text-lg"
            />
          </div>
          {montoParseado.error && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {montoParseado.error}
            </p>
          )}
          {concepto === 'membresia' && socio && planSeleccionado && (
            <p className="text-xs text-muted-foreground">
              Monto sugerido según plan {planSeleccionado.nombre}:{' '}
              {formatoSoles(planSeleccionado.precio)}
            </p>
          )}
          {concepto === 'inscripcion' && (
            <p className="text-xs text-muted-foreground">
              Inscripción estándar: {formatoSoles(precioInscripcion)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Método de pago</p>
          <div className="grid grid-cols-3 gap-2">
            {metodosUI.map((m) => {
              const activo = metodo === m.valor
              return (
                <button
                  key={m.valor}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => {
                    setMetodo(m.valor)
                    setExito(false)
                    setError(false)
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-colors',
                    activo
                      ? m.activo
                      : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <m.icono className="size-5" />
                  {etiquetaMetodo[m.valor]}
                </button>
              )
            })}
          </div>
        </div>

        <Button
          className="h-12 w-full text-base"
          disabled={!puedeRegistrar}
          onClick={() => {
            void registrar()
          }}
        >
          {registrando ? 'Registrando…' : 'Registrar'}
        </Button>
        {exito && (
          <p className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Cobro registrado{detalleExito ? ` — ${detalleExito}` : ' ✓'}
          </p>
        )}
        {error && (
          <p role="alert" className="text-center text-sm font-medium text-red-600 dark:text-red-400">
            No se pudo registrar el cobro. Intenta de nuevo.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
