import { useEffect, useMemo, useState } from 'react'
import { Check, CircleAlert } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { BotonWhatsApp } from '@/components/members/BotonWhatsApp'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatoSoles, iniciales } from '@/lib/format'
import { construirMensajeCobranza, GYM_NOMBRE } from '@/lib/whatsapp'
import { fechaHoyIso, registrarGestion } from '@/mocks/bitacora'
import type { GestionCobranza } from '@/mocks/bitacora'
import { cargarConfigGym, cargarGestionesDeSocio } from '@/lib/datos'
import { diasParaVencer } from '@/mocks/data'
import type { Membresia, Plan, Socio } from '@/mocks/types'
import { cn } from '@/lib/utils'

type Moroso = {
  membresiaId: string
  socioId: string
  nombre: string
  telefono: string
  planNombre: string
  montoDebido: number
  diasVencido: number
  fechaFin: string
}

type WidgetMorosidadProps = {
  membresias: readonly Membresia[]
  socios: ReadonlyMap<string, Socio>
  planes: ReadonlyMap<string, Plan>
}

export function WidgetMorosidad({ membresias, socios, planes }: WidgetMorosidadProps) {
  const [recordados, setRecordados] = useState<ReadonlySet<string>>(new Set<string>())
  const [gestionesSesion, setGestionesSesion] = useState<readonly GestionCobranza[]>([])
  const [linkPagoRemoto, setLinkPagoRemoto] = useState<string | undefined>(undefined)
  const [nombreGymRemoto, setNombreGymRemoto] = useState<string | undefined>(undefined)
  const [yapeRemoto, setYapeRemoto] = useState<string | undefined>(undefined)
  const [gestionesPorSocio, setGestionesPorSocio] = useState<ReadonlyMap<string, number>>(
    new Map<string, number>(),
  )

  useEffect(() => {
    let cancelado = false
    void cargarConfigGym().then((config) => {
      if (!cancelado) {
        setLinkPagoRemoto(config?.linkPagoCulqi)
        setNombreGymRemoto(config?.nombre)
        setYapeRemoto(config?.yapeNumero)
      }
    })
    return () => {
      cancelado = true
    }
  }, [])

  const morosos = useMemo<readonly Moroso[]>(() => {
    return membresias
      .filter((membresia) => membresia.estado === 'vencida')
      .map((membresia) => {
        const socio = socios.get(membresia.socioId)
        const plan = planes.get(membresia.planId)
        const diasVencido = Math.abs(diasParaVencer(membresia.fechaFin))
        const mesesVencidos = Math.max(1, Math.ceil(diasVencido / 30))
        return {
          membresiaId: membresia.id,
          socioId: membresia.socioId,
          nombre: socio?.nombre ?? 'Socio',
          telefono: socio?.telefono ?? '',
          planNombre: plan?.nombre ?? '—',
          montoDebido: membresia.monto * mesesVencidos,
          diasVencido,
          fechaFin: membresia.fechaFin,
        }
      })
      .sort((a, b) => b.montoDebido - a.montoDebido || b.diasVencido - a.diasVencido)
      .slice(0, 5)
  }, [membresias, socios, planes])

  const pendientes = morosos.filter((moroso) => !recordados.has(moroso.membresiaId))
  const totalPorCobrar = pendientes.reduce((suma, moroso) => suma + moroso.montoDebido, 0)

  useEffect(() => {
    if (morosos.length === 0) return
    let cancelado = false
    void Promise.all(
      morosos.map((moroso) =>
        cargarGestionesDeSocio(moroso.socioId).then((gestiones) => ({
          socioId: moroso.socioId,
          total: gestiones === null ? null : gestiones.length,
        })),
      ),
    ).then((resultados) => {
      if (cancelado) return
      const conteo = new Map<string, number>()
      for (const resultado of resultados) {
        if (resultado.total !== null) conteo.set(resultado.socioId, resultado.total)
      }
      setGestionesPorSocio(conteo)
    })
    return () => {
      cancelado = true
    }
  }, [morosos])

  const marcarRecordado = (membresiaId: string) => {
    setRecordados((previos) => new Set(previos).add(membresiaId))
  }

  const registrarWhatsapp = (socioId: string) => {
    setGestionesSesion((previas) =>
      registrarGestion(previas, {
        socioId,
        tipo: 'whatsapp',
        resultado: 'pendiente',
        nota: 'Mensaje de cobranza enviado',
        fecha: fechaHoyIso(),
      }),
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleAlert className="size-4 text-muted-foreground" />
          Morosidad
        </CardTitle>
        <CardDescription>Dinero atrapado en membresías vencidas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums text-destructive">
            {formatoSoles(totalPorCobrar)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendientes.length}{' '}
            {pendientes.length === 1 ? 'socio con deuda' : 'socios con deuda'}
          </p>
        </div>
        {morosos.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Sin morosidad registrada. Todo al día.
          </p>
        ) : (
          <ul className="space-y-3">
            {morosos.map((moroso) => {
              const recordado = recordados.has(moroso.membresiaId)
              const gestionesRemotas = gestionesPorSocio.get(moroso.socioId)
              const totalGestiones =
                gestionesRemotas !== undefined
                  ? gestionesRemotas +
                    gestionesSesion.filter(
                      (gestion) => gestion.socioId === moroso.socioId,
                    ).length
                  : null
              return (
                <li
                  key={moroso.membresiaId}
                  className={cn(
                    'flex flex-wrap items-center gap-3 rounded-lg border p-3 transition-opacity',
                    recordado && 'opacity-60',
                  )}
                >
                  <Avatar>
                    <AvatarFallback>{iniciales(moroso.nombre)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{moroso.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {moroso.planNombre} · vencida hace {moroso.diasVencido}{' '}
                      {moroso.diasVencido === 1 ? 'día' : 'días'}
                    </p>
                    <span className="mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                      {totalGestiones === null
                        ? '—'
                        : `${totalGestiones} ${
                            totalGestiones === 1 ? 'gestión' : 'gestiones'
                          }`}
                    </span>
                  </div>
                  <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
                  {recordado ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      <Check />
                      Recordado
                    </Badge>
                  ) : (
                    <>
                      <Badge className="bg-red-500/15 tabular-nums text-red-700 dark:text-red-400">
                        {formatoSoles(moroso.montoDebido)}
                      </Badge>
                      <BotonWhatsApp
                        tamano="sm"
                        telefono={moroso.telefono}
                        mensaje={construirMensajeCobranza({
                          nombre: moroso.nombre,
                          gym: nombreGymRemoto ?? GYM_NOMBRE,
                          plan: moroso.planNombre,
                          monto: moroso.montoDebido,
                          fechaVence: moroso.fechaFin,
                          linkPago: linkPagoRemoto,
                          yapeNumero: yapeRemoto,
                        })}
                        onClick={() => {
                          marcarRecordado(moroso.membresiaId)
                          registrarWhatsapp(moroso.socioId)
                        }}
                      />
                    </>
                  )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
