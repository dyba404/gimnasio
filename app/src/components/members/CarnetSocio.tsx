import { useEffect, useMemo, useState } from 'react'
import { Printer, ShieldCheck } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { VencimientoBadge } from '@/components/members/VencimientoBadge'
import { BotonInstalar } from '@/components/pwa/BotonInstalar'
import { formatoSoles, iniciales } from '@/lib/format'
import { PERIODO_TOTP, epochActual, generarToken } from '@/lib/totp'
import { formatoFecha } from '@/mocks/data'
import { membresiaDeSocio, planDeSocio } from '@/components/checkin/membresia-ui'
import type { Membresia, Plan, Socio } from '@/mocks/types'

const CSS_IMPRESION = `@media print {
  body * { visibility: hidden; }
  .carnet-imprimible, .carnet-imprimible * { visibility: visible; }
  .carnet-imprimible {
    position: absolute;
    inset: 0 auto auto 50%;
    transform: translateX(-50%);
    width: 320px;
    border: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}`

export function contenidoQr(
  socio: Socio,
  fechaVencimiento: string,
  token?: string,
  exp?: number,
): string {
  const payload: Record<string, string | number> = {
    codigo: socio.codigo,
    dni: socio.dni,
    vence: fechaVencimiento,
  }
  if (token !== undefined && exp !== undefined) {
    payload.token = token
    payload.exp = exp
  }
  return JSON.stringify(payload)
}

type InstanteQr = { token: string; exp: number; segundos: number }

function instanteActual(socio: Socio): InstanteQr {
  const epoch = epochActual()
  const segundos = PERIODO_TOTP - (epoch % PERIODO_TOTP)
  return { token: generarToken(socio, epoch), exp: epoch + segundos, segundos }
}

const RADIO_ANILLO = 76
const CIRCUNFERENCIA = 2 * Math.PI * RADIO_ANILLO

function QrRotativo({ socio, fechaFin }: { socio: Socio; fechaFin: string }) {
  const [instante, setInstante] = useState<InstanteQr>(() => instanteActual(socio))

  useEffect(() => {
    const id = setInterval(() => {
      setInstante((previo) => {
        const epoch = epochActual()
        const segundos = PERIODO_TOTP - (epoch % PERIODO_TOTP)
        const exp = epoch + segundos
        if (exp === previo.exp) {
          return { ...previo, segundos }
        }
        return { token: generarToken(socio, epoch), exp, segundos }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [socio])

  const value = useMemo(
    () => contenidoQr(socio, fechaFin, instante.token, instante.exp),
    [socio, fechaFin, instante.token, instante.exp],
  )

  const offset = CIRCUNFERENCIA * (1 - instante.segundos / PERIODO_TOTP)
  const colorAnillo = instante.segundos <= 5 ? '#ef4444' : '#2563eb'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative size-[168px]">
        <svg viewBox="0 0 168 168" className="absolute inset-0 size-full" aria-hidden="true">
          <circle
            cx="84"
            cy="84"
            r={RADIO_ANILLO}
            fill="none"
            strokeWidth="5"
            className="stroke-border"
          />
          <circle
            cx="84"
            cy="84"
            r={RADIO_ANILLO}
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            stroke={colorAnillo}
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={offset}
            transform="rotate(-90 84 84)"
            className="transition-[stroke-dashoffset,stroke] duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-[30px] rounded-2xl border bg-white p-2">
          <QRCodeSVG
            value={value}
            size={90}
            marginSize={1}
            level="M"
            bgColor="#ffffff"
            fgColor="#0f172a"
            title={`Carné ${socio.codigo}`}
            className="size-full"
          />
        </div>
      </div>
      <p className="font-mono text-xl font-semibold tracking-[0.35em] text-foreground">
        {socio.codigo}
      </p>
      <p className="text-xs text-muted-foreground tabular-nums">
        Se regenera en {instante.segundos}s
      </p>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-emerald-600" />
        Código único y personal — no compartible
      </p>
      <p className="text-xs text-muted-foreground">Muestra este código en recepción</p>
    </div>
  )
}

type TarjetaCarnetProps = {
  socio: Socio
  membresia: Membresia | undefined
  plan: Plan | undefined
}

export function TarjetaCarnet({ socio, membresia, plan }: TarjetaCarnetProps) {
  const fechaFin = membresia?.fechaFin ?? ''
  return (
    <div className="carnet-imprimible overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 bg-gradient-to-br from-blue-700 to-blue-500 p-5 text-white">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 border-2 border-white/40">
            <AvatarFallback className="bg-white/15 text-base font-semibold text-white">
              {iniciales(socio.nombre)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-white/70 uppercase">
              Marsmode
            </p>
            <p className="truncate text-lg leading-tight font-semibold">{socio.nombre}</p>
            <p className="text-xs text-white/80 tabular-nums">DNI {socio.dni}</p>
          </div>
        </div>
        <span className="rounded-md bg-white/15 px-2 py-1 font-mono text-xs font-semibold">
          {socio.codigo}
        </span>
      </div>
      <div className="space-y-4 p-5">
        <QrRotativo socio={socio} fechaFin={fechaFin} />
        <Separator />
        <dl className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <dt className="text-xs text-muted-foreground">Plan</dt>
            <dd className="text-sm font-medium">{plan?.nombre ?? '—'}</dd>
            <dd className="text-sm font-semibold tabular-nums">
              {plan ? formatoSoles(plan.precio) : '—'}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs text-muted-foreground">Vence</dt>
            <dd className="text-sm font-medium">
              {membresia ? formatoFecha(membresia.fechaFin) : '—'}
            </dd>
            <dd>
              {membresia ? <VencimientoBadge fechaFin={membresia.fechaFin} /> : null}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

type CarnetSocioProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  socio: Socio | null
}

export function CarnetSocio({ open, onOpenChange, socio }: CarnetSocioProps) {
  const membresia = socio ? membresiaDeSocio(socio.id) : undefined
  const plan = socio ? planDeSocio(socio.id) : undefined
  return (
    <Sheet open={open && socio !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-sm">
        <style>{CSS_IMPRESION}</style>
        <SheetHeader className="print:hidden pb-4">
          <SheetTitle>Carné del socio</SheetTitle>
          <SheetDescription>
            Carné digital con QR de verificación — el escáner de recepción validará el acceso.
          </SheetDescription>
        </SheetHeader>
        {socio ? (
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            <TarjetaCarnet socio={socio} membresia={membresia} plan={plan} />
            <div className="mt-4 flex gap-2 print:hidden">
              <Button className="flex-1" onClick={() => window.print()}>
                <Printer /> Imprimir
              </Button>
            </div>
            <div className="mt-3">
              <BotonInstalar />
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
