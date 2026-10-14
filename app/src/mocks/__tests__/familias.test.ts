import { describe, expect, it } from 'vitest'
import type { FacturaGrupo } from '../familias'
import {
  cuentaDe,
  etiquetaParentesco,
  familiaVencida,
  familiasMock,
  facturasMock,
  membresiasDeCuenta,
  totalFactura,
} from '../familias'
import { membresiasMock, sociosMock, sumarDiasIso } from '../data'
import type { CuentaFamiliar, FacturaGrupo as FacturaGrupoTipo } from '../familias'
import type { Membresia } from '../types'

const HOY = '2026-09-11'

function venceEn(dias: number): string {
  return sumarDiasIso(HOY, dias)
}

function membresiaPrueba(socioId: string, fechaFin: string): Membresia {
  return {
    id: `mem-test-${socioId}`,
    socioId,
    planId: 'plan-mensual',
    fechaInicio: venceEn(-30),
    fechaFin,
    monto: 80,
    estado: 'vigente',
  }
}

describe('cuentaDe — localiza la cuenta de un socio (head o miembro)', () => {
  it('encuentra la cuenta del head', () => {
    expect(cuentaDe(familiasMock, 'soc-02')?.id).toBe('fam-gomez')
  })

  it('encuentra la cuenta de un miembro', () => {
    expect(cuentaDe(familiasMock, 'soc-01')?.id).toBe('fam-gomez')
    expect(cuentaDe(familiasMock, 'soc-04')?.id).toBe('fam-rojas')
  })

  it('socio sin familia → undefined', () => {
    expect(cuentaDe(familiasMock, 'soc-07')).toBeUndefined()
  })

  it('los socios de las cuentas mock existen en sociosMock', () => {
    const ids = new Set(sociosMock.map((socio) => socio.id))
    for (const familia of familiasMock) {
      expect(ids.has(familia.headSocioId)).toBe(true)
      for (const miembro of familia.miembros) {
        expect(ids.has(miembro.socioId)).toBe(true)
      }
    }
  })

  it('los heads no aparecen en la lista de miembros', () => {
    for (const familia of familiasMock) {
      expect(
        familia.miembros.some((m) => m.socioId === familia.headSocioId),
      ).toBe(false)
    }
  })
})

describe('membresiasDeCuenta — head + miembros', () => {
  it('incluye la membresía del head y de cada miembro', () => {
    const cuenta = cuentaDe(familiasMock, 'soc-02')
    if (!cuenta) throw new Error('cuenta fam-gomez no encontrada')
    const ids = membresiasDeCuenta(cuenta, membresiasMock).map((m) => m.socioId)
    expect(ids).toContain('soc-02')
    expect(ids).toContain('soc-01')
    expect(ids).toContain('soc-10')
    expect(ids).toContain('soc-06')
    expect(ids).toHaveLength(4)
  })

  it('una familia de 2 socios tiene exactamente las membresías del grupo', () => {
    const cuenta = cuentaDe(familiasMock, 'soc-05')
    if (!cuenta) throw new Error('cuenta fam-rojas no encontrada')
    const ids = membresiasDeCuenta(cuenta, membresiasMock).map((m) => m.socioId).sort()
    expect(ids).toEqual(['soc-04', 'soc-05'])
  })

  it('miembro sin membresía no produce resultados falsos', () => {
    const cuenta: CuentaFamiliar = {
      id: 'fam-test',
      headSocioId: 'soc-01',
      miembros: [{ socioId: 'sin-membresia', parentesco: 'otro' }],
    }
    const resultado = membresiasDeCuenta(cuenta, membresiasMock)
    expect(resultado.map((m) => m.socioId)).toEqual(['soc-01'])
  })
})

describe('totalFactura — suma de items', () => {
  it('multi-item: suma todos los montos', () => {
    const factura: FacturaGrupoTipo = {
      id: 'fac-t',
      cuentaId: 'c1',
      fecha: HOY,
      items: [
        { socioId: 'soc-01', concepto: 'membresia', monto: 80 },
        { socioId: 'soc-02', concepto: 'membresia', monto: 210 },
        { socioId: 'soc-02', concepto: 'producto', monto: 12.5 },
      ],
      estado: 'abierta',
    }
    expect(totalFactura(factura)).toBe(302.5)
  })

  it('sin items → 0', () => {
    const factura: FacturaGrupo = {
      id: 'fac-t',
      cuentaId: 'c1',
      fecha: HOY,
      items: [],
      estado: 'abierta',
    }
    expect(totalFactura(factura)).toBe(0)
  })

  it('los mocks son coherentes: abierta con deuda, cobrada saldada', () => {
    const abierta = facturasMock.find((f) => f.estado === 'abierta')
    const cobrada = facturasMock.find((f) => f.estado === 'cobrada')
    if (!abierta || !cobrada) throw new Error('facturas mock incompletas')
    expect(totalFactura(abierta)).toBe(135)
    expect(totalFactura(cobrada)).toBe(1320)
  })
})

describe('familiaVencida — morosidad del grupo', () => {
  it('todas las membresías vigentes → false', () => {
    const cuenta: CuentaFamiliar = {
      id: 'fam-t',
      headSocioId: 'soc-01',
      miembros: [{ socioId: 'soc-02', parentesco: 'conyuge' }],
    }
    const membresias = [
      membresiaPrueba('soc-01', venceEn(10)),
      membresiaPrueba('soc-02', venceEn(45)),
    ]
    expect(familiaVencida(cuenta, membresias, HOY)).toBe(false)
  })

  it('una sola membresía vencida → true (responsabilidad solidaria)', () => {
    const cuenta: CuentaFamiliar = {
      id: 'fam-t',
      headSocioId: 'soc-01',
      miembros: [{ socioId: 'soc-02', parentesco: 'conyuge' }],
    }
    const membresias = [
      membresiaPrueba('soc-01', venceEn(10)),
      membresiaPrueba('soc-02', venceEn(-6)),
    ]
    expect(familiaVencida(cuenta, membresias, HOY)).toBe(true)
  })

  it('vence hoy no cuenta como vencida', () => {
    const cuenta: CuentaFamiliar = {
      id: 'fam-t',
      headSocioId: 'soc-01',
      miembros: [],
    }
    const membresias = [membresiaPrueba('soc-01', venceEn(0))]
    expect(familiaVencida(cuenta, membresias, HOY)).toBe(false)
  })

  it('familia sin membresías → false', () => {
    const cuenta: CuentaFamiliar = {
      id: 'fam-t',
      headSocioId: 'soc-01',
      miembros: [],
    }
    expect(familiaVencida(cuenta, [], HOY)).toBe(false)
  })

  it('familia Gómez (mock) está vigente hoy', () => {
    const cuenta = cuentaDe(familiasMock, 'soc-02')
    if (!cuenta) throw new Error('cuenta fam-gomez no encontrada')
    expect(familiaVencida(cuenta, membresiasMock, HOY)).toBe(false)
  })

  it('familia Rojas (mock) está vencida hoy', () => {
    const cuenta = cuentaDe(familiasMock, 'soc-05')
    if (!cuenta) throw new Error('cuenta fam-rojas no encontrada')
    expect(familiaVencida(cuenta, membresiasMock, HOY)).toBe(true)
  })
})

describe('etiquetaParentesco', () => {
  it('mapea cada parentesco a su etiqueta en español', () => {
    expect(etiquetaParentesco.conyuge).toBe('Cónyuge')
    expect(etiquetaParentesco.hijo).toBe('Hijo(a)')
    expect(etiquetaParentesco.otro).toBe('Otro')
  })
})
