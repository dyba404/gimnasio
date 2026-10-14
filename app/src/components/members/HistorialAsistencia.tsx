import { useMemo } from 'react'
import {
  asistenciasDeSocio,
  diasSinAsistir,
  ultimosDiasIso,
} from '@/mocks/asistencias'
import { cn } from '@/lib/utils'

type HistorialAsistenciaProps = {
  socioId: string
  fechas?: readonly string[]
  ultimaFecha?: string | null
}

const DIAS = 30

function diasDesde(fecha: string): number {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const ultima = new Date(anio, (mes ?? 1) - 1, dia ?? 1)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((hoy.getTime() - ultima.getTime()) / 86_400_000))
}

export function HistorialAsistencia({ socioId, fechas, ultimaFecha }: HistorialAsistenciaProps) {
  const fechasEfectivas = useMemo(
    () => (fechas !== undefined ? [...fechas] : [...asistenciasDeSocio(socioId, DIAS)]),
    [socioId, fechas],
  )
  const dias = useMemo(() => {
    const asistidas = new Set(fechasEfectivas)
    return ultimosDiasIso(DIAS).map((fecha) => ({ fecha, asistio: asistidas.has(fecha) }))
  }, [fechasEfectivas])

  const total = fechasEfectivas.length
  const sinAsistir = useMemo(() => {
    if (ultimaFecha !== undefined) {
      return ultimaFecha === null || ultimaFecha === '' ? Number.POSITIVE_INFINITY : diasDesde(ultimaFecha)
    }
    return diasSinAsistir(socioId)
  }, [socioId, ultimaFecha])
  const nuncaAsistio = !Number.isFinite(sinAsistir)

  if (nuncaAsistio) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Sin asistencias registradas todavía.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" aria-label="Asistencias de los últimos 30 días">
        {dias.map((dia) => (
          <span
            key={dia.fecha}
            title={dia.fecha}
            className={cn(
              'size-3 rounded-[3px]',
              dia.asistio
                ? 'bg-emerald-500'
                : 'bg-muted ring-1 ring-inset ring-border/60',
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {total} {total === 1 ? 'asistencia' : 'asistencias'} este mes
        </span>
        <span>
          Última visita: {sinAsistir === 0 ? 'hoy' : `hace ${sinAsistir} ${sinAsistir === 1 ? 'día' : 'días'}`}
        </span>
      </div>
    </div>
  )
}
