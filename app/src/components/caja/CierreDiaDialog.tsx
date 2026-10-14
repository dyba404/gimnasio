import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatoSoles } from '@/lib/format'
import { etiquetaMetodo } from '@/mocks/caja-data'
import type { MetodoPago, MovimientoCaja } from '@/mocks/caja-data'
import { cn } from '@/lib/utils'

const clasesMetodo: Record<MetodoPago, string> = {
  efectivo: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  yape: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  plin: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
}

type CierreDiaDialogProps = {
  abierto: boolean
  movimientos: readonly MovimientoCaja[]
  onCerrar: () => void
  onConfirmar: () => void
}

export function CierreDiaDialog({
  abierto,
  movimientos,
  onCerrar,
  onConfirmar,
}: CierreDiaDialogProps) {
  useEffect(() => {
    if (!abierto) return
    function manejarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', manejarTecla)
    return () => window.removeEventListener('keydown', manejarTecla)
  }, [abierto, onCerrar])

  if (!abierto) return null

  const metodos: readonly MetodoPago[] = ['efectivo', 'yape', 'plin']
  const total = movimientos.reduce((suma, m) => suma + m.monto, 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cierre-dia-titulo"
        className="w-full max-w-md space-y-6 rounded-xl border bg-card p-6 shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="cierre-dia-titulo" className="text-lg font-semibold">
              Cierre del día
            </h3>
            <p className="text-sm text-muted-foreground">
              Resumen de la caja de hoy
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cerrar"
            onClick={onCerrar}
          >
            <X />
          </Button>
        </div>

        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">Total recaudado</p>
          <p className="text-3xl font-semibold tabular-nums">
            {formatoSoles(total)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {movimientos.length}{' '}
            {movimientos.length === 1 ? 'transacción' : 'transacciones'}
          </p>
        </div>

        <ul className="space-y-2">
          {metodos.map((metodo) => {
            const subtotal = movimientos
              .filter((m) => m.metodo === metodo)
              .reduce((suma, m) => suma + m.monto, 0)
            return (
              <li key={metodo} className="flex items-center justify-between">
                <Badge
                  variant="secondary"
                  className={cn('text-[11px]', clasesMetodo[metodo])}
                >
                  {etiquetaMetodo[metodo]}
                </Badge>
                <span className="text-sm font-medium tabular-nums">
                  {formatoSoles(subtotal)}
                </span>
              </li>
            )
          })}
        </ul>

        <p className="text-xs text-muted-foreground">
          Al confirmar, los movimientos de hoy se archivarán y la caja quedará
          lista para el día siguiente.
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={onConfirmar}>Confirmar cierre</Button>
        </div>
      </div>
    </div>
  )
}
