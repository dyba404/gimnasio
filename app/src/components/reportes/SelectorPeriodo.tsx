import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { OPCIONES_PERIODO } from '@/components/reportes/periodo'

type SelectorPeriodoProps = {
  valor: number
  onChange: (dias: number) => void
}

export function SelectorPeriodo({ valor, onChange }: SelectorPeriodoProps) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-lg border bg-muted/30 p-1"
      role="group"
      aria-label="Periodo de análisis"
    >
      {OPCIONES_PERIODO.map((opcion) => {
        const activo = opcion.dias === valor
        return (
          <Button
            key={opcion.dias}
            variant={activo ? 'secondary' : 'ghost'}
            size="sm"
            className={cn('text-muted-foreground', activo && 'text-foreground')}
            onClick={() => onChange(opcion.dias)}
            aria-pressed={activo}
          >
            {opcion.etiqueta}
          </Button>
        )
      })}
    </div>
  )
}
