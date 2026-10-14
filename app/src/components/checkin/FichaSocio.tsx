import { useEffect, useState } from 'react'
import { Check, Gift, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BotonWhatsApp } from '@/components/members/BotonWhatsApp'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatoSoles, iniciales } from '@/lib/format'
import { construirMensajeCobranza, GYM_NOMBRE } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'
import { cargarConfigGym } from '@/lib/datos'
import { sociosMock } from '@/mocks/data'
import { descuentoProximoPago, referidoDeSocio, referidosMock } from '@/mocks/referidos'
import type { ConfigGym, Membresia, Plan, Socio } from '@/mocks/types'
import {
  clasesEstado,
  etiquetaEstado,
  estadoDeSocio,
  membresiaDeSocio,
  planDeSocio,
  textoVencimiento,
} from './membresia-ui'
import type { EstadoMembresia } from '@/mocks/types'

type FichaSocioProps = {
  socio: Socio
  estado?: EstadoMembresia
  membresia?: Membresia
  plan?: Plan
  linkPago?: string
  onCheckin: (socio: Socio) => void
  onDenegar: (socio: Socio) => void
  onCobrar: (socio: Socio) => void
  onCancelar: () => void
}

export function FichaSocio({
  socio,
  estado: estadoProp,
  membresia: membresiaProp,
  plan: planProp,
  linkPago: linkPagoProp,
  onCheckin,
  onDenegar,
  onCobrar,
  onCancelar,
}: FichaSocioProps) {
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

  const linkPago = linkPagoProp ?? configRemota?.linkPagoCulqi
  const estado = estadoProp ?? estadoDeSocio(socio)
  const vencida = estado === 'vencida'
  const plan = planProp ?? planDeSocio(socio.id)
  const membresia = membresiaProp ?? membresiaDeSocio(socio.id)
  const precio = plan?.precio ?? 0
  const nombreGym = configRemota?.nombre ?? GYM_NOMBRE
  const yapeGym = configRemota?.yapeNumero
  const referido = referidoDeSocio(socio.id)
  const referidor = referido
    ? sociosMock.find((candidato) => candidato.id === referido.referidorId)
    : undefined
  const descuentosReferidos = descuentoProximoPago(socio.id, referidosMock)

  return (
    <Card className="py-8">
      <CardContent className="space-y-8 px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-6">
            <Avatar className="size-20 border border-border">
              <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
                {iniciales(socio.nombre)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1.5">
              <h3 className="text-2xl font-semibold tracking-tight">
                {socio.nombre}
              </h3>
              <p className="text-sm text-muted-foreground">
                {socio.codigo} · DNI {socio.dni}
              </p>
              {referidor && (
                <p className="text-sm text-muted-foreground">
                  Referido por {referidor.nombre}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge
                  variant="secondary"
                  className={cn('px-3 py-1 text-xs font-semibold', clasesEstado[estado])}
                >
                  {etiquetaEstado[estado]}
                </Badge>
                {descuentosReferidos > 0 && (
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    <Gift />
                    {formatoSoles(descuentosReferidos)} en descuentos por referidos
                  </Badge>
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    vencida
                      ? 'text-red-600 dark:text-red-400'
                      : estado === 'por-vencer'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-muted-foreground',
                  )}
                >
                  {membresia
                    ? textoVencimiento(membresia.fechaFin)
                    : 'Sin membresía registrada'}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cancelar selección"
            onClick={onCancelar}
          >
            <X />
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-5 py-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Plan actual</p>
            <p className="text-lg font-semibold">{plan?.nombre ?? 'Sin plan'}</p>
          </div>
          <p className="text-lg font-semibold tabular-nums">
            {formatoSoles(precio)}
            <span className="text-sm font-normal text-muted-foreground"> /mes</span>
          </p>
        </div>

        {vencida && (
          <div className="space-y-4 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-red-600 dark:text-red-400">
                  Membresía vencida
                </p>
                <p className="text-sm text-muted-foreground">
                  Registra el pago para permitir el acceso
                </p>
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                {formatoSoles(precio)}
              </p>
            </div>
            <Button className="w-full" size="lg" onClick={() => onCobrar(socio)}>
              Cobrar ahora
            </Button>
            {membresia && (
              <BotonWhatsApp
                className="w-full"
                telefono={socio.telefono}
                mensaje={construirMensajeCobranza({
                  nombre: socio.nombre,
                  gym: nombreGym,
                  plan: plan?.nombre ?? '—',
                  monto: precio,
                  fechaVence: membresia.fechaFin,
                  linkPago,
                  yapeNumero: yapeGym,
                })}
              />
            )}
          </div>
        )}

        <div className="flex gap-4">
          {vencida ? (
            <Button
              variant="destructive"
              size="lg"
              className="h-16 flex-1 text-lg font-semibold"
              onClick={() => onDenegar(socio)}
            >
              Denegar
            </Button>
          ) : (
            <Button
              size="lg"
              className="h-16 flex-1 bg-emerald-600 text-lg font-semibold text-white hover:bg-emerald-700"
              onClick={() => onCheckin(socio)}
            >
              <Check className="size-6" />
              Registrar ingreso
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
