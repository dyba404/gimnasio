import { useEffect, useState } from 'react'
import { Banknote, Check, CreditCard, Smartphone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { actualizarConfigGym, cargarConfigGym } from '@/lib/datos'
import { supabaseDisponible } from '@/lib/supabase'
import { esLinkPagoValido } from '@/lib/whatsapp'

type MetodoPagoId = 'efectivo' | 'yape' | 'plin' | 'tarjeta'

type MetodoPago = {
  id: MetodoPagoId
  nombre: string
  descripcion: string
  icono: LucideIcon
  activado: boolean
  requiereCuenta?: boolean
  etiquetaCuenta?: string
  placeholderCuenta?: string
}

const METODOS_INICIALES: readonly MetodoPago[] = [
  {
    id: 'efectivo',
    nombre: 'Efectivo',
    descripcion: 'Cobros en recepción al momento del pago.',
    icono: Banknote,
    activado: true,
  },
  {
    id: 'yape',
    nombre: 'Yape',
    descripcion: 'Cobra con QR o número de celular.',
    icono: Smartphone,
    activado: true,
    requiereCuenta: true,
    etiquetaCuenta: 'Número Yape',
    placeholderCuenta: '9XX XXX XXX',
  },
  {
    id: 'plin',
    nombre: 'Plin',
    descripcion: 'Transferencia inmediata entre bancos.',
    icono: Smartphone,
    activado: true,
    requiereCuenta: true,
    etiquetaCuenta: 'Número o cuenta Plin',
    placeholderCuenta: '9XX XXX XXX',
  },
  {
    id: 'tarjeta',
    nombre: 'Tarjeta',
    descripcion: 'Visa, Mastercard y American Express.',
    icono: CreditCard,
    activado: false,
  },
]

export function MetodosPago() {
  const [metodos, setMetodos] = useState(METODOS_INICIALES)
  const [cuentas, setCuentas] = useState<Record<MetodoPagoId, string>>({
    efectivo: '',
    yape: '',
    plin: '',
    tarjeta: '',
  })
  const [umbral, setUmbral] = useState('7')
  const [linkPago, setLinkPago] = useState('')
  const [linkResena, setLinkResena] = useState('')
  const [guardado, setGuardado] = useState<'oculto' | 'pendiente' | 'ok' | 'error'>(
    'oculto',
  )
  const backendActivo = supabaseDisponible()

  useEffect(() => {
    let cancelado = false
    if (!backendActivo) return
    void cargarConfigGym().then((remota) => {
      if (!cancelado && remota !== null) {
        if (remota.linkPagoCulqi !== undefined) setLinkPago(remota.linkPagoCulqi)
        if (remota.linkResenaGoogle !== undefined) setLinkResena(remota.linkResenaGoogle)
        setCuentas((previos) => ({
          ...previos,
          yape: remota.yapeNumero ?? '',
          plin: remota.plinNumero ?? '',
        }))
      }
    })
    return () => {
      cancelado = true
    }
  }, [backendActivo])

  const linkLimpio = linkPago.trim()
  const linkValido = linkLimpio === '' || esLinkPagoValido(linkPago)

  const resenaLimpia = linkResena.trim()
  const resenaValida = resenaLimpia === '' || esLinkPagoValido(linkResena)

  const alternar = (id: MetodoPagoId) => {
    setMetodos((previos) =>
      previos.map((metodo) =>
        metodo.id === id ? { ...metodo, activado: !metodo.activado } : metodo,
      ),
    )
  }

  const actualizarCuenta = (id: MetodoPagoId, valor: string) => {
    setCuentas((previos) => ({ ...previos, [id]: valor }))
  }

  const guardar = async () => {
    if (!backendActivo) {
      setGuardado('ok')
      return
    }
    setGuardado('pendiente')
    const yapeLimpio = cuentas.yape.trim()
    const plinLimpio = cuentas.plin.trim()
    const exito = await actualizarConfigGym({
      yapeNumero: yapeLimpio === '' ? null : yapeLimpio,
      plinNumero: plinLimpio === '' ? null : plinLimpio,
      linkPagoCulqi: linkLimpio === '' ? null : linkLimpio,
      linkResenaGoogle: resenaLimpia === '' ? null : resenaLimpia,
    })
    setGuardado(exito ? 'ok' : 'error')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métodos de pago</CardTitle>
        <CardDescription>
          Elige cómo puedes recibir pagos de tus socios.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {metodos.map((metodo) => (
          <div key={metodo.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <metodo.icono className="size-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{metodo.nombre}</p>
                  <p className="text-sm text-muted-foreground">{metodo.descripcion}</p>
                </div>
              </div>
              <Switch
                checked={metodo.activado}
                onCheckedChange={() => alternar(metodo.id)}
                aria-label={`Activar ${metodo.nombre}`}
              />
            </div>
            {metodo.requiereCuenta && metodo.activado ? (
              <div className="space-y-1.5 pl-12">
                <Label htmlFor={`cuenta-${metodo.id}`}>{metodo.etiquetaCuenta}</Label>
                <Input
                  id={`cuenta-${metodo.id}`}
                  value={cuentas[metodo.id]}
                  onChange={(evento) => actualizarCuenta(metodo.id, evento.target.value)}
                  placeholder={metodo.placeholderCuenta}
                  inputMode="tel"
                />
              </div>
            ) : null}
          </div>
        ))}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Link de pago (CulqiLink)</p>
            <p className="text-sm text-muted-foreground">
              Créalo gratis en tu panel de Culqi y pégalo aquí. Acepta Yape, Plin
              y tarjetas.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="link-pago-culqi">URL del CulqiLink</Label>
            <Input
              id="link-pago-culqi"
              type="url"
              value={linkPago}
              onChange={(evento) => setLinkPago(evento.target.value)}
              placeholder="https://express.culqi.com/TU-LINK"
              aria-invalid={!linkValido || undefined}
            />
            {!linkValido ? (
              <p className="text-xs text-destructive">
                Debe ser una URL válida que empiece con https://
              </p>
            ) : null}
          </div>
        </div>
        <div className="space-y-3 rounded-lg border p-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Link de reseña Google</p>
            <p className="text-sm text-muted-foreground">
              Pégalo aquí para pedir reseñas a tus socios desde Marketing,
              justo después de una renovación.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="link-resena-google">URL del link de reseña</Label>
            <Input
              id="link-resena-google"
              type="url"
              value={linkResena}
              onChange={(evento) => setLinkResena(evento.target.value)}
              placeholder="https://g.page/r/TU-ID/review"
              aria-invalid={!resenaValida || undefined}
            />
            {!resenaValida ? (
              <p className="text-xs text-destructive">
                Debe ser una URL válida que empiece con https://
              </p>
            ) : null}
          </div>
        </div>
        <div className="space-y-3 rounded-lg border p-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Aviso de renovación</p>
            <p className="text-sm text-muted-foreground">
              Marca las membresías como "por vencer" los últimos días del periodo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="umbral-vencer"
              type="number"
              min={1}
              max={30}
              value={umbral}
              onChange={(evento) => setUmbral(evento.target.value)}
              className="w-20"
              aria-label="Días antes del vencimiento"
            />
            <span className="text-sm text-muted-foreground">
              días antes del vencimiento
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t pt-4">
          <Button
            onClick={() => void guardar()}
            disabled={!linkValido || !resenaValida || guardado === 'pendiente'}
          >
            Guardar cambios
          </Button>
          {guardado === 'pendiente' && (
            <p className="text-sm text-muted-foreground">Guardando…</p>
          )}
          {guardado === 'ok' && (
            <p className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="size-4" />
              Guardado
            </p>
          )}
          {guardado === 'error' && (
            <p className="text-sm text-destructive">
              No se pudo guardar — reintenta en un momento
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
