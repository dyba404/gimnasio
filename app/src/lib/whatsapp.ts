import { formatoSoles } from '@/lib/format'

export const GYM_NOMBRE = 'Marsmode Fitness'

const PATRON_FECHA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/

const TELEFONO_LARGO_NACIONAL = 9

export function formatoFecha(fecha: string): string {
  const partes = PATRON_FECHA_ISO.exec(fecha)
  if (!partes) {
    throw new RangeError(`fecha inválida: ${fecha}`)
  }
  return `${partes[3]}/${partes[2]}/${partes[1]}`
}

export function normalizarTelefono(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '')
  if (digitos.length === TELEFONO_LARGO_NACIONAL) {
    return `51${digitos}`
  }
  return digitos
}

const LARGO_PERUANO = 11

export function telefonoValido(telefono: string): boolean {
  const normalizado = normalizarTelefono(telefono)
  return normalizado.length === LARGO_PERUANO && normalizado.startsWith('51')
}

type ParamsMensaje = {
  nombre: string
  gym: string
  plan: string
  monto: number
  fechaVence: string
  linkPago?: string
  yapeNumero?: string
}

export function esLinkPagoValido(link: string): boolean {
  const limpio = link.trim()
  if (limpio === '') {
    return false
  }
  try {
    return new URL(limpio).protocol === 'https:'
  } catch {
    return false
  }
}

function fraseYape(yapeNumero?: string): string {
  const limpio = yapeNumero?.trim() ?? ''
  return limpio === '' ? '' : ` Puedes yapear al ${limpio}.`
}

export function construirMensajeCobranza({
  nombre,
  gym,
  plan,
  monto,
  fechaVence,
  linkPago,
  yapeNumero,
}: ParamsMensaje): string {
  const base = `Hola ${nombre} 👋 Te escribe ${gym}. Tu membresía ${plan} venció el ${formatoFecha(fechaVence)} y quedan ${formatoSoles(monto)} pendientes. ¿Renovamos?${fraseYape(yapeNumero)} ¡Te esperamos!`
  if (linkPago !== undefined && esLinkPagoValido(linkPago)) {
    return `${base}\n\nRenueva aquí (Yape, Plin o tarjeta):\n${linkPago.trim()}`
  }
  return base
}

export function construirMensajeRecordatorio({
  nombre,
  gym,
  plan,
  monto,
  fechaVence,
  yapeNumero,
}: ParamsMensaje): string {
  return `Hola ${nombre} 👋 Te escribe ${gym}. Tu membresía ${plan} vence el ${formatoFecha(fechaVence)} (monto: ${formatoSoles(monto)}). ¿Renovamos?${fraseYape(yapeNumero)} ¡Te esperamos!`
}

export function enlaceWhatsApp(telefono: string, mensaje: string): string {
  return `https://wa.me/${normalizarTelefono(telefono)}?text=${encodeURIComponent(mensaje)}`
}
