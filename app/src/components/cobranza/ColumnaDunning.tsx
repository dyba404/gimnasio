import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BotonWhatsApp } from '@/components/members/BotonWhatsApp'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { abreviarTexto, formatoSoles } from '@/lib/format'
import { construirMensajeCobranza } from '@/lib/whatsapp'
import { planesMock } from '@/mocks/data'
import { descripcionEtapa } from '@/mocks/dunning'
import type { EtapaDunning, MorosoPipeline } from '@/mocks/dunning'
import { cn } from '@/lib/utils'

const planPorId = new Map(planesMock.map((plan) => [plan.id, plan]))

type PropsColumna = {
  morosos: readonly MorosoPipeline[]
  gestionados: ReadonlySet<string>
  onWhatsapp: (moroso: MorosoPipeline) => void
  nombreGym: string
  linkPago?: string
  yapeNumero?: string
}

function CardMoroso({
  moroso,
  gestionado,
  onWhatsapp,
  nombreGym,
  linkPago,
  yapeNumero,
}: {
  moroso: MorosoPipeline
  gestionado: boolean
  onWhatsapp: (moroso: MorosoPipeline) => void
  nombreGym: string
  linkPago?: string
  yapeNumero?: string
}) {
  const plan = planPorId.get(moroso.membresia.planId)?.nombre ?? '—'
  return (
    <li
      className={cn(
        'min-w-0 space-y-2 rounded-lg border p-3 transition-opacity',
        gestionado && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={moroso.socio.nombre}>
            {moroso.socio.nombre}
          </p>
          <p className="text-xs text-muted-foreground">
            {abreviarTexto(plan, 12)} · vencida hace {moroso.diasVencido}
            {moroso.diasVencido === 1 ? 'día' : 'días'}
          </p>
        </div>
        <Badge className="shrink-0 bg-red-500/15 tabular-nums text-red-700 dark:text-red-400">
          {formatoSoles(moroso.montoDebido)}
        </Badge>
      </div>
      {gestionado ? (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
          <Check />
          Gestionado hoy
        </Badge>
      ) : (
        <BotonWhatsApp
          tamano="sm"
          texto="WhatsApp"
          className="w-full"
          telefono={moroso.telefono}
          mensaje={construirMensajeCobranza({
            nombre: moroso.socio.nombre,
            gym: nombreGym,
            plan,
            monto: moroso.montoDebido,
            fechaVence: moroso.membresia.fechaFin,
            linkPago,
            yapeNumero,
          })}
          onClick={() => onWhatsapp(moroso)}
        />
      )}
    </li>
  )
}

export function ColumnaDunning({
  etapa,
  morosos,
  deuda,
  gestionados,
  onWhatsapp,
  nombreGym,
  linkPago,
  yapeNumero,
}: PropsColumna & {
  etapa: EtapaDunning
  deuda: number
}) {
  const descripcion = descripcionEtapa(etapa)
  return (
    <Card className="min-w-0 gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span className="flex min-w-0 flex-col">
            <span className="truncate">{descripcion.titulo}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {descripcion.accion}
            </span>
          </span>
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {morosos.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <p className="text-xs tabular-nums text-muted-foreground">
          {formatoSoles(deuda)}
        </p>
        {morosos.length === 0 ? (
          <p className="py-2 text-center text-xs text-muted-foreground">
            Sin socios en esta etapa
          </p>
        ) : (
          <ul className="space-y-3">
            {morosos.map((moroso) => (
              <CardMoroso
                key={moroso.membresia.id}
                moroso={moroso}
                gestionado={gestionados.has(moroso.membresia.id)}
                onWhatsapp={onWhatsapp}
                nombreGym={nombreGym}
                linkPago={linkPago}
                yapeNumero={yapeNumero}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
