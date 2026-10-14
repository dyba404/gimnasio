import { useEffect, useMemo, useState } from 'react'
import { Percent, PhoneOutgoing, PiggyBank, Trophy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DialogGanado, DialogGestion, DialogPerdido } from '@/components/prospectos/DialogosProspecto'
import { ProspectosEmpty } from '@/components/prospectos/ProspectosEmpty'
import { ProspectosTable } from '@/components/prospectos/ProspectosTable'
import { actualizarProspecto, cargarProspectos } from '@/lib/datos'
import { supabaseDisponible, valorEnv } from '@/lib/supabase'
import { formatoSoles } from '@/lib/format'
import {
  buscarProspectos,
  fechaHoyIso,
  ganadosEnMes,
  marcarGanado,
  marcarPerdido,
  pipelineActivo,
  porContactar,
  prospectosMock,
  registrarGestionProspecto,
  tasaConversion,
  valorPipeline,
} from '@/mocks/prospectos'
import type { EstadoProspecto, Prospecto, TipoNotaProspecto } from '@/mocks/prospectos'

type Kpi = {
  titulo: string
  valor: string
  detalle: string
  icono: LucideIcon
}

const PATRON_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function esIdBackend(id: string): boolean {
  return PATRON_UUID.test(id)
}

export default function ProspectosPage() {
  const backendActivo = supabaseDisponible()
  const modoDemo = valorEnv('VITE_DEMO_MODE') !== ''
  const [prospectos, setProspectos] = useState<readonly Prospecto[]>(() =>
    backendActivo || !modoDemo ? [] : prospectosMock,
  )
  const [errorCarga, setErrorCarga] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<readonly EstadoProspecto[]>([])
  const [prospectoGestion, setProspectoGestion] = useState<Prospecto | null>(null)
  const [prospectoGanado, setProspectoGanado] = useState<Prospecto | null>(null)
  const [prospectoPerdido, setProspectoPerdido] = useState<Prospecto | null>(null)

  const hoyIso = fechaHoyIso()

  useEffect(() => {
    if (!backendActivo) return
    let cancelado = false
    void cargarProspectos().then((remotos) => {
      if (cancelado) return
      if (remotos === null) {
        setErrorCarga(true)
        return
      }
      setErrorCarga(false)
      setProspectos(remotos)
    })
    return () => {
      cancelado = true
    }
  }, [backendActivo])

  async function refrescar(): Promise<void> {
    const recargados = await cargarProspectos()
    if (recargados !== null) setProspectos(recargados)
  }

  function buscar(id: string): Prospecto | undefined {
    return prospectos.find((prospecto) => prospecto.id === id)
  }

  function sincronizarBackend(
    prospectoId: string,
    cambios: {
      estado?: string
      notasGestion?: Prospecto['notasGestion']
      proximaAccion?: unknown
    },
  ): void {
    if (!backendActivo || !esIdBackend(prospectoId)) return
    void actualizarProspecto(prospectoId, cambios).then((ok) => {
      if (ok) void refrescar()
    })
  }

  const kpis = useMemo<readonly Kpi[]>(() => {
    const ahora = new Date()
    const ganadosMes = ganadosEnMes(prospectos, ahora.getFullYear(), ahora.getMonth() + 1).length
    return [
      {
        titulo: 'Pipeline potencial',
        valor: formatoSoles(valorPipeline(prospectos)),
        detalle: `${pipelineActivo(prospectos).length} en seguimiento activo`,
        icono: PiggyBank,
      },
      {
        titulo: 'Ganados este mes',
        valor: String(ganadosMes),
        detalle: 'Cierres del plan fundador',
        icono: Trophy,
      },
      {
        titulo: 'Tasa de conversión',
        valor: `${tasaConversion(prospectos)}%`,
        detalle: 'Ganados sobre el total',
        icono: Percent,
      },
      {
        titulo: 'Por contactar',
        valor: String(porContactar(prospectos, hoyIso).length),
        detalle: 'Nuevos o sin gestión 7+ días',
        icono: PhoneOutgoing,
      },
    ]
  }, [prospectos, hoyIso])

  const filtrados = useMemo(() => {
    const porBusqueda = buscarProspectos(prospectos, busqueda)
    if (filtroEstado.length === 0) return porBusqueda
    return porBusqueda.filter((prospecto) => filtroEstado.includes(prospecto.estado))
  }, [prospectos, busqueda, filtroEstado])

  const registrarGestion = (prospectoId: string, tipo: TipoNotaProspecto, nota: string) => {
    sincronizarBackend(prospectoId, {
      ...(buscar(prospectoId)?.estado === 'nuevo'
        ? { estado: 'contactado' }
        : {}),
      notasGestion: [
        ...(buscar(prospectoId)?.notasGestion ?? []),
        { fecha: hoyIso, nota, tipo },
      ],
    })
    setProspectos((previos) =>
      registrarGestionProspecto(previos, prospectoId, tipo, nota, hoyIso),
    )
  }

  const confirmarGanado = (prospectoId: string) => {
    sincronizarBackend(prospectoId, {
      estado: 'ganado',
      proximaAccion: null,
      notasGestion: [
        ...(buscar(prospectoId)?.notasGestion ?? []),
        { fecha: hoyIso, nota: 'Cerró el plan fundador (S/ 99/mes).', tipo: 'otro' },
      ],
    })
    setProspectos((previos) => marcarGanado(previos, prospectoId, hoyIso))
  }

  const confirmarPerdido = (prospectoId: string, motivo: string) => {
    sincronizarBackend(prospectoId, {
      estado: 'perdido',
      proximaAccion: null,
      notasGestion: [
        ...(buscar(prospectoId)?.notasGestion ?? []),
        { fecha: hoyIso, nota: `Perdido: ${motivo}`, tipo: 'otro' },
      ],
    })
    setProspectos((previos) => marcarPerdido(previos, prospectoId, motivo, hoyIso))
  }

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroEstado([])
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Prospectos</h2>
        <p className="text-sm text-muted-foreground">
          Interesados en el plan fundador: del primer contacto a la venta cerrada
        </p>
      </div>

      {errorCarga && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
        >
          No se pudieron cargar los prospectos.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.titulo} className="gap-3 py-4 sm:gap-6 sm:py-6">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                {kpi.titulo}
                <kpi.icono className="size-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 px-4 sm:px-6">
              <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{kpi.valor}</p>
              <p className="text-xs text-muted-foreground">{kpi.detalle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {prospectos.length === 0 || filtrados.length === 0 ? (
        <ProspectosEmpty
          variante={prospectos.length === 0 ? 'vacio' : 'sin-resultados'}
          busqueda={busqueda.trim()}
          onLimpiar={limpiarFiltros}
        />
      ) : (
        <ProspectosTable
          prospectos={filtrados}
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          filtroEstado={filtroEstado}
          onFiltroEstadoChange={setFiltroEstado}
          onRegistrarGestion={setProspectoGestion}
          onMarcarGanado={setProspectoGanado}
          onMarcarPerdido={setProspectoPerdido}
        />
      )}

      <DialogGestion
        open={prospectoGestion !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setProspectoGestion(null)
        }}
        prospecto={prospectoGestion}
        onConfirmar={registrarGestion}
      />
      <DialogGanado
        open={prospectoGanado !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setProspectoGanado(null)
        }}
        prospecto={prospectoGanado}
        onConfirmar={confirmarGanado}
      />
      <DialogPerdido
        open={prospectoPerdido !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setProspectoPerdido(null)
        }}
        prospecto={prospectoPerdido}
        onConfirmar={confirmarPerdido}
      />
    </div>
  )
}
