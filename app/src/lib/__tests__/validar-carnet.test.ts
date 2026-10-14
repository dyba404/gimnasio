import { describe, expect, it } from 'vitest'
import { PERIODO_TOTP, generarToken } from '../totp'
import {
  decidirIngreso,
  parsearPayload,
  type MapasCarnet,
  type PayloadCarnet,
} from '../validar-carnet'
import type { Membresia, Socio } from '@/mocks/types'

const EPOCH_BASE = 1_770_000_000
const EPOCH_DENTRO_VENTANA = EPOCH_BASE + 10

function isoEn(diasDesdeHoy: number): string {
  const fecha = new Date()
  fecha.setHours(0, 0, 0, 0)
  fecha.setDate(fecha.getDate() + diasDesdeHoy)
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function socioCon(codigo: string): Socio {
  return {
    id: `socio-${codigo}`,
    codigo,
    nombre: 'Rosa Ñahui Quispe',
    dni: '45782136',
    telefono: '987 214 503',
    planId: 'plan-mensual',
    estado: 'activo',
    fechaRegistro: '2026-01-01',
  }
}

function membresiaPara(socioId: string, fechaFin: string): Membresia {
  return {
    id: `mem-${socioId}`,
    socioId,
    planId: 'plan-mensual',
    fechaInicio: isoEn(-10),
    fechaFin,
    monto: 80,
    estado: 'vigente',
  }
}

describe('parsearPayload', () => {
  it('acepta un JSON válido completo (con token y exp)', () => {
    const texto = JSON.stringify({
      codigo: 'MS-001',
      dni: '45782136',
      vence: '2026-09-30',
      token: '123456',
      exp: 1_770_000_030,
    })
    expect(parsearPayload(texto)).toEqual({
      codigo: 'MS-001',
      dni: '45782136',
      vence: '2026-09-30',
      token: '123456',
      exp: 1_770_000_030,
    })
  })

  it('acepta el payload legado del carné antiguo (sin token/exp)', () => {
    const texto = JSON.stringify({
      codigo: 'MS-002',
      dni: '40112958',
      vence: '2026-08-01',
      extra: 'cualquier-cosa',
    })
    expect(parsearPayload(texto)).toEqual({
      codigo: 'MS-002',
      dni: '40112958',
      vence: '2026-08-01',
    })
  })

  it('descarta un QR de otra app (JSON ajeno)', () => {
    expect(parsearPayload('{"hola":"mundo"}')).toBeNull()
  })

  it('descarta un JSON incompleto (falta dni y vence)', () => {
    expect(parsearPayload('{"codigo":"MS-001"}')).toBeNull()
  })

  it('descarta texto que no es JSON', () => {
    expect(parsearPayload('hola mundo')).toBeNull()
    expect(parsearPayload('')).toBeNull()
  })

  it('descarta JSON que no es un objeto (array, número, null)', () => {
    expect(parsearPayload('["MS-001"]')).toBeNull()
    expect(parsearPayload('42')).toBeNull()
    expect(parsearPayload('null')).toBeNull()
  })

  it('token sin exp (o exp no finita) se trata como legado, no como QR fresco', () => {
    const soloToken = JSON.stringify({
      codigo: 'MS-001',
      dni: '45782136',
      vence: '2026-09-30',
      token: '123456',
    })
    expect(parsearPayload(soloToken)).not.toHaveProperty('exp')
    const expRara = JSON.stringify({
      codigo: 'MS-001',
      dni: '45782136',
      vence: '2026-09-30',
      token: '123456',
      exp: 'mañana',
    })
    expect(parsearPayload(expRara)).not.toHaveProperty('token')
  })
})

describe('decidirIngreso', () => {
  const socio = socioCon('MS-001')
  const tokenValido = generarToken(socio, EPOCH_BASE)
  const expVentana = EPOCH_BASE + PERIODO_TOTP

  function payloadFresco(token: string = tokenValido): PayloadCarnet {
    return { codigo: 'MS-001', dni: '45782136', vence: isoEn(12), token, exp: expVentana }
  }

  function mapas(membresia: Membresia | undefined, socios: readonly Socio[] = [socio]): MapasCarnet {
    return {
      socios: new Map(socios.map((s) => [s.codigo, s])),
      membresias: membresia ? new Map([[membresia.socioId, membresia]]) : new Map(),
    }
  }

  it('aceptado: QR fresco y válido con membresía vigente', () => {
    const resultado = decidirIngreso(
      payloadFresco(),
      mapas(membresiaPara(socio.id, isoEn(12))),
      { qrPermitirLegado: false },
      EPOCH_DENTRO_VENTANA,
    )
    expect(resultado.tipo).toBe('aceptado')
    expect(resultado.socio?.codigo).toBe('MS-001')
    expect(resultado.viaLegado).toBeUndefined()
    expect(resultado.codigoLeido).toBe('MS-001')
  })

  it('desconocido: el código del QR no existe en el gimnasio', () => {
    const resultado = decidirIngreso(
      { ...payloadFresco(), codigo: 'MS-999' },
      mapas(membresiaPara(socio.id, isoEn(12))),
      {},
      EPOCH_DENTRO_VENTANA,
    )
    expect(resultado.tipo).toBe('desconocido')
    expect(resultado.socio).toBeUndefined()
    expect(resultado.codigoLeido).toBe('MS-999')
  })

  it('legado: payload sin token/exp con flag apagada se deniega pidiendo búsqueda manual', () => {
    const legado: PayloadCarnet = { codigo: 'MS-001', dni: '45782136', vence: '2026-01-01' }
    const resultado = decidirIngreso(legado, mapas(membresiaPara(socio.id, isoEn(12))), { qrPermitirLegado: false }, EPOCH_DENTRO_VENTANA)
    expect(resultado.tipo).toBe('legado')
    expect(resultado.motivo).toBe('Carné desactualizado — búscalo por nombre o DNI')
  })

  it('legado con flag indefinida también se deniega', () => {
    const legado: PayloadCarnet = { codigo: 'MS-001', dni: '45782136', vence: '2026-01-01' }
    expect(decidirIngreso(legado, mapas(membresiaPara(socio.id, isoEn(12))), {}, EPOCH_DENTRO_VENTANA).tipo).toBe('legado')
  })

  it('aceptado con badge ámbar: legado con qrPermitirLegado activa', () => {
    const legado: PayloadCarnet = { codigo: 'MS-001', dni: '45782136', vence: '2026-01-01' }
    const resultado = decidirIngreso(legado, mapas(membresiaPara(socio.id, isoEn(12))), { qrPermitirLegado: true }, EPOCH_DENTRO_VENTANA)
    expect(resultado.tipo).toBe('aceptado')
    expect(resultado.viaLegado).toBe(true)
    expect(resultado.motivo).toBe('QR legado — reemitir carné')
  })

  it('expirado: exp ya pasó aunque el token siga en tolerancia', () => {
    const expirado: PayloadCarnet = {
      codigo: 'MS-001',
      dni: '45782136',
      vence: isoEn(12),
      token: tokenValido,
      exp: EPOCH_DENTRO_VENTANA,
    }
    const resultado = decidirIngreso(expirado, mapas(membresiaPara(socio.id, isoEn(12))), {}, EPOCH_DENTRO_VENTANA)
    expect(resultado.tipo).toBe('expirado')
    expect(resultado.motivo).toBe('QR vencido — el socio debe regenerarlo')
  })

  it('el chequeo exp va ANTES que verificarToken (tolerancia TOTP no rescata QRs viejos)', () => {
    const capturaVieja: PayloadCarnet = {
      codigo: 'MS-001',
      dni: '45782136',
      vence: isoEn(12),
      token: '000000',
      exp: EPOCH_BASE - 5 * PERIODO_TOTP,
    }
    expect(
      decidirIngreso(capturaVieja, mapas(membresiaPara(socio.id, isoEn(12))), {}, EPOCH_DENTRO_VENTANA).tipo,
    ).toBe('expirado')
  })

  it('token-invalido: exp vigente pero token que no corresponde', () => {
    const incorrecto = tokenValido === '000000' ? '999999' : '000000'
    const resultado = decidirIngreso(payloadFresco(incorrecto), mapas(membresiaPara(socio.id, isoEn(12))), {}, EPOCH_DENTRO_VENTANA)
    expect(resultado.tipo).toBe('token-invalido')
    expect(resultado.motivo).toBe('Código no válido — captura de pantalla o QR viejo')
  })

  it('token de otro socio no pasa la verificación', () => {
    const otro = socioCon('MS-002')
    const tokenAjeno = generarToken(otro, EPOCH_BASE)
    expect(
      decidirIngreso(payloadFresco(tokenAjeno), mapas(membresiaPara(socio.id, isoEn(12))), {}, EPOCH_DENTRO_VENTANA).tipo,
    ).toBe('token-invalido')
  })

  it('moroso: QR válido pero membresía vencida', () => {
    const resultado = decidirIngreso(
      payloadFresco(),
      mapas(membresiaPara(socio.id, isoEn(-3))),
      {},
      EPOCH_DENTRO_VENTANA,
    )
    expect(resultado.tipo).toBe('moroso')
    expect(resultado.socio?.codigo).toBe('MS-001')
    expect(resultado.motivo).toContain('Membresía vencida')
  })

  it('moroso: socio sin membresía registrada se trata como moroso', () => {
    const resultado = decidirIngreso(payloadFresco(), mapas(undefined), {}, EPOCH_DENTRO_VENTANA)
    expect(resultado.tipo).toBe('moroso')
  })

  it('aceptado en el borde: token de la ventana anterior aún dentro de la ventana declarada', () => {
    const tokenPrevio = generarToken(socio, EPOCH_BASE - PERIODO_TOTP)
    const expPrevio = EPOCH_BASE
    const resultado = decidirIngreso(
      { codigo: 'MS-001', dni: '45782136', vence: isoEn(12), token: tokenPrevio, exp: expPrevio },
      mapas(membresiaPara(socio.id, isoEn(12))),
      {},
      EPOCH_BASE - 10,
    )
    expect(resultado.tipo).toBe('aceptado')
  })
})
