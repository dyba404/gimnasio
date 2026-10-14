import { useMemo } from 'react'
import { Flame } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { asistenciasMock } from '@/mocks/asistencias'
import type { Asistencia } from '@/mocks/asistencias'
import { fechaHoyIso } from '@/mocks/bitacora'
import { sociosMock } from '@/mocks/data'
import type { Socio } from '@/mocks/types'
import { rankingRachas } from '@/mocks/logros'
import { iniciales } from '@/lib/format'
import { cn } from '@/lib/utils'

type SociosEnRachaProps = {
  asistencias?: readonly Asistencia[]
  hoyIso?: string
  sociosMap?: ReadonlyMap<string, Socio>
}

const sociosMapMock: ReadonlyMap<string, Socio> = new Map(
  sociosMock.map((socio): [string, Socio] => [socio.id, socio]),
)

function claseBadge(racha: number): string {
  if (racha >= 7) return 'bg-red-500/15 text-red-700 dark:text-red-400'
  if (racha >= 3) return 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
  return 'bg-muted text-muted-foreground'
}

export function SociosEnRacha({
  asistencias = asistenciasMock,
  hoyIso = fechaHoyIso(),
  sociosMap = sociosMapMock,
}: SociosEnRachaProps) {
  const top = useMemo(
    () =>
      rankingRachas(asistencias, Array.from(sociosMap.keys()), hoyIso).slice(0, 3),
    [asistencias, hoyIso, sociosMap],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="size-4 text-orange-500" />
          Socios en racha
        </CardTitle>
        <CardDescription>Entrenando días seguidos</CardDescription>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Sin rachas registradas aún.
          </p>
        ) : (
          <ul className="space-y-3">
            {top.map((entrada) => {
              const socio = sociosMap.get(entrada.socioId)
              if (!socio) return null
              return (
                <li
                  key={entrada.socioId}
                  className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                >
                  <Avatar>
                    <AvatarFallback>{iniciales(socio.nombre)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{socio.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {entrada.racha} {entrada.racha === 1 ? 'día seguido' : 'días seguidos'}
                    </p>
                  </div>
                  <Badge className={cn('gap-1', claseBadge(entrada.racha))}>
                    <Flame className="size-3" />
                    {entrada.racha}
                  </Badge>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
