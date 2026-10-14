import { describe, expect, it } from 'vitest'
import {
  construirMensajeCobranza,
  construirMensajeRecordatorio,
  enlaceWhatsApp,
  esLinkPagoValido,
  formatoFecha,
  normalizarTelefono,
  telefonoValido,
} from '../whatsapp'

const FECHA = '2026-09-10'

const paramsCobranza = {
  nombre: 'Rosa Ñahui Quispe',
  gym: 'Marsmode Fitness',
  plan: 'Mensual',
  monto: 80,
  fechaVence: FECHA,
}

describe('formatoFecha', () => {
  it('convierte ISO a formato dd/MM/yyyy', () => {
    expect(formatoFecha('2026-09-10')).toBe('10/09/2026')
  })

  it('rechaza fecha no ISO sin lanzar NaN en el mensaje', () => {
    expect(() => formatoFecha('ayer')).toThrow(RangeError)
  })
})

describe('normalizarTelefono', () => {
  it('acepta 5 formatos de escritura y produce el mismo resultado', () => {
    const esperado = '51999876543'
    expect(normalizarTelefono('976 118 240')).toBe(esperado)
    expect(normalizarTelefono('999876543')).toBe(esperado)
    expect(normalizarTelefono('+51 976 118 240')).toBe(esperado)
    expect(normalizarTelefono('51999876543')).toBe(esperado)
    expect(normalizarTelefono('+51999876543')).toBe(esperado)
  })

  it('elimina guiones y otros separadores', () => {
    expect(normalizarTelefono('976-118-240')).toBe('51999876543')
  })

  it('no duplica el prefijo 51 cuando ya viene con país', () => {
    expect(normalizarTelefono('+51 976 118 240')).toBe('51999876543')
    expect(normalizarTelefono('51999876543')).toBe('51999876543')
  })

  it('decisión documentada: con 9 dígitos antepone 51; con cualquier otra longitud devuelve los dígitos tal cual', () => {
    expect(normalizarTelefono('97611824')).toBe('97611824')
    expect(normalizarTelefono('5197611824')).toBe('5197611824')
    expect(normalizarTelefono('')).toBe('')
  })
})

describe('telefonoValido', () => {
  it('acepta un celular peruano escrito en 5 formatos', () => {
    expect(telefonoValido('976 118 240')).toBe(true)
    expect(telefonoValido('999876543')).toBe(true)
    expect(telefonoValido('+51 976 118 240')).toBe(true)
    expect(telefonoValido('51999876543')).toBe(true)
    expect(telefonoValido('+51999876543')).toBe(true)
  })

  it('rechaza 8 dígitos (número truncado)', () => {
    expect(telefonoValido('97611824')).toBe(false)
    expect(telefonoValido('976 118 24')).toBe(false)
  })

  it('rechaza letras sin dígitos suficientes', () => {
    expect(telefonoValido('abc')).toBe(false)
    expect(telefonoValido('whatsapp')).toBe(false)
  })

  it('rechaza vacío y solo separadores', () => {
    expect(telefonoValido('')).toBe(false)
    expect(telefonoValido('   ')).toBe(false)
    expect(telefonoValido('--')).toBe(false)
  })

  it('rechaza prefijo 51 incompleto (10 dígitos totales)', () => {
    expect(telefonoValido('5197611824')).toBe(false)
  })

  it('rechaza longitud excesiva (más de 51 + 9 dígitos)', () => {
    expect(telefonoValido('519998765431')).toBe(false)
  })
})

describe('construirMensajeCobranza', () => {
  const mensaje = construirMensajeCobranza(paramsCobranza)

  it('incluye nombre, gym, plan, fecha y monto con formato soles', () => {
    expect(mensaje).toContain('Rosa Ñahui Quispe')
    expect(mensaje).toContain('Marsmode Fitness')
    expect(mensaje).toContain('Mensual')
    expect(mensaje).toContain('10/09/2026')
    expect(mensaje).toContain('S/ 80.00')
  })

  it('es la variante de vencido ("venció el")', () => {
    expect(mensaje).toContain('venció el 10/09/2026')
    expect(mensaje).not.toContain('vence el')
  })

  it('nunca contiene undefined ni NaN', () => {
    expect(mensaje).not.toContain('undefined')
    expect(mensaje).not.toContain('NaN')
  })
})

describe('esLinkPagoValido', () => {
  it('acepta URLs https válidas', () => {
    expect(esLinkPagoValido('https://express.culqi.com/U4DP1JGQQM')).toBe(true)
    expect(esLinkPagoValido('  https://express.culqi.com/DEMOMARS01  ')).toBe(true)
  })

  it('rechaza http sin cifrar, basura y vacío', () => {
    expect(esLinkPagoValido('http://express.culqi.com/U4DP1JGQQM')).toBe(false)
    expect(esLinkPagoValido('culqi')).toBe(false)
    expect(esLinkPagoValido('https://')).toBe(false)
    expect(esLinkPagoValido('')).toBe(false)
    expect(esLinkPagoValido('   ')).toBe(false)
  })
})

describe('construirMensajeCobranza — link de pago (CulqiLink)', () => {
  const LINK = 'https://express.culqi.com/DEMOMARS01'
  const mensajeSinLink = construirMensajeCobranza(paramsCobranza)

  it('sin link ni yape: mensaje sin la frase de yape (nada hardcodeado)', () => {
    expect(mensajeSinLink).toBe(
      'Hola Rosa Ñahui Quispe 👋 Te escribe Marsmode Fitness. Tu membresía Mensual venció el 10/09/2026 y quedan S/ 80.00 pendientes. ¿Renovamos? ¡Te esperamos!',
    )
    expect(mensajeSinLink).not.toContain('Renueva aquí')
    expect(mensajeSinLink).not.toContain('yapear')
  })

  it('con yapeNumero configurado: el mensaje lleva el número real del gym', () => {
    const mensaje = construirMensajeCobranza({
      ...paramsCobranza,
      yapeNumero: '999 999 999',
    })
    expect(mensaje).toContain('Puedes yapear al 999 999 999.')
    expect(mensaje).not.toContain('9XX')
  })

  it('con link https válido: añade el bloque "Renueva aquí" al final, sin alterar la base', () => {
    const mensaje = construirMensajeCobranza({ ...paramsCobranza, linkPago: LINK })
    expect(mensaje.startsWith(mensajeSinLink)).toBe(true)
    expect(mensaje).toContain(
      '\n\nRenueva aquí (Yape, Plin o tarjeta):\nhttps://express.culqi.com/DEMOMARS01',
    )
    expect(mensaje.endsWith(LINK)).toBe(true)
  })

  it('link http:// (no seguro) se omite: mensaje idéntico al sin link', () => {
    const mensaje = construirMensajeCobranza({
      ...paramsCobranza,
      linkPago: 'http://express.culqi.com/DEMOMARS01',
    })
    expect(mensaje).toBe(mensajeSinLink)
  })

  it('link basura, vacío o espacios se omite', () => {
    expect(
      construirMensajeCobranza({ ...paramsCobranza, linkPago: 'culqi' }),
    ).toBe(mensajeSinLink)
    expect(construirMensajeCobranza({ ...paramsCobranza, linkPago: '' })).toBe(
      mensajeSinLink,
    )
    expect(construirMensajeCobranza({ ...paramsCobranza, linkPago: '   ' })).toBe(
      mensajeSinLink,
    )
  })
})

describe('construirMensajeRecordatorio', () => {
  const mensaje = construirMensajeRecordatorio(paramsCobranza)

  it('es la variante pre-vencimiento ("vence el")', () => {
    expect(mensaje).toContain('vence el 10/09/2026')
    expect(mensaje).not.toContain('venció el')
  })

  it('incluye los mismos datos que la cobranza', () => {
    expect(mensaje).toContain('Rosa Ñahui Quispe')
    expect(mensaje).toContain('S/ 80.00')
    expect(mensaje).not.toContain('undefined')
    expect(mensaje).not.toContain('NaN')
  })
})

describe('enlaceWhatsApp', () => {
  it('usa dominio wa.me con teléfono normalizado con prefijo 51', () => {
    const enlace = enlaceWhatsApp('976 118 240', 'hola')
    expect(enlace.startsWith('https://wa.me/51999876543?text=')).toBe(true)
  })

  it('codifica el mensaje: sin espacios crudos ni saltos de línea', () => {
    const enlace = enlaceWhatsApp('999876543', 'Hola Rosa ¿renovamos?\nGracias')
    expect(enlace).not.toMatch(/ /)
    expect(enlace).not.toContain('\n')
    const texto = enlace.split('?text=')[1] ?? ''
    expect(decodeURIComponent(texto)).toBe('Hola Rosa ¿renovamos?\nGracias')
  })

  it('preserva emoji y acentos tras el roundtrip de encodeo', () => {
    const mensaje = construirMensajeCobranza(paramsCobranza)
    const enlace = enlaceWhatsApp('999876543', mensaje)
    const texto = enlace.split('?text=')[1] ?? ''
    expect(decodeURIComponent(texto)).toBe(mensaje)
    expect(decodeURIComponent(texto)).toContain('👋')
    expect(decodeURIComponent(texto)).toContain('Ñahui')
  })
})
