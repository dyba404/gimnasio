import { useMemo } from 'react'
import { Flame, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { asistenciasMock } from '@/mocks/asistencias'
import type { Asistencia } from '@/mocks/asistencias'
import { fechaHoyIso } from '@/mocks/bitacora'
import { logrosConseguidos, logrosMock, rachaActual, rachaMejor } from '@/mocks/logros'
import { cn } from '@/lib/utils'

type LogrosSocioProps = {
  socioId: string
  asistencias?: readonly Asistencia[]
  hoyIso?: string
}

function claseRacha(racha: number): string {
  if (racha >= 7) return 'text-red-500'
  if (racha >= 3) return 'text-amber-500'
  return 'text-muted-foreground'
}

export function LogrosSocio({ socioId, asistencias = asistenciasMock, hoyIso = fechaHoyIso() }: LogrosSocioProps) {
  const racha = useMemo(() => rachaActual(asistencias, socioId, hoyIso), [asistencias, socioId, hoyIso])
  const mejor = useMemo(() => rachaMejor(asistencias, socioId), [asistencias, socioId])
  const conseguidos = useMemo(
    () => logrosConseguidos(logrosMock, asistencias, socioId, hoyIso),
    [asistencias, socioId, hoyIso],
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Trophy className="size-4 text-muted-foreground" />
          Logros
        </p>
        <span className="flex items-center gap-1.5 text-sm">
          <Flame className={cn('size-4', claseRacha(racha))} />
          <span className={cn('font-medium tabular-nums', claseRacha(racha))}>
            {racha} {racha === 1 ? 'día' : 'días'}
          </span>
        </span>
      </div>
      <p className="text-xs text-muted-foreground">Mejor racha: {mejor}</p>
      {conseguidos.length === 0 ? (
        <p className="py-2 text-center text-sm text-muted-foreground">
          Aún sin logros — cada visita suma
        </p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {conseguidos.map((logro) => {
            const definido = logrosMock.find((definicion) => definicion.id === logro.logroId)
            if (!definido) return null
            return (
              <li key={logro.logroId}>
                <Badge variant="outline" className="gap-1 bg-muted/50">
                  <span aria-hidden>{definido.emoji}</span>
                  {definido.nombre}
                </Badge>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
