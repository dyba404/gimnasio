import jsQR from 'jsqr'
import { useEffect, useRef, useState, type RefObject } from 'react'

export type EstadoEscanner = 'inactivo' | 'iniciando' | 'escaneando' | 'error'

const INTERVALO_DECODIFICADO_MS = 100
const ANCHO_DECODIFICACION = 640
const COOLDOWN_MISMO_QR_MS = 2500

export function mensajeErrorCamara(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return 'Permiso de cámara denegado — permite la cámara en el candado de Chrome'
    }
    if (error.name === 'NotFoundError') {
      return 'No hay cámara web conectada'
    }
    if (error.name === 'NotReadableError') {
      return 'Otra app está usando la cámara'
    }
  }
  if (error instanceof Error && error.message === 'contexto-inseguro') {
    return 'La cámara requiere HTTPS o localhost'
  }
  if (error instanceof Error && error.message === 'canvas-2d') {
    return 'El navegador no pudo procesar el video de la cámara'
  }
  return 'No se pudo iniciar la cámara'
}

type EstadoInterno = {
  stream: MediaStream | null
  intervalo: number | null
  liberado: boolean
  ultimoTexto: string
  ultimoInstante: number
}

export function useQrScanner(
  activo: boolean,
  onQr: (texto: string) => void,
): {
  videoRef: RefObject<HTMLVideoElement | null>
  estado: EstadoEscanner
  error: string | null
} {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const onQrRef = useRef(onQr)
  const [estado, setEstado] = useState<EstadoEscanner>('inactivo')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    onQrRef.current = onQr
  })

  useEffect(() => {
    if (!activo) {
      return
    }
    if (
      typeof window === 'undefined' ||
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      const id = window.setTimeout(() => {
        setEstado('error')
        setError(mensajeErrorCamara(new Error('contexto-inseguro')))
      }, 0)
      return () => {
        window.clearTimeout(id)
      }
    }

    const interno: EstadoInterno = {
      stream: null,
      intervalo: null,
      liberado: false,
      ultimoTexto: '',
      ultimoInstante: 0,
    }

    function detener() {
      if (interno.intervalo !== null) {
        window.clearInterval(interno.intervalo)
        interno.intervalo = null
      }
      const video = videoRef.current
      if (video) {
        video.srcObject = null
      }
      if (interno.stream) {
        for (const track of interno.stream.getTracks()) {
          track.stop()
        }
        interno.stream = null
      }
    }

    function decodificar(video: HTMLVideoElement, contexto: CanvasRenderingContext2D) {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return
      const anchoVideo = video.videoWidth
      const altoVideo = video.videoHeight
      if (anchoVideo === 0 || altoVideo === 0) return
      const ancho = ANCHO_DECODIFICACION
      const alto = Math.max(1, Math.round((altoVideo / anchoVideo) * ANCHO_DECODIFICACION))
      if (contexto.canvas.height !== alto) {
        contexto.canvas.height = alto
      }
      contexto.drawImage(video, 0, 0, ancho, alto)
      const imagen = contexto.getImageData(0, 0, ancho, alto)
      const codigo = jsQR(imagen.data, ancho, alto, { inversionAttempts: 'dontInvert' })
      if (!codigo || codigo.data.length === 0) return
      const ahora = Date.now()
      if (
        codigo.data === interno.ultimoTexto &&
        ahora - interno.ultimoInstante < COOLDOWN_MISMO_QR_MS
      ) {
        return
      }
      interno.ultimoTexto = codigo.data
      interno.ultimoInstante = ahora
      onQrRef.current(codigo.data)
    }

    async function iniciar() {
      setEstado('iniciando')
      setError(null)
      try {
        interno.stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (interno.liberado) {
          detener()
          return
        }
        const video = videoRef.current
        if (!video) {
          detener()
          return
        }
        video.srcObject = interno.stream
        await video.play()
        const lienzo = document.createElement('canvas')
        lienzo.width = ANCHO_DECODIFICACION
        const contexto = lienzo.getContext('2d', { willReadFrequently: true })
        if (!contexto) {
          throw new Error('canvas-2d')
        }
        interno.intervalo = window.setInterval(() => {
          const actual = videoRef.current
          if (actual) {
            decodificar(actual, contexto)
          }
        }, INTERVALO_DECODIFICADO_MS)
        setEstado('escaneando')
      } catch (err) {
        if (interno.liberado) return
        detener()
        setEstado('error')
        setError(mensajeErrorCamara(err))
      }
    }

    void iniciar()

    return () => {
      interno.liberado = true
      detener()
    }
  }, [activo])

  return {
    videoRef,
    estado: activo ? estado : 'inactivo',
    error: activo ? error : null,
  }
}
