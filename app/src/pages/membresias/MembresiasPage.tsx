import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, CircleAlert, Plus, RefreshCw, Snowflake, Users, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  congelar as congelarMembresia,
  esCongelada,
  hoyIso,
  limitarDiasCongelamiento,
  reanudar as reanudarMembresia,
  renovarMembresia,
} from '@/components/memberships/congelamiento'
import { EstadoMembresiaBadge } from '@/components/memberships/EstadoMembresiaBadge'
import { MembresiaCard } from '@/components/memberships/MembresiaCard'
import { NuevaMembresiaSheet } from '@/components/memberships/NuevaMembresiaSheet'
import { VencimientosProximos } from '@/components/memberships/VencimientosProximos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  actualizarSocio,
  cargarMembresias as cargarMembresiasRemotas,
  cargarPlanes as cargarPlanesRemotos,
  cargarSocios as cargarSociosRemotos,
  congelarMembresia as congelarMembresiaRemota,
  congelarSocio,
  crearMembresia,
  reanudarMembresia as reanudarMembresiaRemota,
  renovarMembresia as persistirRenovacion,
} from '@/lib/datos'
import {
  calcularEstado,
  formatoSoles,
  membresiasMock,
  planesMock,
  sociosMock,
  sumarDiasIso,
} from '@/mocks/data'
import { familiasMock } from '@/mocks/familias'
import type { EstadoMembresia, Membresia, Plan, Socio } from '@/mocks/types'

type Kpi = {
  title: string
  value: string
  icon: LucideIcon
  hint?: string
}

const filtros = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'vigente', etiqueta: 'Vigentes' },
  { valor: 'por-vencer', etiqueta: 'Por vencer' },
  { valor: 'vencida', etiqueta: 'Vencidas' },
  { valor: 'congeladas', etiqueta: 'Congeladas' },
] as const

type Filtro = (typeof filtros)[number]['valor']

export default function MembresiasPage() {
  const [membresias, setMembresias] = useState<Membresia[]>([...membresiasMock])
  const [membresiasBackend, setMembresiasBackend] = useState<Membresia[] | null>(null)
  const [sociosBackend, setSociosBackend] = useState<Socio[] | null>(null)
  const [planesBackend, setPlanesBackend] = useState<Plan[] | null>(null)
  const [renovacionesMes, setRenovacionesMes] = useState(3)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [errorPersistencia, setErrorPersistencia] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    void cargarMembresiasRemotas().then((remotas) => {
      if (cancelado || remotas === null) return
      setMembresiasBackend(remotas)
      setMembresias(remotas)
    })
    void cargarSociosRemotos().then((remotos) => {
      if (!cancelado && remotos !== null) setSociosBackend(remotos)
    })
    void cargarPlanesRemotos().then((remotos) => {
      if (!cancelado && remotos !== null) setPlanesBackend(remotos)
    })
    return () => {
      cancelado = true
    }
  }, [])

  const sociosMap = useMemo(
    () =>
      new Map(
        (sociosBackend ?? sociosMock).map((socio): [string, Socio] => [socio.id, socio]),
      ),
    [sociosBackend],
  )

  const planesMap = useMemo(
    () =>
      new Map(
        (planesBackend ?? planesMock).map((plan): [string, Plan] => [plan.id, plan]),
      ),
    [planesBackend],
  )

  const renovar = (membresiaId: string) => {
    setErrorPersistencia(null)
    const objetivo = membresias.find((membresia) => membresia.id === membresiaId)
    setMembresias((previas) =>
      previas.map((membresia) => {
        if (membresia.id !== membresiaId) return membresia
        const duracionDias = planesMap.get(membresia.planId)?.duracionDias ?? 30
        return renovarMembresia(membresia, duracionDias, hoyIso())
      }),
    )
    setRenovacionesMes((previo) => previo + 1)
    if (objetivo !== undefined && membresiasBackend !== null) {
      const duracionDias = planesMap.get(objetivo.planId)?.duracionDias ?? 30
      const renovada = renovarMembresia(objetivo, duracionDias, hoyIso())
      void persistirRenovacion({
        membresiaId,
        fechaFin: renovada.fechaFin,
        estado: 'vigente',
      }).then((ok) => {
        if (!ok) {
          setErrorPersistencia('No se pudo guardar la renovación en el servidor.')
        }
      })
      void actualizarSocio(objetivo.socioId, { estado: 'activo' }).then((ok) => {
        if (!ok) {
          setErrorPersistencia('No se pudo actualizar el estado del socio en el servidor.')
        }
      })
    }
  }

  const congelar = (membresiaId: string, dias: number) => {
    setErrorPersistencia(null)
    const hoy = hoyIso()
    setMembresias((previas) =>
      previas.map((membresia) =>
        membresia.id === membresiaId ? congelarMembresia(membresia, dias, hoy) : membresia,
      ),
    )
    const objetivo = membresias.find((membresia) => membresia.id === membresiaId)
    if (objetivo === undefined || membresiasBackend === null) return
    const hasta = sumarDiasIso(hoy, limitarDiasCongelamiento(dias))
    void congelarMembresiaRemota({
      membresiaId,
      desde: hoy,
      hasta,
    }).then((ok) => {
      if (!ok) {
        setErrorPersistencia('No se pudo congelar la membresía en el servidor.')
      }
    })
    void congelarSocio(objetivo.socioId, true).then((ok) => {
      if (!ok) {
        setErrorPersistencia('No se pudo congelar la membresía en el servidor.')
      }
    })
  }

  const reanudar = (membresiaId: string) => {
    setErrorPersistencia(null)
    const objetivo = membresias.find((membresia) => membresia.id === membresiaId)
    setMembresias((previas) =>
      previas.map((membresia) => {
        if (membresia.id !== membresiaId) return membresia
        const extendida = reanudarMembresia(membresia)
        return { ...extendida, estado: calcularEstado(extendida.fechaFin) }
      }),
    )
    if (objetivo === undefined || membresiasBackend === null) return
    const extendida = reanudarMembresia(objetivo)
    void reanudarMembresiaRemota({ membresiaId, fechaFin: extendida.fechaFin }).then((ok) => {
      if (!ok) {
        setErrorPersistencia('No se pudo reanudar la membresía en el servidor.')
      }
    })
    void congelarSocio(objetivo.socioId, false).then((ok) => {
      if (!ok) {
        setErrorPersistencia('No se pudo reanudar la membresía en el servidor.')
      }
    })
  }

  const guardarMembresia = async (borrador: {
    socioId: string
    planId: string
    fechaInicio: string
    fechaFin: string
    monto: number
  }): Promise<boolean> => {
    setErrorPersistencia(null)
    if (membresiasBackend === null) return true
    const creada = await crearMembresia(borrador)
    if (creada === null) {
      setErrorPersistencia('No se pudo guardar la membresía en el servidor.')
      return false
    }
    const recargadas = await cargarMembresiasRemotas()
    if (recargadas !== null) {
      setMembresiasBackend(recargadas)
      setMembresias(recargadas)
    }
    return true
  }

  const membresiasActivas = useMemo(() => {
    const vigentePorSocio = new Map<string, boolean>()
    for (const membresia of membresias) {
      if (membresia.estado !== 'vencida') vigentePorSocio.set(membresia.socioId, true)
    }
    return membresias.filter(
      (membresia) =>
        membresia.estado !== 'vencida' || !vigentePorSocio.has(membresia.socioId),
    )
  }, [membresias])

  const contarPor = (estado: EstadoMembresia): number =>
    membresiasActivas.filter((membresia) => membresia.estado === estado).length

  const congeladasCount = membresiasActivas.filter(esCongelada).length

  const mrr = membresiasActivas
    .filter((membresia) => membresia.estado !== 'vencida')
    .reduce((total, membresia) => total + membresia.monto, 0)

  const kpis: readonly Kpi[] = [
    {
      title: 'MRR estimado',
      value: formatoSoles(mrr),
      icon: Wallet,
      hint: 'Vigentes y congeladas; excluye vencidas',
    },
    { title: 'Renovadas este mes', value: String(renovacionesMes), icon: RefreshCw },
    { title: 'Vencidas sin renovar', value: String(contarPor('vencida')), icon: CircleAlert },
    { title: 'Congeladas', value: String(congeladasCount), icon: Snowflake },
    {
      title: 'Cuentas familiares',
      value: String(familiasMock.length),
      icon: Users,
      hint: 'Una factura por grupo; el head responde solidario',
    },
  ]

  const visibles =
    filtro === 'todas'
      ? membresiasActivas
      : filtro === 'congeladas'
        ? membresiasActivas.filter(esCongelada)
        : membresiasActivas.filter((membresia) => membresia.estado === filtro)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Membresías</h2>
          <p className="text-sm text-muted-foreground">
            Controla vigencias y renovaciones de tus socios
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus /> Nueva membresía
        </Button>
      </div>

      {errorPersistencia !== null && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {errorPersistencia}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                {kpi.title}
                <kpi.icon className="size-4" />
              </CardTitle>
              {kpi.hint ? (
                <p className="text-xs text-muted-foreground">{kpi.hint}</p>
              ) : null}
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            {filtros.map((item) => {
              const activo = filtro === item.valor
              const cantidad =
                item.valor === 'todas'
                  ? membresias.length
                  : item.valor === 'congeladas'
                    ? congeladasCount
                    : contarPor(item.valor as EstadoMembresia)
              return (
                <Button
                  key={item.valor}
                  size="sm"
                  variant={activo ? 'default' : 'outline'}
                  onClick={() => setFiltro(item.valor)}
                >
                  {item.etiqueta}
                  <span
                    className={
                      activo
                        ? 'ml-1 rounded-full bg-white/20 px-1.5 text-xs tabular-nums'
                        : 'ml-1 rounded-full bg-muted px-1.5 text-xs tabular-nums'
                    }
                  >
                    {cantidad}
                  </span>
                </Button>
              )
            })}
          </div>

          {visibles.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center text-sm text-muted-foreground">
                No hay membresías en este estado.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visibles.map((membresia) => (
                <MembresiaCard
                  key={membresia.id}
                  membresia={membresia}
                  socio={sociosMap.get(membresia.socioId)}
                  plan={planesMap.get(membresia.planId)}
                  onRenovar={renovar}
                  onCongelar={congelar}
                  onReanudar={reanudar}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <VencimientosProximos
            membresias={membresiasActivas}
            socios={sociosMap}
            planes={planesMap}
            onRenovar={renovar}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarClock className="size-4" />
                Resumen de estados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Vigentes</span>
                <span className="flex items-center gap-2 tabular-nums">
                  {contarPor('vigente')}
                  <EstadoMembresiaBadge estado="vigente" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Por vencer</span>
                <span className="flex items-center gap-2 tabular-nums">
                  {contarPor('por-vencer')}
                  <EstadoMembresiaBadge estado="por-vencer" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Vencidas</span>
                <span className="flex items-center gap-2 tabular-nums">
                  {contarPor('vencida')}
                  <EstadoMembresiaBadge estado="vencida" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Congeladas</span>
                <span className="flex items-center gap-2 tabular-nums">
                  {congeladasCount}
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                    <Snowflake />
                    Congelada
                  </Badge>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <NuevaMembresiaSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        socios={sociosBackend ?? sociosMock}
        planes={planesBackend ?? planesMock}
        onGuardar={guardarMembresia}
      />
    </div>
  )
}
