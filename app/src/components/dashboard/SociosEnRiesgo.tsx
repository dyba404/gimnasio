import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { diasParaVencer, iniciales } from '@/lib/format'
import { fechaHoyIso } from '@/mocks/bitacora'
import type { Asistencia } from '@/mocks/asistencias'
import type { Membresia, Socio } from '@/mocks/types'

/** Días de asistencias que carga el Dashboard para este widget: cubre el
 * umbral "crítico" y el límite exacto de "hace N días". */
export const DIAS_VENTANA_RIESGO = 20

const DIAS_SIN_VENIR = 10

type SociosEnRiesgoProps = {
  socios: readonly Socio[]
  membresias: readonly Membresia[]
  asistencias: readonly Asistencia[]
  hoyIso?: string
  cargando?: boolean
  /** La carga de asistencias falló: mostrar el aviso, no riesgos inventados. */
  error?: boolean
}

type Riesgo = {
  socio: Socio
  diasSinAsistir: number
}

function aFecha(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Date(anio, (mes ?? 1) - 1, dia ?? 1)
}

function diasDesde(iso: string, hoy: Date): number {
  return Math.round((hoy.getTime() - aFecha(iso).getTime()) / 86_400_000)
}

function calcularRiesgos(
  socios: readonly Socio[],
  asistencias: readonly Asistencia[],
  hoyIso: string,
): readonly Riesgo[] {
  const hoy = aFecha(hoyIso)
  const ultimaPorSocio = new Map<string, string>()
  for (const asistencia of asistencias) {
    const previa = ultimaPorSocio.get(asistencia.socioId)
    if (previa === undefined || asistencia.fecha > previa) {
      ultimaPorSocio.set(asistencia.socioId, asistencia.fecha)
    }
  }
  return socios
    .flatMap((socio): Riesgo[] => {
      const ultima = ultimaPorSocio.get(socio.id)
      // Sin registro en la ventana: lo más lejos que puede llevar sin venir
      // es desde su fecha de registro (nunca vino o vino hace 20+ días).
      const dias =
        ultima === undefined
          ? diasDesde(socio.fechaRegistro, hoy)
          : diasDesde(ultima, hoy)
      if (dias < DIAS_SIN_VENIR) return []
      return [{ socio, diasSinAsistir: dias }]
    })
    .sort((a, b) => b.diasSinAsistir - a.diasSinAsistir)
}

export function SociosEnRiesgo({
  socios,
  membresias,
  asistencias,
  hoyIso = fechaHoyIso(),
  cargando = false,
  error = false,
}: SociosEnRiesgoProps) {
  const riesgos = useMemo(
    () => calcularRiesgos(socios, asistencias, hoyIso).slice(0, 5),
    [socios, asistencias, hoyIso],
  )
  const membresiaPorSocio = useMemo(() => {
    const mapa = new Map<string, Membresia>()
    for (const membresia of membresias) {
      const previa = mapa.get(membresia.socioId)
      if (previa === undefined || membresia.fechaFin > previa.fechaFin) {
        mapa.set(membresia.socioId, membresia)
      }
    }
    return mapa
  }, [membresias])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-muted-foreground" />
          Socios en riesgo
        </CardTitle>
        <CardDescription>Sin venir 10+ días</CardDescription>
      </CardHeader>
      <CardContent>
        {cargando ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Revisando asistencias…
          </p>
        ) : error ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No se pudieron cargar las asistencias.
          </p>
        ) : socios.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Sin socios registrados todavía.
          </p>
        ) : riesgos.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Todos los socios vienen entrenando. Buen ritmo.
          </p>
        ) : (
          <ul className="space-y-3">
            {riesgos.map((riesgo) => {
              const dias = riesgo.diasSinAsistir
              const membresia = membresiaPorSocio.get(riesgo.socio.id)
              const diasParaFin = membresia
                ? diasParaVencer(membresia.fechaFin)
                : Number.POSITIVE_INFINITY
              const porVencer = membresia !== undefined && diasParaFin >= 0 && diasParaFin <= 7
              return (
                <li
                  key={riesgo.socio.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                >
                  <Avatar>
                    <AvatarFallback>{iniciales(riesgo.socio.nombre)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{riesgo.socio.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {dias > DIAS_VENTANA_RIESGO
                        ? 'hace más de 20 días'
                        : `hace ${dias} ${dias === 1 ? 'día' : 'días'}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {porVencer && <Badge variant="outline">riesgo de fuga</Badge>}
                    <Badge
                      className={
                        dias >= DIAS_VENTANA_RIESGO
                          ? 'bg-red-500/15 text-red-700 dark:text-red-400'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      }
                    >
                      {dias >= DIAS_VENTANA_RIESGO ? 'Crítico' : 'En riesgo'}
                    </Badge>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
