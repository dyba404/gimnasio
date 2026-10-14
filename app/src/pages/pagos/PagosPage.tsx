import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Download, ReceiptText, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PagosTable } from '@/components/pagos/PagosTable'
import {
  aCsv,
  contarPorEstado,
  descargarCsv,
  ticketPromedio,
  totalMesEnCurso,
} from '@/components/pagos/logica-pagos'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cargarPagos } from '@/lib/datos'
import { formatoSoles } from '@/lib/format'
import { buscarSocios } from '@/lib/search'
import { supabaseDisponible, valorEnv } from '@/lib/supabase'
import { pagosMock } from '@/mocks/pagos'
import type { Pago } from '@/mocks/pagos'

type Kpi = {
  title: string
  value: string
  icon: LucideIcon
}

const PAGOS_CSV = 'pagos-marsmode.csv'

export default function PagosPage() {
  const backendActivo = supabaseDisponible()
  const modoDemo = valorEnv('VITE_DEMO_MODE') !== ''
  const [busqueda, setBusqueda] = useState('')
  const [pagos, setPagos] = useState<readonly Pago[]>(() =>
    backendActivo || !modoDemo ? [] : pagosMock,
  )
  const [errorCarga, setErrorCarga] = useState(false)

  useEffect(() => {
    let cancelado = false
    void cargarPagos().then((remotos) => {
      if (cancelado) return
      if (remotos === null) {
        if (backendActivo) setErrorCarga(true)
        return
      }
      setPagos(remotos)
    })
    return () => {
      cancelado = true
    }
  }, [backendActivo])

  const pagosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return pagos
    return buscarSocios(pagos, busqueda, pagos.length) as Pago[]
  }, [pagos, busqueda])

  const totalMes = useMemo(() => totalMesEnCurso(pagos), [pagos])
  const ticket = useMemo(() => ticketPromedio(pagos), [pagos])
  const pendientes = useMemo(() => contarPorEstado(pagos, 'pendiente'), [pagos])

  const kpis: readonly Kpi[] = [
    { title: 'Total del mes', value: formatoSoles(totalMes), icon: Wallet },
    { title: 'Ticket promedio', value: formatoSoles(ticket), icon: ReceiptText },
    { title: 'Pagos pendientes', value: String(pendientes), icon: CalendarDays },
  ]

  const exportarCsv = () => {
    descargarCsv(PAGOS_CSV, aCsv(pagosFiltrados))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Pagos</h2>
          <p className="text-sm text-muted-foreground">
            Historial de cobros de membresías e inscripciones
          </p>
        </div>
        <Button variant="outline" onClick={exportarCsv}>
          <Download /> Exportar CSV
        </Button>
      </div>

      {errorCarga && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          No se pudieron cargar los pagos. Revisa tu conexión e intenta de nuevo.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                {kpi.title}
                <kpi.icon className="size-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <PagosTable
        pagos={pagosFiltrados}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
      />
    </div>
  )
}
