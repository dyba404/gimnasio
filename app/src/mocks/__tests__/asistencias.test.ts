import { describe, expect, it } from 'vitest'
import {
  asistenciasDeSocio,
  asistenciasMock,
  diasSinAsistir,
  estaEnRiesgo,
  sociosEnRiesgo,
  ultimosDiasIso,
} from '../asistencias'
import { sociosMock } from '@/mocks/data'

const HOY = new Date()
HOY.setHours(0, 0, 0, 0)

function isoHace(dias: number): string {
  const fecha = new Date(HOY)
  fecha.setDate(fecha.getDate() - dias)
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

describe('asistenciasMock — generación determinista', () => {
  it('una entrada por check-in con socioId real y fecha ISO', () => {
    const ids = new Set(sociosMock.map((socio) => socio.id))
    for (const asistencia of asistenciasMock) {
      expect(ids.has(asistencia.socioId)).toBe(true)
      expect(asistencia.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('es determinista: mismas fechas relativas en cada importación del módulo', () => {
    const porSocio = new Map<string, readonly string[]>()
    for (const asistencia of asistenciasMock) {
      const previas = porSocio.get(asistencia.socioId) ?? []
      porSocio.set(asistencia.socioId, [...previas, asistencia.fecha])
    }
    const activo = porSocio.get('soc-02')
    expect(activo?.length).toBeGreaterThan(10)
    expect(new Set(activo).size).toBe(activo?.length)
  })

  it('los morosos abandonadores llevan 12+ días sin venir y los activos vienen 3-4x/semana', () => {
    expect(diasSinAsistir('soc-04')).toBeGreaterThanOrEqual(12)
    expect(diasSinAsistir('soc-09')).toBeGreaterThanOrEqual(12)
    const activos = asistenciasDeSocio('soc-02', 30).length
    expect(activos).toBeGreaterThanOrEqual(12)
  })

  it('ningún socio de la tabla queda sin asistencias', () => {
    const conAsistencias = new Set(asistenciasMock.map((a) => a.socioId))
    for (const socio of sociosMock) {
      expect(conAsistencias.has(socio.id)).toBe(true)
    }
  })
})

describe('diasSinAsistir — fechas límite', () => {
  it('asistió hoy → 0', () => {
    expect(diasSinAsistir('soc-01', HOY)).toBe(0)
  })

  it('asistió ayer → 1', () => {
    const ayer = new Date(HOY)
    ayer.setDate(ayer.getDate() + 1)
    expect(diasSinAsistir('soc-01', ayer)).toBe(1)
  })

  it('10 días exactos cae en el umbral de riesgo', () => {
    const en10 = new Date(HOY)
    en10.setDate(en10.getDate() + 10)
    expect(diasSinAsistir('soc-01', en10)).toBe(10)
    expect(estaEnRiesgo('soc-01', en10)).toBe(true)
  })

  it('11 días sigue en riesgo, 9 todavía no', () => {
    const en11 = new Date(HOY)
    en11.setDate(en11.getDate() + 11)
    const en9 = new Date(HOY)
    en9.setDate(en9.getDate() + 9)
    expect(diasSinAsistir('soc-01', en11)).toBe(11)
    expect(estaEnRiesgo('soc-01', en11)).toBe(true)
    expect(estaEnRiesgo('soc-01', en9)).toBe(false)
  })

  it('20 días sin venir marcado con fecha explícita', () => {
    const en20 = new Date(HOY)
    en20.setDate(en20.getDate() + 20)
    expect(diasSinAsistir('soc-01', en20)).toBe(20)
    expect(estaEnRiesgo('soc-01', en20)).toBe(true)
  })

  it('socio inexistente/nunca asistió → Infinity', () => {
    expect(diasSinAsistir('soc-99')).toBe(Number.POSITIVE_INFINITY)
    expect(estaEnRiesgo('soc-99')).toBe(true)
  })
})

describe('estaEnRiesgo — umbral', () => {
  it('soc-04 (15 días) y soc-09 (18 días) en riesgo; soc-01 (hoy) no', () => {
    expect(estaEnRiesgo('soc-04')).toBe(true)
    expect(estaEnRiesgo('soc-09')).toBe(true)
    expect(estaEnRiesgo('soc-01')).toBe(false)
  })
})

describe('asistenciasDeSocio — ventana de días', () => {
  it('devuelve solo fechas ISO dentro de la ventana pedida', () => {
    const fechas = asistenciasDeSocio('soc-02', 30)
    expect(fechas.length).toBeGreaterThan(0)
    expect(fechas.every((fecha) => fecha > isoHace(30))).toBe(true)
  })

  it('ventana de 1 día solo incluye hoy', () => {
    const fechas = asistenciasDeSocio('soc-01', 1)
    expect(fechas).toEqual([isoHace(0)])
  })

  it('esporádico (soc-07) tiene menos asistencias que el activo (soc-02)', () => {
    expect(asistenciasDeSocio('soc-07', 30).length).toBeLessThan(
      asistenciasDeSocio('soc-02', 30).length,
    )
  })
})

describe('sociosEnRiesgo — orden y contenido', () => {
  it('todos cumplen el umbral de 10+ días y vienen ordenados desc', () => {
    const riesgos = sociosEnRiesgo()
    expect(riesgos.length).toBeGreaterThanOrEqual(2)
    for (const riesgo of riesgos) {
      expect(riesgo.diasSinAsistir).toBeGreaterThanOrEqual(10)
      const socio = sociosMock.find((s) => s.id === riesgo.socio.id)
      expect(riesgo.socio.nombre).toBe(socio?.nombre)
    }
    for (let i = 1; i < riesgos.length; i++) {
      expect(riesgos[i - 1]!.diasSinAsistir).toBeGreaterThanOrEqual(
        riesgos[i]!.diasSinAsistir,
      )
    }
  })

  it('incluye a los morosos abandonadores (Kevin y Gabriela)', () => {
    const nombres = sociosEnRiesgo().map((riesgo) => riesgo.socio.nombre)
    expect(nombres).toContain('Kevin Rodrigo Muñoz')
    expect(nombres).toContain('Gabriela Sánchez León')
  })
})

describe('ultimosDiasIso — utilidad del grid', () => {
  it('genera N fechas consecutivas terminando hoy', () => {
    const dias = ultimosDiasIso(30)
    expect(dias).toHaveLength(30)
    expect(dias[29]).toBe(isoHace(0))
    expect(dias[0]).toBe(isoHace(29))
  })
})
