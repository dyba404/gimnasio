import { useEffect, useMemo, useState } from 'react'
import {
  agregarPorMes,
  agregarPorMetodo,
  agregarPorPlan,
  esIngreso,
  filtrarPorDias,
} from '@/components/pagos/logica-pagos'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ChartFlujoNetoMes } from '@/components/reportes/ChartFlujoNetoMes'
import { ChartGastosDonut } from '@/components/reportes/ChartGastosDonut'
import { ChartIngresosMes } from '@/components/reportes/ChartIngresosMes'
import { ChartPlanesDonut } from '@/components/reportes/ChartPlanesDonut'
import { FormularioGasto } from '@/components/reportes/FormularioGasto'
import { KpiFlujoNeto } from '@/components/reportes/KpiFlujoNeto'
import { ResumenMetodos } from '@/components/reportes/ResumenMetodos'
import { SelectorPeriodo } from '@/components/reportes/SelectorPeriodo'
import { TablaGastosRecientes } from '@/components/reportes/TablaGastosRecientes'
import { TopPlanesTabla } from '@/components/reportes/TopPlanesTabla'
import { combinarFlujo } from '@/components/reportes/logica-flujo'
import {
  cargarGastos as cargarGastosRemotos,
  cargarPagos,
  registrarGasto as registrarGastoRemoto,
} from '@/lib/datos'
import { supabaseDisponible, valorEnv } from '@/lib/supabase'
import {
  filtrarGastosPorDias,
  gastosMock,
  gastosPorCategoria,
  gastosPorMes,
  totalGastos,
} from '@/mocks/gastos'
import type { Gasto } from '@/mocks/gastos'
import { pagosMock } from '@/mocks/pagos'
import type { Pago } from '@/mocks/pagos'

export default function ReportesPage() {
  const backendActivo = supabaseDisponible()
  const modoDemo = valorEnv('VITE_DEMO_MODE') !== ''
  const [dias, setDias] = useState(30)
  const [pagos, setPagos] = useState<readonly Pago[]>(() =>
    backendActivo || !modoDemo ? [] : pagosMock,
  )
  const [errorCarga, setErrorCarga] = useState(false)
  const [gastos, setGastos] = useState<readonly Gasto[]>(() =>
    backendActivo || !modoDemo ? [] : gastosMock,
  )
  const [gastosBackend, setGastosBackend] = useState(false)
  const [errorPersistencia, setErrorPersistencia] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    void cargarGastosRemotos().then((remotos) => {
      if (cancelado || remotos === null) return
      setGastos(remotos)
      setGastosBackend(true)
    })
    return () => {
      cancelado = true
    }
  }, [])

  useEffect(() => {
    if (!backendActivo) return
    let cancelado = false
    void cargarPagos().then((remotos) => {
      if (cancelado) return
      if (remotos === null) {
        setErrorCarga(true)
        return
      }
      setErrorCarga(false)
      setPagos(remotos)
    })
    return () => {
      cancelado = true
    }
  }, [backendActivo])

  const pagosPeriodo = useMemo(() => filtrarPorDias(pagos, dias), [pagos, dias])
  const gastosPeriodo = useMemo(() => filtrarGastosPorDias(gastos, dias), [gastos, dias])
  const ingresosMes = useMemo(() => agregarPorMes(pagosPeriodo), [pagosPeriodo])
  const resumenPlanes = useMemo(() => agregarPorPlan(pagosPeriodo), [pagosPeriodo])
  const resumenMetodos = useMemo(() => agregarPorMetodo(pagosPeriodo), [pagosPeriodo])

  const ingresosPeriodo = useMemo(
    () =>
      pagosPeriodo
        .filter(esIngreso)
        .reduce((suma, pago) => suma + pago.monto, 0),
    [pagosPeriodo],
  )
  const gastosMes = useMemo(() => gastosPorMes(gastosPeriodo), [gastosPeriodo])
  const flujoMes = useMemo(() => combinarFlujo(ingresosMes, gastosMes), [ingresosMes, gastosMes])
  const resumenCategorias = useMemo(() => gastosPorCategoria(gastosPeriodo), [gastosPeriodo])
  const ultimosGastos = useMemo(() => gastosPeriodo.slice(0, 5), [gastosPeriodo])

  const registrarGasto = async (gasto: Gasto): Promise<boolean> => {
    setErrorPersistencia(null)
    if (!gastosBackend) {
      setGastos((previo) => [gasto, ...previo])
      return true
    }
    const ok = await registrarGastoRemoto({
      categoria: gasto.categoria,
      descripcion: gasto.descripcion,
      proveedor: gasto.proveedor,
      monto: gasto.monto,
    })
    if (!ok) {
      setErrorPersistencia('No se pudo registrar el gasto. Intenta de nuevo.')
      return false
    }
    const recargados = await cargarGastosRemotos()
    if (recargados !== null) setGastos(recargados)
    return true
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Reportes</h2>
          <p className="text-sm text-muted-foreground">
            Ingresos, gastos y utilidad de tu gimnasio
          </p>
        </div>
        <SelectorPeriodo valor={dias} onChange={setDias} />
      </div>

      {errorCarga && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
        >
          No se pudieron cargar los pagos.
        </p>
      )}

      {pagosPeriodo.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-16 text-center text-sm text-muted-foreground">
          {errorCarga
            ? 'Sin pagos cargados.'
            : `No hay pagos registrados en los últimos ${dias} días.`}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartIngresosMes datos={ingresosMes} />
          <ChartPlanesDonut datos={resumenPlanes} />
          <TopPlanesTabla datos={resumenPlanes} />
          <ResumenMetodos datos={resumenMetodos} />
        </div>
      )}

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Flujo neto</h3>
          <p className="text-sm text-muted-foreground">
            Lo que entra menos lo que sale: la utilidad real de tu gimnasio
          </p>
        </div>

        {errorCarga ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {['Ingresos del periodo', 'Gastos del periodo', 'Utilidad neta'].map(
              (titulo) => (
                <Card key={titulo} className="gap-3 py-4 sm:gap-6 sm:py-6">
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {titulo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <p className="text-2xl font-semibold tabular-nums sm:text-3xl">—</p>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        ) : (
          <KpiFlujoNeto ingresos={ingresosPeriodo} gastos={totalGastos(gastosPeriodo)} />
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartFlujoNetoMes datos={flujoMes} />
          <ChartGastosDonut datos={resumenCategorias} />
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-2 lg:col-span-2">
            <FormularioGasto onRegistrar={registrarGasto} />
            {errorPersistencia !== null && (
              <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
                {errorPersistencia}
              </p>
            )}
          </div>
          <div className="min-w-0 lg:col-span-3">
            <TablaGastosRecientes gastos={ultimosGastos} />
          </div>
        </div>
      </section>
    </div>
  )
}
