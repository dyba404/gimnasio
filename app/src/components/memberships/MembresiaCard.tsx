import { useState } from 'react'
import { CalendarDays, Snowflake } from 'lucide-react'
import { EstadoMembresiaBadge } from '@/components/memberships/EstadoMembresiaBadge'
import {
  DIAS_CONGELAMIENTO_DEFAULT,
  diasPausadosReales,
  fechaFinExtendida,
  hoyIso,
  limitarDiasCongelamiento,
} from '@/components/memberships/congelamiento'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { diasParaVencer, formatoFecha, formatoSoles, progresoPeriodo } from '@/mocks/data'
import type { Membresia, Plan, Socio } from '@/mocks/types'

type MembresiaCardProps = {
  membresia: Membresia
  socio?: Socio
  plan?: Plan
  onRenovar?: (membresiaId: string) => void
  onCongelar?: (membresiaId: string, dias: number) => void
  onReanudar?: (membresiaId: string) => void
}

export function MembresiaCard({
  membresia,
  socio,
  plan,
  onRenovar,
  onCongelar,
  onReanudar,
}: MembresiaCardProps) {
  const [formCongelar, setFormCongelar] = useState(false)
  const [diasInput, setDiasInput] = useState(String(DIAS_CONGELAMIENTO_DEFAULT))

  const congelada = membresia.congelada
  const diasPausados = congelada ? diasPausadosReales(congelada, hoyIso()) : 0
  const renovable =
    !congelada &&
    (membresia.estado === 'vencida' || membresia.estado === 'por-vencer') &&
    onRenovar !== undefined
  const congelable = !congelada && membresia.estado === 'vigente' && onCongelar !== undefined
  const mostrarProgreso = membresia.estado !== 'vencida'
  const progreso = progresoPeriodo(membresia.fechaInicio, membresia.fechaFin)
  const dias = diasParaVencer(membresia.fechaFin)

  const abrirFormCongelar = () => {
    setDiasInput(String(DIAS_CONGELAMIENTO_DEFAULT))
    setFormCongelar(true)
  }

  const confirmarCongelamiento = () => {
    const diasSolicitados = limitarDiasCongelamiento(Number(diasInput))
    setFormCongelar(false)
    onCongelar?.(membresia.id, diasSolicitados)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="truncate">{socio?.nombre ?? 'Socio eliminado'}</span>
          {congelada ? (
            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <Snowflake />
              Congelada
            </Badge>
          ) : (
            <EstadoMembresiaBadge estado={membresia.estado} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="size-4" />
            {plan?.nombre ?? '—'}
          </span>
          <span className="font-semibold tabular-nums">{formatoSoles(membresia.monto)}</span>
        </div>
        <div className="space-y-1.5">
          <div className="text-sm text-muted-foreground tabular-nums">
            {formatoFecha(membresia.fechaInicio)} – {formatoFecha(membresia.fechaFin)}
          </div>
          {congelada ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-xs text-sky-700 dark:text-sky-400">
              <Snowflake className="size-3" />
              Si reanudas hoy, vence el {formatoFecha(fechaFinExtendida(membresia))}
            </span>
          ) : null}
        </div>
        {mostrarProgreso ? (
          <div className="space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={
                  congelada || membresia.estado === 'por-vencer'
                    ? 'h-full rounded-full bg-amber-500'
                    : 'h-full rounded-full bg-primary'
                }
                style={{ width: `${progreso}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {congelada
                ? `${diasPausados} ${diasPausados === 1 ? 'día' : 'días'} en pausa · se extienden al reanudar`
                : dias === 0
                  ? 'vence hoy'
                  : `quedan ${dias} ${dias === 1 ? 'día' : 'días'}`}
            </p>
          </div>
        ) : congelada ? (
          <p className="text-xs text-muted-foreground">
            Congelada · {diasPausados} {diasPausados === 1 ? 'día' : 'días'} en pausa
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Venció hace {Math.abs(dias)} {Math.abs(dias) === 1 ? 'día' : 'días'} · sin renovar
          </p>
        )}
      </CardContent>
      {congelada ? (
        <CardFooter>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => onReanudar?.(membresia.id)}
          >
            <Snowflake />
            Reanudar
          </Button>
        </CardFooter>
      ) : formCongelar ? (
        <CardFooter className="gap-2">
          <Input
            type="number"
            min={1}
            max={90}
            className="h-8 w-20 tabular-nums"
            aria-label="Días a congelar"
            value={diasInput}
            onChange={(evento) => setDiasInput(evento.target.value)}
          />
          <span className="text-sm text-muted-foreground">días</span>
          <Button size="sm" className="flex-1" onClick={confirmarCongelamiento}>
            <Snowflake />
            Congelar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setFormCongelar(false)}>
            Cancelar
          </Button>
        </CardFooter>
      ) : renovable ? (
        <CardFooter>
          <Button size="sm" className="w-full" onClick={() => onRenovar(membresia.id)}>
            Renovar
          </Button>
        </CardFooter>
      ) : congelable ? (
        <CardFooter>
          <Button size="sm" variant="outline" className="w-full" onClick={abrirFormCongelar}>
            <Snowflake />
            Congelar
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}
