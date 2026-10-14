import { describe, expect, it } from 'vitest'
import {
  calcularEstado,
  diasParaVencer,
  formatoFecha,
  formatoSoles,
  membresiasMock,
  progresoPeriodo,
  sociosMock,
  sumarDiasIso,
} from '../data'
import {
  diasEntreIso,
  diasPausadosReales,
  reanudar,
} from '@/components/memberships/congelamiento'
import {
  diasParaVencer as diasParaVencerLib,
  formatoSoles as formatoSolesLib,
} from '@/lib/format'

function isoEn(diasDesdeHoy: number): string {
  const fecha = new Date()
  fecha.setHours(0, 0, 0, 0)
  fecha.setDate(fecha.getDate() + diasDesdeHoy)
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

describe('diasParaVencer (re-export de lib/format desde mocks/data)', () => {
  it('es literalmente la misma función de lib/format (unificación hecha)', () => {
    expect(diasParaVencer).toBe(diasParaVencerLib)
    expect(formatoSoles).toBe(formatoSolesLib)
  })

  it('hoy=0, mañana=1, ayer=-1', () => {
    expect(diasParaVencer(isoEn(0))).toBe(0)
    expect(diasParaVencer(isoEn(1))).toBe(1)
    expect(diasParaVencer(isoEn(-1))).toBe(-1)
  })
})

describe('calcularEstado', () => {
  it('vencida: 1 día en el pasado', () => {
    expect(calcularEstado(isoEn(-1))).toBe('vencida')
  })

  it('por-vencer: vence hoy (0) es el caso límite', () => {
    expect(calcularEstado(isoEn(0))).toBe('por-vencer')
  })

  it('por-vencer: 7 días exactos sigue entrando', () => {
    expect(calcularEstado(isoEn(7))).toBe('por-vencer')
  })

  it('vigente: 8 días ya no', () => {
    expect(calcularEstado(isoEn(8))).toBe('vigente')
  })
})

describe('sumarDiasIso', () => {
  it('renovación típica: +30 días', () => {
    expect(sumarDiasIso('2026-09-10', 30)).toBe('2026-10-10')
  })

  it('cruza fin de mes (31 ene + 1 = 1 feb)', () => {
    expect(sumarDiasIso('2026-01-31', 1)).toBe('2026-02-01')
  })

  it('cruza fin de año', () => {
    expect(sumarDiasIso('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('año bisiesto: 29 feb + 1 = 1 mar', () => {
    expect(sumarDiasIso('2028-02-29', 1)).toBe('2028-03-01')
  })

  it('resta días cruzando a febrero no bisiesto', () => {
    expect(sumarDiasIso('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('renovar una vencida hace 15 días con +30 deja +15 (recupera estado)', () => {
    expect(sumarDiasIso(isoEn(-15), 30)).toBe(isoEn(15))
    expect(calcularEstado(sumarDiasIso(isoEn(-15), 30))).toBe('vigente')
  })
})

describe('progresoPeriodo', () => {
  it('periodo degenerado (inicio = fin) devuelve 100, no NaN', () => {
    expect(progresoPeriodo('2026-09-10', '2026-09-10')).toBe(100)
  })

  it('periodo invertido (fin < inicio) devuelve 100', () => {
    expect(progresoPeriodo('2026-09-20', '2026-09-10')).toBe(100)
  })

  it('periodo totalmente futuro se clampa a 0', () => {
    expect(progresoPeriodo(isoEn(5), isoEn(35))).toBe(0)
  })

  it('membresía vencida sin renovar se clampa a 100', () => {
    expect(progresoPeriodo(isoEn(-40), isoEn(-10))).toBe(100)
  })

  it('punto medio del periodo ≈ 50 (tolera ±1 por DST)', () => {
    const p = progresoPeriodo(isoEn(-15), isoEn(15))
    expect(p).toBeGreaterThanOrEqual(49)
    expect(p).toBeLessThanOrEqual(51)
  })

  it('siempre cae en 0..100', () => {
    for (const [ini, fin] of [
      [isoEn(-100), isoEn(100)],
      [isoEn(-1), isoEn(1)],
      [isoEn(1), isoEn(-1)],
    ] as const) {
      const p = progresoPeriodo(ini, fin)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(100)
    }
  })
})

describe('formatoFecha (es-PE)', () => {
  it('formatea fecha fija con mes abreviado', () => {
    expect(formatoFecha('2026-09-10')).toBe('10 set. 2026')
  })

  it('parsea en zona local: hoy relativo coincide', () => {
    expect(formatoFecha(isoEn(0))).toBe(formatoFecha(isoEn(0)))
    expect(formatoFecha(isoEn(0))).toContain(String(new Date().getFullYear()))
  })

  it('DIVERGENCIA con lib: normaliza overflow de fecha en vez de lanzar RangeError', () => {
    expect(formatoFecha('2026-02-30')).toBe('2 mar. 2026')
  })
})

describe('integridad de los mocks', () => {
  it('sociosMock: 12 socios, ids únicos, códigos MS-### únicos, DNI de 8 dígitos', () => {
    expect(sociosMock).toHaveLength(12)
    expect(new Set(sociosMock.map((s) => s.id)).size).toBe(12)
    expect(new Set(sociosMock.map((s) => s.codigo)).size).toBe(12)
    for (const socio of sociosMock) {
      expect(socio.codigo).toMatch(/^MS-\d{3}$/)
      expect(socio.dni).toMatch(/^\d{8}$/)
      expect(['activo', 'moroso', 'congelado']).toContain(socio.estado)
    }
  })

  it('membresiasMock: cada estado coincide con calcularEstado(fechaFin)', () => {
    for (const membresia of membresiasMock) {
      expect(membresia.estado).toBe(calcularEstado(membresia.fechaFin))
    }
  })

  it('membresiasMock: reparto 6 vigentes / 3 por vencer / 3 vencidas', () => {
    const conteo = { vigente: 0, 'por-vencer': 0, vencida: 0 }
    for (const membresia of membresiasMock) conteo[membresia.estado] += 1
    expect(conteo).toEqual({ vigente: 6, 'por-vencer': 3, vencida: 3 })
  })

  it('membresiasMock: cada socio referenced existe y fechaInicio < fechaFin', () => {
    const idsSocios = new Set(sociosMock.map((s) => s.id))
    for (const membresia of membresiasMock) {
      expect(idsSocios.has(membresia.socioId)).toBe(true)
      expect(membresia.fechaInicio < membresia.fechaFin).toBe(true)
      expect(membresia.monto).toBeGreaterThan(0)
    }
  })

  it('membresiasMock: 2 congeladas demo (mem-07, mem-11), ventana de 15 días cubriendo hoy', () => {
    const congeladas = membresiasMock.filter((m) => m.congelada !== undefined)
    expect(congeladas.map((m) => m.id)).toEqual(['mem-07', 'mem-11'])
    const hoy = isoEn(0)
    for (const membresia of congeladas) {
      const congelada = membresia.congelada
      if (!congelada) throw new Error('congelada no definida')
      expect(diasEntreIso(congelada.desde, congelada.hasta)).toBe(15)
      expect(congelada.desde <= hoy).toBe(true)
      expect(congelada.hasta >= hoy).toBe(true)
      expect(congelada.desde >= membresia.fechaInicio).toBe(true)
      expect(congelada.hasta <= membresia.fechaFin).toBe(true)
    }
  })

  it('reanudar sobre una demo extiende fechaFin solo por los días ya pausados (mem-07)', () => {
    const mem07 = membresiasMock.find((m) => m.id === 'mem-07')
    expect(mem07?.congelada).toBeDefined()
    if (!mem07) return
    const congelada = mem07.congelada
    if (!congelada) throw new Error('congelada no definida')
    const reanudada = reanudar(mem07)
    const hoy = isoEn(0)
    expect(reanudada.fechaFin).toBe(
      sumarDiasIso(mem07.fechaFin, diasPausadosReales(congelada, hoy)),
    )
    expect(reanudada.congelada).toBeUndefined()
  })
})
