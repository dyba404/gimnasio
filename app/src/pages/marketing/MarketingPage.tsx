import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Banknote, Check, Gift, ShieldCheck, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  actualizarReferido,
  cargarConfigGym,
  cargarMembresias,
  cargarPagos,
  cargarReferidos,
  cargarSocios,
  cargarSolicitudesResena,
} from '@/lib/datos'
import { supabaseDisponible, valorEnv } from '@/lib/supabase'
import { formatoSoles } from '@/lib/format'
import { cn } from '@/lib/utils'
import { formatoFecha, membresiasMock, sociosMock } from '@/mocks/data'
import { pagosMock } from '@/mocks/pagos'
import type { Pago } from '@/mocks/pagos'
import { fechaHoyIso } from '@/mocks/pos'
import {
  etiquetaGatillo,
  puedePedirResena,
  solicitudesResenaMock,
  sociosElegiblesParaResena,
} from '@/mocks/resenas'
import type { GatilloResena, SolicitudResena } from '@/mocks/resenas'
import {
  agruparPagosPorSocio,
  descuentosEntregados,
  estadoDerivado,
  motivoNoCalifica,
  RECOMPENSA_REFERIDO,
  referidosMock,
  referidosPorSocio,
} from '@/mocks/referidos'
import type { ContextoReferidos, EstadoReferido, Referido } from '@/mocks/referidos'
import type { Membresia, Socio } from '@/mocks/types'
import { configGymMock } from '@/mocks/config'
import type { ConfigGym } from '@/mocks/types'

const clasesEstado: Record<EstadoReferido, string> = {
  pendiente: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  elegible: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  aplicado: 'bg-muted text-muted-foreground',
  invalido: 'bg-muted text-muted-foreground',
}

const etiquetasEstado: Record<EstadoReferido, string> = {
  pendiente: 'Pendiente',
  elegible: 'Recompensa lista',
  aplicado: 'Descuento aplicado',
  invalido: 'Inválido',
}

const clasesGatillo: Record<GatilloResena, string> = {
  renovacion: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  asistencia: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
}

function nombreDeSocio(
  socios: ReadonlyMap<string, { nombre: string }>,
  socioId: string,
): string {
  return socios.get(socioId)?.nombre ?? 'Socio'
}

export default function MarketingPage() {
  const backendActivo = supabaseDisponible()
  const modoDemo = valorEnv('VITE_DEMO_MODE') !== ''
  const [aplicadosSesion, setAplicadosSesion] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  )
  const [solicitudesBackend, setSolicitudesBackend] = useState<
    SolicitudResena[] | null
  >(null)
  const [socios, setSocios] = useState<readonly Socio[]>(() =>
    backendActivo || !modoDemo ? [] : sociosMock,
  )
  const [membresias, setMembresias] = useState<readonly Membresia[]>(() =>
    backendActivo || !modoDemo ? [] : membresiasMock,
  )
  const [pagos, setPagos] = useState<readonly Pago[]>(() =>
    backendActivo || !modoDemo ? [] : pagosMock,
  )
  const [referidos, setReferidos] = useState<readonly Referido[]>(() =>
    backendActivo || !modoDemo ? [] : referidosMock,
  )
  const [configGym, setConfigGym] = useState<ConfigGym | null>(() =>
    backendActivo || !modoDemo ? null : configGymMock,
  )

  useEffect(() => {
    let cancelado = false
    if (!backendActivo) return
    void cargarSocios().then((remotos) => {
      if (!cancelado && remotos !== null) setSocios(remotos)
    })
    void cargarMembresias().then((remotas) => {
      if (!cancelado && remotas !== null) setMembresias(remotas)
    })
    void cargarPagos().then((remotos) => {
      if (!cancelado && remotos !== null) setPagos(remotos)
    })
    void cargarReferidos().then((remotos) => {
      if (!cancelado && remotos !== null) setReferidos(remotos)
    })
    void cargarConfigGym().then((remota) => {
      if (!cancelado && remota !== null) setConfigGym(remota)
    })
    void cargarSolicitudesResena().then((remotas) => {
      if (!cancelado && remotas !== null) setSolicitudesBackend(remotas)
    })
    return () => {
      cancelado = true
    }
  }, [backendActivo])

  const sinDatos =
    !backendActivo &&
    !modoDemo &&
    socios.length === 0 &&
    referidos.length === 0

  const solicitudes = solicitudesBackend ?? (backendActivo ? [] : solicitudesResenaMock)

  const contexto = useMemo<ContextoReferidos>(
    () => ({
      socios: new Map(socios.map((socio): [string, Socio] => [socio.id, socio])),
      membresias: new Map(
        membresias.map((membresia): [string, Membresia] => [membresia.socioId, membresia]),
      ),
      pagosPorSocio: agruparPagosPorSocio(pagos),
    }),
    [socios, membresias, pagos],
  )

  const filas = useMemo<readonly { referido: Referido; estado: EstadoReferido }[]>(
    () =>
      [...referidos]
        .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
        .map((referido) => ({
          referido,
          estado: aplicadosSesion.has(referido.id)
            ? 'aplicado'
            : estadoDerivado(referido, contexto),
        })),
    [referidos, aplicadosSesion, contexto],
  )

  const referidosActivos = filas.filter((fila) => fila.estado !== 'invalido').length
  const recompensasListas = filas.filter((fila) => fila.estado === 'elegible').length
  const descuentos = descuentosEntregados(filas.map((fila) => fila.estado))

  const ranking = useMemo<readonly { socioId: string; conteo: number }[]>(
    () =>
      [...referidosPorSocio(referidos).entries()]
        .map(([socioId, conteo]) => ({ socioId, conteo }))
        .sort((a, b) => b.conteo - a.conteo)
        .slice(0, 3),
    [referidos],
  )

  const aplicar = (referidoId: string) => {
    setAplicadosSesion((previos) => new Set(previos).add(referidoId))
    if (backendActivo) {
      void actualizarReferido(referidoId, 'aplicado')
    }
  }

  const elegiblesResena = sociosElegiblesParaResena(
    socios,
    solicitudes,
    fechaHoyIso(),
  )

  const kpis: readonly { titulo: string; valor: string; icono: typeof Gift }[] = [
    { titulo: 'Referidos activos', valor: String(referidosActivos), icono: UserPlus },
    { titulo: 'Recompensas listas', valor: String(recompensasListas), icono: Gift },
    { titulo: 'Descuentos entregados', valor: formatoSoles(descuentos), icono: Banknote },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Marketing</h2>
        <p className="text-sm text-muted-foreground">Programa de referidos</p>
      </div>

      {sinDatos ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No hay datos del gimnasio. Conecta el backend o activa el modo demo
            para ver el programa de referidos.
          </CardContent>
        </Card>
      ) : (
        <>
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

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Referidos</CardTitle>
            <CardDescription>
              Recompensa: S/ {RECOMPENSA_REFERIDO} de descuento en el próximo pago del
              referidor cuando su referido esté activo y al día
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filas.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Aún no hay referidos registrados.
              </p>
            ) : (
              <ul className="space-y-3">
                {filas.map(({ referido, estado }) => (
                  <li
                    key={referido.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm font-medium">
                        <span>
                          {nombreDeSocio(contexto.socios, referido.referidorId)}
                        </span>
                        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                        <span>
                          {nombreDeSocio(contexto.socios, referido.referidoId)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Desde {formatoFecha(referido.fecha)}
                      </p>
                      {(estado === 'pendiente' || estado === 'invalido') && (
                        <p className="text-xs text-muted-foreground">
                          {motivoNoCalifica(referido, contexto)}
                        </p>
                      )}
                    </div>
                    <Badge className={clasesEstado[estado]}>
                      {estado === 'aplicado' && <Check />}
                      {etiquetasEstado[estado]}
                    </Badge>
                    {estado === 'elegible' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-center sm:w-auto"
                        onClick={() => aplicar(referido.id)}
                      >
                        Aplicar S/ {RECOMPENSA_REFERIDO} descuento
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top referidores</CardTitle>
              <CardDescription>Socios que más han traído gente</CardDescription>
            </CardHeader>
            <CardContent>
              {ranking.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Sin referidores aún.
                </p>
              ) : (
                <ul className="space-y-3">
                  {ranking.map(({ socioId, conteo }) => (
                    <li
                      key={socioId}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <p className="min-w-0 truncate text-sm font-medium">
                        {nombreDeSocio(contexto.socios, socioId)}
                      </p>
                      <Badge variant="secondary" className="tabular-nums">
                        {conteo} {conteo === 1 ? 'referido' : 'referidos'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-muted-foreground" />
                Regla anti-abuso
              </CardTitle>
              <CardDescription>
                La recompensa se libera solo cuando el referido está activo y al día
                con sus pagos.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Reseñas Google</CardTitle>
          <CardDescription>
            Pide la reseña en el momento feliz: justo después de que el socio
            renueva.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Reseñas pedidas
              </p>
              <p className="text-3xl font-semibold tabular-nums">
                {solicitudes.length}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Socios elegibles hoy
              </p>
              <p className="text-3xl font-semibold tabular-nums">
                {elegiblesResena.length}
              </p>
            </div>
          </div>
          {configGym?.linkResenaGoogle ? (
            <p className="text-xs break-all text-muted-foreground">
              Link actual: {configGym.linkResenaGoogle}
            </p>
          ) : (
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Sin link configurado —{' '}
              <Link to="/config" className="underline underline-offset-2">
                añádelo en Configuración
              </Link>
            </p>
          )}
          <ul className="space-y-3">
            {solicitudes.map((solicitud) => {
              const enEspera = !puedePedirResena(solicitud.fecha, fechaHoyIso())
              return (
                <li
                  key={solicitud.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-sm font-medium">
                      {nombreDeSocio(contexto.socios, solicitud.socioId)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pedida el {formatoFecha(solicitud.fecha)}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[11px]',
                      clasesGatillo[solicitud.gatillo],
                    )}
                  >
                    {etiquetaGatillo[solicitud.gatillo]}
                  </Badge>
                  {enEspera ? (
                    <Badge variant="secondary" className="text-[11px]">
                      En espera
                    </Badge>
                  ) : null}
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-muted-foreground">
            Máx. 1 por socio cada 90 días. Se pide al registrar una renovación;
            pronto también al completar una racha de 10 días de asistencia.
          </p>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  )
}
