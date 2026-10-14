import { useEffect, useMemo, useState } from 'react'
import { Banknote, CreditCard, QrCode, Users } from 'lucide-react'
import { ActividadReciente } from '@/components/dashboard/ActividadReciente'
import { KpiCards } from '@/components/dashboard/KpiCards'
import type { KpiPanel } from '@/components/dashboard/KpiCards'
import { WidgetMorosidad } from '@/components/dashboard/WidgetMorosidad'
import {
  DIAS_VENTANA_RIESGO as DIAS_VENTANA_RIESGO_WIDGET,
  SociosEnRiesgo,
} from '@/components/dashboard/SociosEnRiesgo'
import { SociosEnRacha } from '@/components/dashboard/SociosEnRacha'
import { VencimientosProximos } from '@/components/memberships/VencimientosProximos'
import { diasParaVencer, formatoSoles } from '@/lib/format'
import {
  cargarAsistenciasRecientes,
  cargarMembresias,
  cargarPagos,
  cargarPlanes,
  cargarSocios,
  contarAsistenciasHoy,
  contarPagosDeHoy,
  fechaIsoMenosDias,
  renovarMembresia,
} from '@/lib/datos'
import { supabaseDisponible } from '@/lib/supabase'
import { asistenciasMock } from '@/mocks/asistencias'
import type { Asistencia } from '@/mocks/asistencias'
import { fechaHoyIso } from '@/mocks/bitacora'
import { movimientosIniciales } from '@/mocks/caja-data'
import { membresiasMock, planesMock, sociosMock, sumarDiasIso } from '@/mocks/data'
import type { Membresia, Plan, Socio } from '@/mocks/types'
import { pagosMock } from '@/mocks/pagos'
import type { Pago } from '@/mocks/pagos'

/** Rachas: asistencias recientes con límite alto. */
const LIMITE_ASISTENCIAS_RACHA = 1000
/** Riesgo: una sola carga agrupada por socio dentro de la ventana. */
const LIMITE_ASISTENCIAS_RIESGO = 2000
const DIAS_VENTANA_RIESGO = DIAS_VENTANA_RIESGO_WIDGET
type ResumenPagosHoy = { monto: number; cantidad: number }

/** Modo demo: los cobros de hoy provienen de la caja demo (mismos datos que
 * CajaPage), nunca de una constante inventada. */
function cobradoHoyDemo(): ResumenPagosHoy {
  const cobros = movimientosIniciales.filter(
    (movimiento) => movimiento.concepto === 'membresia',
  )
  return {
    monto: cobros.reduce((suma, movimiento) => suma + movimiento.monto, 0),
    cantidad: cobros.length,
  }
}

function asistenciasDeHoy(asistencias: readonly Asistencia[], hoyIso: string): number {
  return asistencias.filter((asistencia) => asistencia.fecha === hoyIso).length
}

/** Tendencia real de pagos completados hoy vs ayer; undefined si no aporta. */
function tendenciaPagos(
  pagos: readonly Pago[],
  hoyIso: string,
  ayerIso: string,
): string | undefined {
  const contar = (fecha: string) =>
    pagos.filter((pago) => pago.fecha === fecha && pago.estado === 'completado').length
  const deHoy = contar(hoyIso)
  const deAyer = contar(ayerIso)
  if (deAyer === 0) return undefined
  if (deHoy === deAyer) return 'igual que ayer'
  const diferencia = deHoy - deAyer
  return `${diferencia > 0 ? '+' : ''}${diferencia} vs ayer`
}

export default function Dashboard() {
  const backendActivo = supabaseDisponible()
  const hoyIso = fechaHoyIso()
  const [renovadas, setRenovadas] = useState<ReadonlySet<string>>(new Set<string>())
  const [renovandoId, setRenovandoId] = useState<string | null>(null)
  const [errorRenovacion, setErrorRenovacion] = useState<string | null>(null)
  const [socios, setSocios] = useState<readonly Socio[] | null>(
    backendActivo ? null : sociosMock,
  )
  const [membresiasBackend, setMembresiasBackend] = useState<
    readonly Membresia[] | null
  >(backendActivo ? null : membresiasMock)
  const [planesBackend, setPlanesBackend] = useState<readonly Plan[] | null>(
    backendActivo ? null : planesMock,
  )
  const [pagosBackend, setPagosBackend] = useState<readonly Pago[] | null>(
    backendActivo ? null : pagosMock,
  )
  const [pagosTendencia, setPagosTendencia] = useState<readonly Pago[] | null>(null)
  const [asistenciasHoy, setAsistenciasHoy] = useState<number | null>(
    backendActivo ? null : asistenciasDeHoy(asistenciasMock, hoyIso),
  )
  const [resumenPagosHoy, setResumenPagosHoy] = useState<ResumenPagosHoy | null>(
    backendActivo ? null : cobradoHoyDemo(),
  )
  const [errorPagosHoy, setErrorPagosHoy] = useState(false)
  const [asistenciasRacha, setAsistenciasRacha] = useState<readonly Asistencia[] | null>(
    backendActivo ? null : asistenciasMock,
  )
  const [asistenciasRiesgo, setAsistenciasRiesgo] = useState<
    readonly Asistencia[] | null
  >(backendActivo ? null : asistenciasMock)
  // "Carga terminada" (éxito o error) para no mostrar empties falsos mientras carga.
  const [sociosListos, setSociosListos] = useState(!backendActivo)
  const [asistenciasRiesgoListas, setAsistenciasRiesgoListas] = useState(
    !backendActivo,
  )
  const [errorAsistenciasRiesgo, setErrorAsistenciasRiesgo] = useState(false)

  useEffect(() => {
    if (!backendActivo) return
    let cancelado = false
    void cargarSocios().then((remotos) => {
      if (!cancelado) {
        setSociosListos(true)
        if (remotos !== null) setSocios(remotos)
      }
    })
    void cargarMembresias().then((remotas) => {
      if (!cancelado && remotas !== null) setMembresiasBackend(remotas)
    })
    void cargarPlanes().then((remotos) => {
      if (!cancelado && remotos !== null) setPlanesBackend(remotos)
    })
    void contarAsistenciasHoy().then((total) => {
      if (!cancelado && total !== null) setAsistenciasHoy(total)
    })
    void contarPagosDeHoy().then((resumen) => {
      if (!cancelado) {
        if (resumen !== null) setResumenPagosHoy(resumen)
        else setErrorPagosHoy(true)
      }
    })
    void cargarPagos().then((remotos) => {
      if (!cancelado && remotos !== null) {
        setPagosBackend(remotos)
        setPagosTendencia(remotos)
      }
    })
    void cargarAsistenciasRecientes(LIMITE_ASISTENCIAS_RACHA).then((recientes) => {
      if (!cancelado && recientes !== null) setAsistenciasRacha(recientes)
    })
    void cargarAsistenciasRecientes(
      LIMITE_ASISTENCIAS_RIESGO,
      fechaIsoMenosDias(DIAS_VENTANA_RIESGO),
    ).then((recientes) => {
      if (!cancelado) {
        setAsistenciasRiesgoListas(true)
        if (recientes !== null) setAsistenciasRiesgo(recientes)
        else setErrorAsistenciasRiesgo(true)
      }
    })
    return () => {
      cancelado = true
    }
  }, [backendActivo])

  // Fallback a planesMock solo en modo demo; con backend, "—" hasta cargar.
  const planesMap = useMemo(
    () =>
      new Map<string, Plan>(
        (planesBackend ?? (backendActivo ? [] : planesMock)).map(
          (plan): [string, Plan] => [plan.id, plan],
        ),
      ),
    [planesBackend, backendActivo],
  )

  const listaSocios = socios ?? []

  const sociosMap = useMemo(
    () =>
      new Map<string, Socio>(
        listaSocios.map((socio): [string, Socio] => [socio.id, socio]),
      ),
    [listaSocios],
  )

  const membresias = useMemo(() => {
    const base = (membresiasBackend ?? []).filter(
      (membresia) => !renovadas.has(membresia.id),
    )
    const vigentePorSocio = new Map<string, boolean>()
    for (const membresia of base) {
      if (membresia.estado !== 'vencida') vigentePorSocio.set(membresia.socioId, true)
    }
    return base.filter(
      (membresia) =>
        membresia.estado !== 'vencida' || !vigentePorSocio.has(membresia.socioId),
    )
  }, [membresiasBackend, renovadas])

  const sociosActivos = listaSocios.filter((socio) => socio.estado === 'activo').length
  const membresiasVencidas = membresias.filter(
    (membresia) => membresia.estado === 'vencida',
  ).length

  const kpis: readonly KpiPanel[] = [
    {
      titulo: 'Socios activos',
      valor: String(sociosActivos),
      tendencia: undefined,
      icono: Users,
    },
    {
      titulo: 'Membresías vencidas',
      valor: String(membresiasVencidas),
      tendencia: undefined,
      icono: CreditCard,
    },
    {
      titulo: 'Cobrado hoy',
      valor: resumenPagosHoy === null ? '—' : formatoSoles(resumenPagosHoy.monto),
      tendencia:
        resumenPagosHoy === null
          ? errorPagosHoy
            ? undefined
            : 'Cargando…'
          : (pagosTendencia !== null
              ? tendenciaPagos(pagosTendencia, hoyIso, fechaIsoMenosDias(1))
              : undefined) ??
            `${resumenPagosHoy.cantidad} ${
              resumenPagosHoy.cantidad === 1 ? 'pago' : 'pagos'
            } hoy`,
      title:
        resumenPagosHoy === null && errorPagosHoy
          ? 'No se pudo cargar'
          : undefined,
      icono: Banknote,
    },
    {
      titulo: 'Asistencias hoy',
      valor: asistenciasHoy === null ? '—' : String(asistenciasHoy),
      tendencia: undefined,
      icono: QrCode,
    },
  ]

  const renovar = async (membresiaId: string) => {
    if (renovandoId !== null) return
    const membresia = (membresiasBackend ?? []).find(
      (candidata) => candidata.id === membresiaId,
    )
    if (membresia === undefined) return
    const plan = planesMap.get(membresia.planId)
    const duracion = plan?.duracionDias ?? 30
    // Vencida: la renovación nace desde hoy. Vigente: desde su fecha fin.
    const origen = diasParaVencer(membresia.fechaFin) >= 0 ? membresia.fechaFin : hoyIso
    const nuevaFechaFin = sumarDiasIso(origen, duracion)
    setRenovandoId(membresiaId)
    setErrorRenovacion(null)
    if (backendActivo) {
      const ok = await renovarMembresia({
        membresiaId,
        fechaFin: nuevaFechaFin,
        estado: 'vigente',
      })
      setRenovandoId(null)
      if (!ok) {
        setErrorRenovacion('No se pudo renovar la membresía. Inténtalo de nuevo.')
        return
      }
    } else {
      setRenovandoId(null)
    }
    setRenovadas((previos) => new Set(previos).add(membresiaId))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Panel</h2>
        <p className="text-sm text-muted-foreground">Resumen de hoy en tu gimnasio</p>
      </div>

      <KpiCards kpis={kpis} />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <WidgetMorosidad membresias={membresias} socios={sociosMap} planes={planesMap} />
          <SociosEnRiesgo
            socios={listaSocios}
            membresias={membresias}
            asistencias={asistenciasRiesgo ?? []}
            hoyIso={hoyIso}
            cargando={!(sociosListos && asistenciasRiesgoListas)}
            error={errorAsistenciasRiesgo}
          />
          <SociosEnRacha
            asistencias={asistenciasRacha ?? []}
            hoyIso={hoyIso}
            sociosMap={sociosMap}
          />
        </div>
        <div className="space-y-3">
          <VencimientosProximos
            membresias={membresias}
            socios={sociosMap}
            planes={planesMap}
            onRenovar={renovar}
          />
          {errorRenovacion !== null && (
            <p role="alert" className="text-xs text-destructive">
              {errorRenovacion}
            </p>
          )}
        </div>
      </div>

      <ActividadReciente
        pagos={pagosBackend ?? []}
        asistenciasRecientes={asistenciasRacha ?? []}
        sociosMap={sociosMap}
        hoyIso={hoyIso}
      />
    </div>
  )
}
