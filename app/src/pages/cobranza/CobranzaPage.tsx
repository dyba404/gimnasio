import { useEffect, useMemo, useState } from 'react'
import {
  Banknote,
  Bell,
  CheckCircle2,
  CircleAlert,
  MessageCircle,
  Phone,
  PiggyBank,
  Snowflake,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BotonWhatsApp } from '@/components/members/BotonWhatsApp'
import { ColumnaDunning } from '@/components/cobranza/ColumnaDunning'
import { KpiCards } from '@/components/dashboard/KpiCards'
import type { KpiPanel } from '@/components/dashboard/KpiCards'
import { formatoSoles } from '@/lib/format'
import {
  cargarConfigGym,
  cargarGestiones,
  cargarMembresias,
  cargarSocios,
  registrarGestion,
} from '@/lib/datos'
import { supabaseDisponible } from '@/lib/supabase'
import { construirMensajeCobranza, GYM_NOMBRE } from '@/lib/whatsapp'
import { bitacoraMock, fechaHoyIso, registrarGestion as registrarGestionMock } from '@/mocks/bitacora'
import { configGymMock } from '@/mocks/config'
import { planesMock } from '@/mocks/data'
import {
  descripcionEtapa,
  etapaDeGestion,
  etapaMayor,
  gestionPendiente,
  gestionesDunningMock,
  membresiasDunningMock,
  pipelineDunning,
  recuperadosPostSecuencia,
  sociosDunningMock,
} from '@/mocks/dunning'
import type { GestionCobranza } from '@/mocks/bitacora'
import type { EtapaDunning, MorosoPipeline } from '@/mocks/dunning'
import type { ConfigGym, Membresia, Socio } from '@/mocks/types'

const SECUENCIA_DUNNING: readonly { etapa: EtapaDunning; icono: typeof MessageCircle }[] = [
  { etapa: 'd0', icono: MessageCircle },
  { etapa: 'd1', icono: Bell },
  { etapa: 'd4', icono: MessageCircle },
  { etapa: 'd7', icono: Phone },
  { etapa: 'd12', icono: Snowflake },
  { etapa: 'escalado', icono: CircleAlert },
]

const PATRON_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function esIdBackend(id: string): boolean {
  return PATRON_UUID.test(id)
}

export default function CobranzaPage() {
  const [gestionesSesion, setGestionesSesion] = useState<readonly GestionCobranza[]>([])
  const [gestionadosHoy, setGestionadosHoy] = useState<ReadonlySet<string>>(new Set<string>())
  const [gestionesBackend, setGestionesBackend] = useState<GestionCobranza[] | null>(null)
  const [sociosBackend, setSociosBackend] = useState<Socio[] | null>(null)
  const [membresiasBackend, setMembresiasBackend] = useState<Membresia[] | null>(null)
  const [configBackend, setConfigBackend] = useState<ConfigGym | null>(null)
  const backendActivo = supabaseDisponible()

  useEffect(() => {
    let cancelado = false
    if (!backendActivo) return
    void cargarGestiones().then((remotas) => {
      if (!cancelado && remotas !== null) setGestionesBackend(remotas)
    })
    void cargarSocios().then((remotos) => {
      if (!cancelado && remotos !== null) setSociosBackend(remotos)
    })
    void cargarMembresias().then((remotas) => {
      if (!cancelado && remotas !== null) setMembresiasBackend(remotas)
    })
    void cargarConfigGym().then((remota) => {
      if (!cancelado && remota !== null) setConfigBackend(remota)
    })
    return () => {
      cancelado = true
    }
  }, [backendActivo])

  const hoyIso = fechaHoyIso()

  const gestionesBase = useMemo<readonly GestionCobranza[]>(
    () => gestionesBackend ?? [...bitacoraMock, ...gestionesDunningMock],
    [gestionesBackend],
  )
  const socios = sociosBackend ?? sociosDunningMock
  const membresias = useMemo(() => {
    const base = membresiasBackend ?? membresiasDunningMock
    const vigentePorSocio = new Map<string, boolean>()
    for (const membresia of base) {
      if (membresia.estado !== 'vencida') vigentePorSocio.set(membresia.socioId, true)
    }
    return base.filter(
      (membresia) =>
        membresia.estado !== 'vencida' || !vigentePorSocio.has(membresia.socioId),
    )
  }, [membresiasBackend])
  const config = configBackend ?? configGymMock

  const columnas = useMemo(
    () =>
      pipelineDunning(
        membresias,
        new Map(socios.map((socio) => [socio.id, socio])),
        gestionesBase,
        hoyIso,
      ),
    [membresias, socios, gestionesBase, hoyIso],
  )

  const totalMorosos = useMemo(
    () => columnas.reduce((suma, columna) => suma + columna.morosos.length, 0),
    [columnas],
  )
  const deudaTotal = useMemo(
    () => columnas.reduce((suma, columna) => suma + columna.deuda, 0),
    [columnas],
  )

  const pendientesHoy = useMemo(() => {
    const pendientes: MorosoPipeline[] = columnas.flatMap((columna) =>
      columna.morosos.filter((moroso) => {
        const gestionadoHoyId = gestionadosHoy.has(moroso.membresia.id)
        if (gestionadoHoyId) return false
        const etapasGestionadas = [...gestionesBase, ...gestionesSesion]
          .filter((gestion) => gestion.socioId === moroso.socio.id)
          .map((gestion) => etapaDeGestion(moroso.membresia.fechaFin, gestion.fecha))
          .filter((etapa): etapa is EtapaDunning => etapa !== null)
        const ultimaEtapaGestionada = etapasGestionadas.reduce<EtapaDunning | undefined>(
          (maxima, etapa) =>
            maxima === undefined || etapaMayor(etapa, maxima) ? etapa : maxima,
          undefined,
        )
        return gestionPendiente(columna.etapa, ultimaEtapaGestionada)
      }),
    )
    return pendientes.sort((a, b) => b.diasVencido - a.diasVencido)
  }, [columnas, gestionesBase, gestionesSesion, gestionadosHoy])

  const kpis = useMemo<readonly KpiPanel[]>(() => {
    const recuperados = recuperadosPostSecuencia(gestionesBase)
    return [
      {
        titulo: 'En cobranza',
        valor: String(totalMorosos),
        tendencia: 'Membresías vencidas activas',
        icono: Banknote,
      },
      {
        titulo: 'Deuda total',
        valor: formatoSoles(deudaTotal),
        tendencia: 'Por cobrar en la secuencia',
        icono: PiggyBank,
      },
      {
        titulo: 'Gestiones pendientes hoy',
        valor: String(pendientesHoy.length),
        tendencia: 'Socios cuya etapa supera su última gestión',
        icono: CircleAlert,
      },
      {
        titulo: 'Recuperado post-secuencia',
        valor: String(recuperados),
        tendencia: 'Socios comprometidos tras las gestiones',
        icono: CheckCircle2,
      },
    ]
  }, [totalMorosos, deudaTotal, pendientesHoy.length, gestionesBase])

  const registrarWhatsapp = (moroso: MorosoPipeline) => {
    setGestionesSesion((previas) =>
      registrarGestionMock(previas, {
        socioId: moroso.socio.id,
        tipo: 'whatsapp',
        resultado: 'pendiente',
        nota: 'Mensaje de cobranza enviado desde la secuencia dunning',
        fecha: hoyIso,
      }),
    )
    setGestionadosHoy((previos) => new Set(previos).add(moroso.membresia.id))
    if (backendActivo && esIdBackend(moroso.socio.id)) {
      void registrarGestion({
        socioId: moroso.socio.id,
        tipo: 'whatsapp',
        nota: 'Mensaje de cobranza enviado desde la secuencia dunning',
        resultado: 'pendiente',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Cobranza</h2>
        <p className="text-sm text-muted-foreground">
          Secuencia de recuperación d0 → d12
        </p>
      </div>

      <KpiCards kpis={kpis} />

      {totalMorosos === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-4xl" aria-hidden>
              🎉
            </span>
            <p className="text-sm font-medium">Sin deudas activas. Todo al día.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {pendientesHoy.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CircleAlert className="size-4 text-muted-foreground" />
                  Gestión pendiente HOY
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {pendientesHoy.map((moroso) => {
                    const plan = planesMock.find((p) => p.id === moroso.membresia.planId)
                    return (
                      <li
                        key={moroso.membresia.id}
                        className="flex min-w-0 flex-col gap-2 rounded-lg border p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium" title={moroso.socio.nombre}>
                              {moroso.socio.nombre}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {plan?.nombre ?? '—'} · vencida hace{' '}
                              {moroso.diasVencido === 1 ? '1 día' : `${moroso.diasVencido} días`}
                            </p>
                          </div>
                          <Badge className="shrink-0 bg-red-500/15 tabular-nums text-red-700 dark:text-red-400">
                            {formatoSoles(moroso.montoDebido)}
                          </Badge>
                        </div>
                        <BotonWhatsApp
                          tamano="sm"
                          texto="WhatsApp"
                          telefono={moroso.telefono}
                          mensaje={construirMensajeCobranza({
                            nombre: moroso.socio.nombre,
                            gym: config.nombre ?? GYM_NOMBRE,
                            plan: plan?.nombre ?? '—',
                            monto: moroso.montoDebido,
                            fechaVence: moroso.membresia.fechaFin,
                            linkPago: config.linkPagoCulqi,
                            yapeNumero: config.yapeNumero,
                          })}
                          onClick={() => registrarWhatsapp(moroso)}
                        />
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {columnas.map((columna) => (
              <ColumnaDunning
                key={columna.etapa}
                etapa={columna.etapa}
                morosos={columna.morosos}
                deuda={columna.deuda}
                gestionados={gestionadosHoy}
                onWhatsapp={registrarWhatsapp}
                nombreGym={config.nombre ?? GYM_NOMBRE}
                linkPago={config.linkPagoCulqi}
                yapeNumero={config.yapeNumero}
              />
            ))}
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-4 text-muted-foreground" />
            Cómo funciona la secuencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {SECUENCIA_DUNNING.map(({ etapa, icono: Icono }) => {
              const descripcion = descripcionEtapa(etapa)
              return (
                <li key={etapa} className="flex min-w-0 items-start gap-3 rounded-lg border p-3">
                  <Icono className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{descripcion.titulo}</p>
                    <p className="text-xs text-muted-foreground">{descripcion.accion}</p>
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Los reintentos se programan tras la quincena (días 1 y 15), cuando el socio
            peruano cobra y puede pagar.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
