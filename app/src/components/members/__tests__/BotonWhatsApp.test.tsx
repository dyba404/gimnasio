import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BotonWhatsApp } from '../BotonWhatsApp'

function render(telefono: string): string {
  return renderToStaticMarkup(
    <BotonWhatsApp telefono={telefono} mensaje="Hola Rosa ¿renovamos?" />,
  ).replace(/<!--[^>]*-->/g, '')
}

describe('BotonWhatsApp — teléfono válido', () => {
  const html = render('999 876 543')

  it('genera el enlace wa.me con el número normalizado a 51 + 9 dígitos', () => {
    expect(html).toContain('href="https://wa.me/51999876543?text=')
  })

  it('abre en pestaña nueva con noopener', () => {
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('no se deshabilita ni atenúa', () => {
    expect(html).not.toContain('aria-disabled="true"')
    expect(html).not.toContain('pointer-events-none opacity-50')
  })
})

describe('BotonWhatsApp — teléfono inválido (enlace roto prevenido)', () => {
  it('8 dígitos: sin href a wa.me, aria-disabled y atenuado', () => {
    const html = render('99987654')
    expect(html).not.toContain('wa.me')
    expect(html).not.toContain('href=')
    expect(html).toContain('aria-disabled="true"')
    expect(html).toContain('pointer-events-none')
    expect(html).toContain('opacity-50')
  })

  it('vacío: sin href a wa.me, aria-disabled y atenuado', () => {
    const html = render('')
    expect(html).not.toContain('wa.me')
    expect(html).toContain('aria-disabled="true"')
    expect(html).toContain('pointer-events-none')
    expect(html).toContain('opacity-50')
  })

  it('letras: sin href a wa.me, aria-disabled y atenuado', () => {
    const html = render('sin teléfono')
    expect(html).not.toContain('wa.me')
    expect(html).toContain('aria-disabled="true"')
  })

  it('el texto del botón sigue visible para que el socio sepa que faltan datos', () => {
    expect(render('99987654')).toContain('Cobrar por WhatsApp')
  })
})

describe('BotonWhatsApp — mensaje con link de pago (CulqiLink)', () => {
  const LINK = 'https://express.culqi.com/DEMOMARS01'
  const mensajeConLink = `Hola Rosa\n\nRenueva aquí (Yape, Plin o tarjeta):\n${LINK}`

  function renderConMensaje(mensaje: string): string {
    return renderToStaticMarkup(
      <BotonWhatsApp telefono="999876543" mensaje={mensaje} />,
    ).replace(/<!--[^>]*-->/g, '')
  }

  it('el link sobrevive al encodeo del href y decodifica intacto', () => {
    const html = renderConMensaje(mensajeConLink)
    const texto = html.split('?text=')[1]?.split('"')[0] ?? ''
    expect(decodeURIComponent(texto)).toBe(mensajeConLink)
    expect(decodeURIComponent(texto)).toContain(LINK)
  })

  it('mensaje sin link sigue generando el enlace wa.me normal', () => {
    const html = renderConMensaje('Hola Rosa ¿renovamos?')
    expect(html).toContain('href="https://wa.me/51999876543?text=')
    expect(html).not.toContain('Renueva')
  })
})
