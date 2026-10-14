import { useMemo, useState } from 'react'
import { Camera, ScanLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useQrScanner } from '@/lib/use-qr-scanner'
import {
  decidirIngreso,
  parsearPayload,
  type ResultadoCarnet,
} from '@/lib/validar-carnet'
import { configGymMock } from '@/mocks/config'
import { membresiasMock, sociosMock } from '@/mocks/data'
import type { Membresia, Socio } from '@/mocks/types'

type EscanerQrProps = {
  activo: boolean
  onResultado: (resultado: ResultadoCarnet) => void
  socios?: readonly Socio[]
  membresias?: readonly Membresia[]
}

const LONGITUD_MAXIMA_CODIGO = 32

function mapaSocios(socios: readonly Socio[]): Map<string, Socio> {
  return new Map(socios.map((socio) => [socio.codigo, socio]))
}

function mapaMembresias(membresias: readonly Membresia[]): Map<string, Membresia> {
  const mapa = new Map<string, Membresia>()
  for (const membresia of membresias) {
    const previa = mapa.get(membresia.socioId)
    if (previa === undefined || membresia.fechaFin > previa.fechaFin) {
      mapa.set(membresia.socioId, membresia)
    }
  }
  return mapa
}

export function EscanerQr({ activo, onResultado, socios, membresias }: EscanerQrProps) {
  const [encendido, setEncendido] = useState(false)
  const camaraActiva = encendido && activo
  const mapas = useMemo(
    () => ({
      socios: mapaSocios(socios ?? sociosMock),
      membresias: mapaMembresias(membresias ?? membresiasMock),
    }),
    [socios, membresias],
  )

  function manejarQr(texto: string) {
    const payload = parsearPayload(texto)
    if (!payload) {
      onResultado({
        tipo: 'desconocido',
        motivo: 'El código escaneado no es un carné de Marsmode',
        codigoLeido: texto.slice(0, LONGITUD_MAXIMA_CODIGO),
      })
      return
    }
    onResultado(decidirIngreso(payload, mapas, configGymMock))
  }

  const { videoRef, estado, error } = useQrScanner(camaraActiva, manejarQr)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="size-5 text-primary" />
          Escanear carné
        </CardTitle>
        <CardDescription>
          Apunta la cámara al QR rotativo del carné del socio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {encendido ? (
          <div className="relative overflow-hidden rounded-xl border bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="aspect-video w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <span className="absolute top-3 left-3 size-10 rounded-tl-lg border-t-2 border-l-2 border-emerald-400" />
              <span className="absolute top-3 right-3 size-10 rounded-tr-lg border-t-2 border-r-2 border-emerald-400" />
              <span className="absolute bottom-3 left-3 size-10 rounded-bl-lg border-b-2 border-l-2 border-emerald-400" />
              <span className="absolute right-3 bottom-3 size-10 rounded-br-lg border-r-2 border-b-2 border-emerald-400" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-10 text-center">
            <ScanLine className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Activa la cámara para escanear el QR del carné
            </p>
          </div>
        )}
        <div aria-live="polite">
          {estado === 'error' && error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : null}
          {estado === 'iniciando' ? (
            <p className="text-sm text-muted-foreground">Iniciando cámara…</p>
          ) : null}
          {estado === 'escaneando' ? (
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Escaneando — coloca el QR dentro del marco
            </p>
          ) : null}
          {estado === 'inactivo' && encendido && !activo ? (
            <p className="text-sm text-muted-foreground">
              Escáner en pausa — cierra la ficha del socio para continuar
            </p>
          ) : null}
        </div>
        {encendido ? (
          <Button variant="outline" className="w-full" onClick={() => setEncendido(false)}>
            Detener cámara
          </Button>
        ) : (
          <Button size="lg" className="w-full" onClick={() => setEncendido(true)}>
            <Camera />
            Activar cámara
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
