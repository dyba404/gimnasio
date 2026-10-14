import { describe, expect, it } from 'vitest'
import {
  DIAS_CONGELAMIENTO_MAX,
  congelar,
  diasEntreIso,
  esCongelada,
  fechaFinExtendida,
  hoyIso,
  limitarDiasCongelamiento,
  reanudar,
  renovarMembresia,
  sinCongelar,
} from '../congelamiento'
import { sumarDiasIso } from '@/mocks/data'
import type { Membresia } from '@/mocks/types'

function isoEn(diasDesdeHoy: number): string {
  const fecha = new Date()
  fecha.setHours(0, 0, 0, 0)
  fecha.setDate(fecha.getDate() + diasDesdeHoy)
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

const HOY = isoEn(0)

function membresiaBase(sobrescribir: Partial<Membresia> = {}): Membresia {
  return {
    id: 'mem-test',
    socioId: 'soc-01',
    planId: 'plan-mensual',
    fechaInicio: isoEn(-15),
    fechaFin: isoEn(15),
    monto: 80,
    estado: 'vigente',
    ...sobrescribir,
  }
}

describe('limitarDiasCongelamiento', () => {
  it('valor por defecto razonable: 30 días', () => {
    expect(limitarDiasCongelamiento(30)).toBe(30)
  })

  it('NaN o infinito caen al default (30), no rompen', () => {
    expect(limitarDiasCongelamiento(Number.NaN)).toBe(30)
    expect(limitarDiasCongelamiento(Number.POSITIVE_INFINITY)).toBe(30)
  })

  it('0 y negativos se elevan al mínimo de 1 día', () => {
    expect(limitarDiasCongelamiento(0)).toBe(1)
    expect(limitarDiasCongelamiento(-5)).toBe(1)
  })

  it('máximo 90 días (tope del negocio)', () => {
    expect(DIAS_CONGELAMIENTO_MAX).toBe(90)
    expect(limitarDiasCongelamiento(95)).toBe(90)
    expect(limitarDiasCongelamiento(1000)).toBe(90)
  })

  it('redondea decimales: 15.4 → 15, 15.6 → 16', () => {
    expect(limitarDiasCongelamiento(15.4)).toBe(15)
    expect(limitarDiasCongelamiento(15.6)).toBe(16)
  })
})

describe('diasEntreIso', () => {
  it('mismo día → 0', () => {
    expect(diasEntreIso('2026-09-10', '2026-09-10')).toBe(0)
  })

  it('15 días exactos', () => {
    expect(diasEntreIso('2026-09-01', '2026-09-16')).toBe(15)
  })

  it('cruza fin de mes', () => {
    expect(diasEntreIso('2026-01-20', '2026-02-04')).toBe(15)
  })

  it('cruza fin de año', () => {
    expect(diasEntreIso('2026-12-28', '2027-01-12')).toBe(15)
  })

  it('cruza febrero bisiesto', () => {
    expect(diasEntreIso('2028-02-20', '2028-03-06')).toBe(15)
  })

  it('rango invertido devuelve negativo (no lanza)', () => {
    expect(diasEntreIso('2026-09-16', '2026-09-01')).toBe(-15)
  })
})

describe('hoyIso', () => {
  it('devuelve ISO de hoy en zona local', () => {
    expect(hoyIso()).toBe(isoEn(0))
  })
})

describe('esCongelada', () => {
  it('true con congelada presente, false sin el campo', () => {
    expect(esCongelada(congelar(membresiaBase(), 15, HOY))).toBe(true)
    expect(esCongelada(membresiaBase())).toBe(false)
  })
})

describe('congelar', () => {
  it('setea congelada {desde: hoy, hasta: hoy + días}', () => {
    const resultado = congelar(membresiaBase(), 15, HOY)
    expect(resultado.congelada).toEqual({ desde: HOY, hasta: isoEn(15) })
  })

  it('aplica el tope de 90 días', () => {
    const resultado = congelar(membresiaBase(), 200, HOY)
    expect(resultado.congelada).toEqual({ desde: HOY, hasta: isoEn(90) })
  })

  it('NO cambia fechaFin ni estado (solo marca el congelamiento)', () => {
    const base = membresiaBase({ estado: 'por-vencer' })
    const resultado = congelar(base, 15, HOY)
    expect(resultado.fechaFin).toBe(base.fechaFin)
    expect(resultado.estado).toBe('por-vencer')
  })

  it('conserva el resto de campos (id, socioId, monto)', () => {
    const resultado = congelar(membresiaBase(), 15, HOY)
    expect(resultado.id).toBe('mem-test')
    expect(resultado.socioId).toBe('soc-01')
    expect(resultado.monto).toBe(80)
    expect(resultado.fechaInicio).toBe(isoEn(-15))
  })
})

describe('reanudar (extensión de fechaFin por días REALMENTE pausados)', () => {
  it('reanudar ANTES de hasta extiende solo los días transcurridos (+5, no +30)', () => {
    const congelada = congelar(membresiaBase({ fechaFin: '2026-10-01' }), 30, '2026-09-01')
    const reanudada = reanudar(congelada, '2026-09-06')
    expect(reanudada.fechaFin).toBe('2026-10-06')
  })

  it('reanudar DESPUÉS de hasta extiende el rango pactado completo (+30)', () => {
    const congelada = congelar(membresiaBase({ fechaFin: '2026-10-01' }), 30, '2026-09-01')
    const reanudada = reanudar(congelada, '2026-10-10')
    expect(reanudada.fechaFin).toBe('2026-10-31')
  })

  it('reanudar el día exacto de hasta extiende el rango pactado completo', () => {
    const congelada = congelar(membresiaBase({ fechaFin: '2026-10-01' }), 30, '2026-09-01')
    expect(reanudar(congelada, '2026-10-01').fechaFin).toBe('2026-10-31')
  })

  it('reanudar el mismo día del congelamiento extiende el mínimo de 1 día (clamp)', () => {
    const congelada = congelar(membresiaBase({ fechaFin: '2026-10-01' }), 30, '2026-09-01')
    expect(reanudar(congelada, '2026-09-01').fechaFin).toBe('2026-10-02')
  })

  it('15 días congelados y reanudado el día de hasta → +15 exactos', () => {
    const congelada = congelar(membresiaBase({ fechaFin: '2026-10-01' }), 15, '2026-09-01')
    const reanudada = reanudar(congelada, '2026-09-16')
    expect(reanudada.fechaFin).toBe('2026-10-16')
  })

  it('la extensión usa sumarDiasIso: fechaFin + días transcurridos (tope pactado)', () => {
    const congelada = congelar(membresiaBase(), 30, HOY)
    const reanudada = reanudar(congelada, isoEn(12))
    expect(reanudada.fechaFin).toBe(sumarDiasIso(congelada.fechaFin, 12))
  })

  it('limpia congelada tras reanudar', () => {
    const reanudada = reanudar(congelar(membresiaBase(), 15, HOY), isoEn(3))
    expect(reanudada.congelada).toBeUndefined()
    expect('congelada' in reanudada).toBe(false)
  })

  it('membresía sin congelar: devuelve la misma instancia intacta', () => {
    const base = membresiaBase()
    expect(reanudar(base)).toBe(base)
  })

  it('conserva id, socioId, planId, fechaInicio, monto y estado', () => {
    const base = membresiaBase({ estado: 'por-vencer', monto: 55, planId: 'plan-student' })
    const reanudada = reanudar(congelar(base, 10, HOY), isoEn(4))
    expect(reanudada.id).toBe(base.id)
    expect(reanudada.socioId).toBe(base.socioId)
    expect(reanudada.planId).toBe(base.planId)
    expect(reanudada.fechaInicio).toBe(base.fechaInicio)
    expect(reanudada.monto).toBe(55)
    expect(reanudada.estado).toBe('por-vencer')
  })

  it('congelamiento cruzando año: 25 dic, reanuda 4 ene → +10 sobre fechaFin', () => {
    const congelada = congelar(membresiaBase({ fechaFin: '2027-01-05' }), 10, '2026-12-25')
    expect(reanudar(congelada, '2027-01-04').fechaFin).toBe('2027-01-15')
  })
})

describe('fechaFinExtendida (proyección visible mientras está congelada)', () => {
  it('proyecta la extensión con los días transcurridos hasta hoy, sin mutar la membresía', () => {
    const congelada = congelar(membresiaBase({ fechaFin: '2026-10-01' }), 15, '2026-09-01')
    expect(fechaFinExtendida(congelada, '2026-09-06')).toBe('2026-10-06')
    expect(congelada.fechaFin).toBe('2026-10-01')
    expect(congelada.congelada).toEqual({ desde: '2026-09-01', hasta: '2026-09-16' })
  })

  it('una vez pasado hasta, proyecta el rango pactado completo', () => {
    const congelada = congelar(membresiaBase({ fechaFin: '2026-10-01' }), 15, '2026-09-01')
    expect(fechaFinExtendida(congelada, '2026-09-20')).toBe('2026-10-16')
  })

  it('coincide exactamente con lo que aplicará reanudar', () => {
    const congelada = congelar(membresiaBase({ fechaFin: '2026-10-01' }), 30, '2026-09-01')
    const hoy = '2026-09-09'
    expect(fechaFinExtendida(congelada, hoy)).toBe(reanudar(congelada, hoy).fechaFin)
  })

  it('sin congelar devuelve la fechaFin original', () => {
    const base = membresiaBase()
    expect(fechaFinExtendida(base)).toBe(base.fechaFin)
  })
})

describe('sinCongelar (exclusión del widget VencimientosProximos)', () => {
  it('filtra las congeladas y conserva el orden de las demás', () => {
    const congelada = congelar(membresiaBase({ id: 'mem-a' }), 15, HOY)
    const lista = [
      membresiaBase({ id: 'mem-1' }),
      congelada,
      membresiaBase({ id: 'mem-2' }),
    ]
    expect(sinCongelar(lista).map((m) => m.id)).toEqual(['mem-1', 'mem-2'])
  })

  it('lista vacía o sin congeladas: pasa todo', () => {
    const lista = [membresiaBase({ id: 'mem-1' })]
    expect(sinCongelar(lista)).toHaveLength(1)
    expect(sinCongelar([])).toHaveLength(0)
  })
})

describe('renovarMembresia (extiende por duracionDias del plan, no 30 fijos)', () => {
  it('membresía VIGENTE con plan trimestral: fechaFin + 90 días', () => {
    const vigente = membresiaBase({
      planId: 'plan-trimestral',
      fechaFin: isoEn(40),
      estado: 'vigente',
    })
    const renovada = renovarMembresia(vigente, 90, HOY)
    expect(renovada.fechaFin).toBe(sumarDiasIso(vigente.fechaFin, 90))
    expect(renovada.estado).toBe('vigente')
  })

  it('membresía VENCIDA con plan trimestral: nueva fechaFin = HOY + 90 (no desde la fecha vencida)', () => {
    const vencida = membresiaBase({
      planId: 'plan-trimestral',
      fechaFin: isoEn(-20),
      estado: 'vencida',
    })
    const renovada = renovarMembresia(vencida, 90, HOY)
    expect(renovada.fechaFin).toBe(sumarDiasIso(HOY, 90))
    expect(renovada.estado).toBe('vigente')
  })

  it('membresía VIGENTE con plan anual: fechaFin + 365 días', () => {
    const vigente = membresiaBase({
      planId: 'plan-anual',
      fechaFin: isoEn(90),
      estado: 'vigente',
    })
    const renovada = renovarMembresia(vigente, 365, HOY)
    expect(renovada.fechaFin).toBe(sumarDiasIso(vigente.fechaFin, 365))
  })

  it('membresía VENCIDA con plan anual: nueva fechaFin = HOY + 365', () => {
    const vencida = membresiaBase({
      planId: 'plan-anual',
      fechaFin: isoEn(-400),
      estado: 'vencida',
    })
    const renovada = renovarMembresia(vencida, 365, HOY)
    expect(renovada.fechaFin).toBe(sumarDiasIso(HOY, 365))
  })

  it('recalcula el estado tras renovar (vencida → vigente)', () => {
    const vencida = membresiaBase({ fechaFin: isoEn(-2), estado: 'vencida' })
    const renovada = renovarMembresia(vencida, 30, HOY)
    expect(renovada.fechaFin).toBe(sumarDiasIso(HOY, 30))
    expect(renovada.estado).toBe('vigente')
  })

  it('conserva id, socioId, planId, fechaInicio y monto', () => {
    const base = membresiaBase({ fechaFin: isoEn(-5), estado: 'vencida', monto: 210 })
    const renovada = renovarMembresia(base, 90, HOY)
    expect(renovada.id).toBe(base.id)
    expect(renovada.socioId).toBe(base.socioId)
    expect(renovada.planId).toBe(base.planId)
    expect(renovada.fechaInicio).toBe(base.fechaInicio)
    expect(renovada.monto).toBe(210)
  })
})
