import { Banknote, QrCode } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatoSoles } from '@/lib/format'
import { fechaHoyIso } from '@/mocks/bitacora'
import type { Pago } from '@/mocks/pagos'
import type { Asistencia } from '@/mocks/asistencias'
import type { Socio } from '@/mocks/types'

const LIMITE_ACTIVIDADES = 6

type TipoActividad = 'pago' | 'check-in'

type Actividad = {
  id: string
  tipo: TipoActividad
  titulo: string
  detalle: string
  /** Etiqueta corta para la UI ("hoy 15:12", "12/9/2026"). */
  hace: string
  /** Clave de orden cronológico: fecha ISO + hora 24h ("2026-09-13 15:12"). */
  orden: string
}

type ActividadRecienteProps = {
  pagos?: readonly Pago[]
  asistenciasRecientes?: readonly Asistencia[]
  sociosMap?: ReadonlyMap<string, Socio>
  hoyIso?: string
}

const iconosPorTipo: Record<TipoActividad, LucideIcon> = {
  pago: Banknote,
  'check-in': QrCode,
}

const estilosPorTipo: Record<TipoActividad, string> = {
  pago: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'check-in': 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
}

function nombreMetodo(metodo: string): string {
  if (metodo === 'yape') return 'Yape'
  if (metodo === 'plin') return 'Plin'
  if (metodo === 'efectivo') return 'Efectivo'
  return metodo
}

function etiquetaHora(fecha: string, hora: string | undefined, hoyIso: string): string {
  if (fecha === hoyIso) return hora === undefined ? 'hoy' : `hoy ${hora}`
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return `${dia}/${mes}/${anio}`
}

function aActividad(
  pago: Pago,
  hoyIso: string,
): Actividad {
  return {
    id: pago.id,
    tipo: 'pago',
    titulo: `${pago.nombre} pagó ${pago.planNombre}`,
    detalle: `${nombreMetodo(pago.metodo)} · ${formatoSoles(pago.monto)}`,
    hace: etiquetaHora(pago.fecha, undefined, hoyIso),
    orden: pago.fecha,
  }
}

function aActividadAsistencia(
  asistencia: Asistencia,
  indice: number,
  sociosMap: ReadonlyMap<string, Socio>,
  hoyIso: string,
): Actividad | null {
  const socio = sociosMap.get(asistencia.socioId)
  if (socio === undefined) return null
  return {
    id: `asistencia-${asistencia.socioId}-${asistencia.fecha}-${indice}`,
    tipo: 'check-in',
    titulo: `${socio.nombre} ingresó`,
    detalle: 'Check-in registrado',
    hace: etiquetaHora(asistencia.fecha, asistencia.hora, hoyIso),
    orden: `${asistencia.fecha} ${asistencia.hora ?? '00:00'}`,
  }
}

export function ActividadReciente({
  pagos = [],
  asistenciasRecientes = [],
  sociosMap = new Map<string, Socio>(),
  hoyIso = fechaHoyIso(),
}: ActividadRecienteProps) {
  const actividades = fusionarActividades(
    pagos,
    asistenciasRecientes,
    sociosMap,
    hoyIso,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad reciente</CardTitle>
      </CardHeader>
      <CardContent>
        {actividades.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Sin actividad reciente
          </p>
        ) : (
          <ul className="space-y-4">
            {actividades.map((actividad) => {
              const Icono = iconosPorTipo[actividad.tipo]
              return (
                <li key={actividad.id} className="flex items-center gap-4">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${estilosPorTipo[actividad.tipo]}`}
                  >
                    <Icono className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{actividad.titulo}</p>
                    <p className="text-xs text-muted-foreground">{actividad.detalle}</p>
                  </div>
                  <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                    {actividad.hace}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function fusionarActividades(
  pagos: readonly Pago[],
  asistenciasRecientes: readonly Asistencia[],
  sociosMap: ReadonlyMap<string, Socio>,
  hoyIso: string,
): readonly Actividad[] {
  const pagosActividad = pagos
    .filter((pago) => pago.estado === 'completado')
    .map((pago) => aActividad(pago, hoyIso))
  const checkinsActividad = asistenciasRecientes
    .map((asistencia, indice) =>
      aActividadAsistencia(asistencia, indice, sociosMap, hoyIso),
    )
    .filter((actividad): actividad is Actividad => actividad !== null)
  return [...pagosActividad, ...checkinsActividad]
    .sort((a, b) => (a.orden < b.orden ? 1 : a.orden > b.orden ? -1 : 0))
    .slice(0, LIMITE_ACTIVIDADES)
}
