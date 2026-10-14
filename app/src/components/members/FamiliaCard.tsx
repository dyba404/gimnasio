import { useEffect, useState } from 'react'
import { Users, TriangleAlert } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { BotonWhatsApp } from '@/components/members/BotonWhatsApp'
import { EstadoMembresiaBadge } from '@/components/memberships/EstadoMembresiaBadge'
import { Separator } from '@/components/ui/separator'
import { etiquetaConcepto } from '@/mocks/caja-data'
import { formatoSoles, iniciales } from '@/lib/format'
import { construirMensajeCobranza, GYM_NOMBRE } from '@/lib/whatsapp'
import {
  cuentaDe,
  etiquetaParentesco,
  familiaVencida,
  familiasMock,
  totalFactura,
} from '@/mocks/familias'
import type { CuentaFamiliar, FacturaGrupo } from '@/mocks/familias'
import { fechaHoyIso } from '@/mocks/bitacora'
import { facturasMock, membresiasMock, sociosMock } from '@/mocks/familias'
import { cargarConfigGym } from '@/lib/datos'
import type { ConfigGym, EstadoMembresia, Membresia, Socio } from '@/mocks/types'
import { cn } from '@/lib/utils'

type FamiliaCardProps = {
  socioId: string
  socios?: readonly Socio[]
  membresias?: readonly Membresia[]
  familias?: readonly CuentaFamiliar[]
  facturas?: readonly FacturaGrupo[]
  hoyIso?: string
}

function estadoDe(
  membresias: readonly Membresia[],
  socioId: string,
): EstadoMembresia | undefined {
  return membresias.find((membresia) => membresia.socioId === socioId)?.estado
}

export function FamiliaCard({
  socioId,
  socios = sociosMock,
  membresias = membresiasMock,
  familias = familiasMock,
  facturas = facturasMock,
  hoyIso = fechaHoyIso(),
}: FamiliaCardProps) {
  const [configRemota, setConfigRemota] = useState<ConfigGym | null>(null)

  useEffect(() => {
    let cancelado = false
    void cargarConfigGym().then((config) => {
      if (!cancelado) setConfigRemota(config)
    })
    return () => {
      cancelado = true
    }
  }, [])

  const cuenta = cuentaDe(familias, socioId)
  if (!cuenta) return null

  const sociosMap = new Map(socios.map((socio): [string, Socio] => [socio.id, socio]))
  const head = sociosMap.get(cuenta.headSocioId)
  const esHead = cuenta.headSocioId === socioId
  const vencida = familiaVencida(cuenta, membresias, hoyIso)
  const factura = facturas.find(
    (item) => item.cuentaId === cuenta.id && item.estado === 'abierta',
  )

  const filas = [
    { socioId: cuenta.headSocioId, parentesco: undefined, esHead: true },
    ...cuenta.miembros.map((miembro) => ({
      socioId: miembro.socioId,
      parentesco: miembro.parentesco,
      esHead: false,
    })),
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Cuenta familiar</p>
        <Badge
          className={cn(
            esHead
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <Users />
          {esHead ? 'Head' : etiquetaParentesco[filas.find((f) => f.socioId === socioId)?.parentesco ?? 'otro']}
        </Badge>
      </div>

      {vencida && head ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            Membresía de la cuenta vencida — el cobro va a cargo de{' '}
            <span className="font-medium">{head.nombre}</span>.
          </p>
        </div>
      ) : null}

      <ul className="space-y-1">
        {filas.map((fila) => {
          const socio = sociosMap.get(fila.socioId)
          if (!socio) return null
          const estado = estadoDe(membresias, fila.socioId)
          return (
            <li
              key={fila.socioId}
              className={cn(
                'flex items-center gap-2 rounded-lg px-2 py-1.5',
                fila.esHead && 'bg-muted/60',
              )}
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-[10px] font-medium text-primary">
                  {iniciales(socio.nombre)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-sm">{socio.nombre}</span>
              <Badge
                variant="outline"
                className="shrink-0 text-[11px] text-muted-foreground"
              >
                {fila.esHead ? 'Head' : etiquetaParentesco[fila.parentesco ?? 'otro']}
              </Badge>
              {estado ? <EstadoMembresiaBadge estado={estado} /> : null}
            </li>
          )
        })}
      </ul>

      {factura && head ? (
        <>
          <Separator />
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                Factura agrupada
              </p>
              <Badge
                className={cn(
                  factura.estado === 'abierta'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
                )}
              >
                {factura.estado === 'abierta' ? 'Abierta' : 'Cobrada'}
              </Badge>
            </div>
            <ul className="space-y-1.5">
              {factura.items.map((item, indice) => (
                <li
                  key={`${item.socioId}-${item.concepto}-${indice}`}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate text-muted-foreground">
                    {sociosMap.get(item.socioId)?.nombre ?? '—'} ·{' '}
                    {etiquetaConcepto[item.concepto]}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatoSoles(item.monto)}
                  </span>
                </li>
              ))}
            </ul>
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatoSoles(totalFactura(factura))}
              </span>
            </div>
            {vencida ? (
              <BotonWhatsApp
                tamano="sm"
                className="w-full"
                telefono={head.telefono}
                mensaje={construirMensajeCobranza({
                  nombre: head.nombre,
                  gym: configRemota?.nombre ?? GYM_NOMBRE,
                  plan: 'familiar',
                  monto: totalFactura(factura),
                  fechaVence: hoyIso,
                  linkPago: configRemota?.linkPagoCulqi,
                  yapeNumero: configRemota?.yapeNumero,
                })}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}
