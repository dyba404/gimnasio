import { useEffect, useState } from 'react'
import { Banknote, Lock, Receipt, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormularioCobro } from '@/components/caja/FormularioCobro'
import { TablaMovimientos } from '@/components/caja/TablaMovimientos'
import { CierreDiaDialog } from '@/components/caja/CierreDiaDialog'
import { hoyIso } from '@/components/memberships/congelamiento'
import { membresiaMasReciente } from '@/components/checkin/membresia-ui'
import {
  cargarMembresias,
  cargarMovimientosCaja,
  cargarPlanes,
  cargarSocios,
  registrarCobroMembresia,
  registrarMovimientoCaja,
  registrarPagoDeSocio,
} from '@/lib/datos'
import { formatoSoles, movimientosIniciales } from '@/mocks/caja-data'
import {
  calcularEstado,
  membresiasMock,
  planesMock,
  sociosMock,
  sumarDiasIso,
} from '@/mocks/data'
import type { MovimientoCaja } from '@/mocks/caja-data'
import type { Membresia, Plan, Socio } from '@/mocks/types'

const fechaHoy = (() => {
  const texto = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
})()

type KpiCaja = {
  titulo: string
  valor: string
  icono: LucideIcon
}

export default function CajaPage() {
  const [movimientos, setMovimientos] = useState<readonly MovimientoCaja[]>(
    movimientosIniciales,
  )
  const [movimientosBackend, setMovimientosBackend] = useState<boolean>(false)
  const [sociosBackend, setSociosBackend] = useState<Socio[] | null>(null)
  const [sociosDemo, setSociosDemo] = useState<Socio[]>([...sociosMock])
  const [membresias, setMembresias] = useState<readonly Membresia[]>([
    ...membresiasMock,
  ])
  const [planes, setPlanes] = useState<readonly Plan[]>([...planesMock])
  const [cierreAbierto, setCierreAbierto] = useState(false)
  const [errorPersistencia, setErrorPersistencia] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    void cargarMovimientosCaja().then((remotos) => {
      if (cancelado || remotos === null) return
      setMovimientos(remotos)
      setMovimientosBackend(true)
    })
    void cargarSocios().then((remotos) => {
      if (!cancelado && remotos !== null) setSociosBackend(remotos)
    })
    void cargarMembresias().then((remotos) => {
      if (!cancelado && remotos !== null) setMembresias(remotos)
    })
    void cargarPlanes().then((remotos) => {
      if (!cancelado && remotos !== null) setPlanes(remotos)
    })
    return () => {
      cancelado = true
    }
  }, [])

  const socios = sociosBackend ?? sociosDemo

  const total = movimientos.reduce((suma, m) => suma + m.monto, 0)
  const ticketPromedio =
    movimientos.length > 0 ? total / movimientos.length : 0

  const kpis: readonly KpiCaja[] = [
    { titulo: 'Ingresos del día', valor: formatoSoles(total), icono: Banknote },
    { titulo: 'Transacciones', valor: String(movimientos.length), icono: Receipt },
    { titulo: 'Ticket promedio', valor: formatoSoles(ticketPromedio), icono: TrendingUp },
  ]

  async function registrarMovimiento(
    movimiento: MovimientoCaja,
    socio: Socio,
  ): Promise<boolean> {
    setErrorPersistencia(null)
    if (movimiento.concepto === 'membresia') {
      const renovadaOk = await renovarPorCobro(movimiento, socio)
      if (!renovadaOk) return false
    } else if (!movimientosBackend) {
      setMovimientos((previos) => [movimiento, ...previos])
    } else if (movimiento.concepto === 'producto') {
      const ok = await registrarMovimientoCaja({
        socioNombre: movimiento.socioNombre,
        concepto: movimiento.concepto,
        metodo: movimiento.metodo,
        monto: movimiento.monto,
        hora: movimiento.hora,
      })
      if (!ok) {
        setErrorPersistencia('No se pudo registrar el cobro. Intenta de nuevo.')
        return false
      }
    } else {
      const ok = await registrarPagoDeSocio({
        socioId: socio.id,
        planId: socio.planId,
        monto: movimiento.monto,
        metodo: movimiento.metodo,
        concepto: movimiento.concepto,
        socioNombre: movimiento.socioNombre,
        hora: movimiento.hora,
      })
      if (!ok) {
        setErrorPersistencia('No se pudo registrar el cobro. Intenta de nuevo.')
        return false
      }
    }
    if (movimientosBackend) {
      const recargados = await cargarMovimientosCaja()
      if (recargados !== null) setMovimientos(recargados)
    }
    return true
  }

  async function renovarPorCobro(
    movimiento: MovimientoCaja,
    socio: Socio,
  ): Promise<boolean> {
    const membresia = membresiaMasReciente(membresias, socio.id)
    const plan =
      planes.find((candidato) => candidato.id === membresia?.planId) ??
      planes.find((candidato) => candidato.id === socio.planId)
    const duracionDias = plan?.duracionDias ?? 30
    const base =
      membresia !== undefined && membresia.estado !== 'vencida'
        ? membresia.fechaFin
        : hoyIso()
    const fechaFinNueva = sumarDiasIso(base, duracionDias)

    if (!movimientosBackend) {
      // Modo demo: reflejar la renovación y reactivación localmente.
      if (membresia !== undefined) {
        setMembresias((previas) =>
          previas.map((fila) =>
            fila.id === membresia.id
              ? {
                  ...fila,
                  fechaFin: fechaFinNueva,
                  estado: calcularEstado(fechaFinNueva),
                }
              : fila,
          ),
        )
      }
      if (socio.estado === 'moroso') {
        setSociosDemo((previos) =>
          previos.map((fila) =>
            fila.id === socio.id ? { ...fila, estado: 'activo' } : fila,
          ),
        )
      }
      setMovimientos((previos) => [movimiento, ...previos])
      return true
    }

    if (membresia === undefined) {
      setErrorPersistencia(
        'No se encontró la membresía del socio. Registra el pago desde Check-in.',
      )
      return false
    }
    const ok = await registrarCobroMembresia({
      socioId: socio.id,
      socioNombre: socio.nombre,
      planId: plan?.id ?? socio.planId,
      membresiaId: membresia.id,
      fechaFin: fechaFinNueva,
      monto: movimiento.monto,
      metodo: movimiento.metodo,
      hora: movimiento.hora,
      estadoSocio: socio.estado,
    })
    if (!ok) {
      setErrorPersistencia('No se pudo registrar el cobro. Intenta de nuevo.')
      return false
    }
    const [recargadasMembresias, recargadosSocios] = await Promise.all([
      cargarMembresias(),
      cargarSocios(),
    ])
    if (recargadasMembresias !== null) setMembresias(recargadasMembresias)
    if (recargadosSocios !== null) setSociosBackend(recargadosSocios)
    return true
  }

  function confirmarCierre() {
    setMovimientos([])
    setCierreAbierto(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Caja</h2>
          <p className="text-sm text-muted-foreground">{fechaHoy}</p>
        </div>
        <Button variant="outline" onClick={() => setCierreAbierto(true)}>
          <Lock />
          Cierre del día
        </Button>
      </div>

      {errorPersistencia !== null && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {errorPersistencia}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.titulo}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                {kpi.titulo}
                <kpi.icono className="size-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{kpi.valor}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <FormularioCobro
          socios={socios}
          onRegistrar={registrarMovimiento}
          membresias={membresias}
          planes={planes}
        />
        <TablaMovimientos movimientos={movimientos} />
      </div>

      <CierreDiaDialog
        abierto={cierreAbierto}
        movimientos={movimientos}
        onCerrar={() => setCierreAbierto(false)}
        onConfirmar={confirmarCierre}
      />
    </div>
  )
}
