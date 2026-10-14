import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EscanerQr } from '../EscanerQr'
import { mensajeErrorCamara } from '@/lib/use-qr-scanner'

function render(activo: boolean): string {
  return renderToStaticMarkup(<EscanerQr activo={activo} onResultado={() => {}} />).replace(
    /<!--[^>]*-->/g,
    '',
  )
}

describe('EscanerQr — estado inactivo (SSR sin cámara)', () => {
  const html = render(false)

  it('renderiza la tarjeta con botón para activar la cámara', () => {
    expect(html).toContain('Escanear carné')
    expect(html).toContain('Activar cámara')
    expect(html).toContain('Apunta la cámara al QR rotativo')
  })

  it('sin cámara activa no renderiza el video ni estados de escaneo', () => {
    expect(html).not.toContain('<video')
    expect(html).not.toContain('Escaneando')
    expect(html).not.toContain('Iniciando cámara')
  })

  it('activo=true en SSR no accede a cámara ni crashea (degrada a inactivo)', () => {
    const htmlActivo = render(true)
    expect(htmlActivo).toContain('Activar cámara')
    expect(htmlActivo).not.toContain('<video')
    expect(htmlActivo).not.toContain('text-destructive')
  })
})

describe('mensajeErrorCamara — errores concretos en español', () => {
  it('NotAllowedError: instrucción del candado de Chrome', () => {
    expect(mensajeErrorCamara(new DOMException('denied', 'NotAllowedError'))).toBe(
      'Permiso de cámara denegado — permite la cámara en el candado de Chrome',
    )
  })

  it('NotFoundError: no hay webcam', () => {
    expect(mensajeErrorCamara(new DOMException('none', 'NotFoundError'))).toBe(
      'No hay cámara web conectada',
    )
  })

  it('NotReadableError: cámara ocupada por otra app', () => {
    expect(mensajeErrorCamara(new DOMException('busy', 'NotReadableError'))).toBe(
      'Otra app está usando la cámara',
    )
  })

  it('contexto inseguro: requiere HTTPS o localhost', () => {
    expect(mensajeErrorCamara(new Error('contexto-inseguro'))).toBe(
      'La cámara requiere HTTPS o localhost',
    )
  })

  it('error desconocido: mensaje genérico sin exponer detalles técnicos', () => {
    expect(mensajeErrorCamara(new Error('algo raro'))).toBe('No se pudo iniciar la cámara')
    expect(mensajeErrorCamara(undefined)).toBe('No se pudo iniciar la cámara')
  })
})
