import { generateSync, verifySync } from 'otplib'
import type { Socio } from '@/mocks/types'

export const PERIODO_TOTP = 30

const SAL_SEMILLA = 'marsmode'
const ALFABETO_BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function fnv1a32(texto: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < texto.length; i += 1) {
    hash ^= texto.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function aBase32(bytes: Uint8Array): string {
  let acumulado = 0
  let bits = 0
  let salida = ''
  for (const byte of bytes) {
    acumulado = (acumulado << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      salida += ALFABETO_BASE32[(acumulado >>> bits) & 31]
    }
  }
  if (bits > 0) {
    salida += ALFABETO_BASE32[(acumulado << (5 - bits)) & 31]
  }
  return salida
}

export function derivarSecret(codigo: string): string {
  const bytes = new Uint8Array(20)
  for (let bloque = 0; bloque < 5; bloque += 1) {
    const hash = fnv1a32(`${codigo}:${SAL_SEMILLA}:${bloque}`)
    bytes[bloque * 4] = (hash >>> 24) & 0xff
    bytes[bloque * 4 + 1] = (hash >>> 16) & 0xff
    bytes[bloque * 4 + 2] = (hash >>> 8) & 0xff
    bytes[bloque * 4 + 3] = hash & 0xff
  }
  return aBase32(bytes)
}

export function epochActual(): number {
  return Math.floor(Date.now() / 1000)
}

export function segundosRestantes(): number {
  return PERIODO_TOTP - (epochActual() % PERIODO_TOTP)
}

export function generarToken(socio: Socio, epoch: number = epochActual()): string {
  return generateSync({
    secret: derivarSecret(socio.codigo),
    epoch,
    period: PERIODO_TOTP,
    digits: 6,
  })
}

export function verificarToken(
  socio: Socio,
  token: string,
  epoch: number = epochActual(),
): boolean {
  return verifySync({
    secret: derivarSecret(socio.codigo),
    token,
    epoch,
    period: PERIODO_TOTP,
    epochTolerance: PERIODO_TOTP,
  }).valid
}
