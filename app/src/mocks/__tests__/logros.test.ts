import { describe, expect, it } from 'vitest'
import type { Asistencia } from '../asistencias'
import {
  asistenciasMes,
  diaSiguienteIso,
  diasAtrasIso,
  logrosConseguidos,
  logrosMock,
  rachaActual,
  rachaMejor,
  rankingRachas,
  tempraneras,
  totalAsistencias,
} from '../logros'
import type { LogroDefinido } from '../logros'

const HOY_ISO = '2026-09-10'

function iso(offsetDias: number): string {
  return diasAtrasIso(HOY_ISO, offsetDias)
}

function as(socioId: string, offsetDias: number, hora?: string): Asistencia {
  return { socioId, fecha: iso(offsetDias), ...(hora ? { hora } : {}) }
}

function racha(id: string): LogroDefinido {
  return { id, nombre: id, emoji: 'x', metrica: 'racha', umbral: 2 }
}

describe('rachaActual — regla de medianoche', () => {
  it('cuenta los días consecutivos terminando hoy', () => {
    const asistencias = [as('s1', 0), as('s1', 1), as('s1', 2), as('s1', 5)]
    expect(rachaActual(asistencias, 's1', HOY_ISO)).toBe(3)
  })

  it('racha viva sin hoy: si no asistió hoy, cuenta desde ayer', () => {
    const asistencias = [as('s1', 1), as('s1', 2), as('s1', 3)]
    expect(rachaActual(asistencias, 's1', HOY_ISO)).toBe(3)
  })

  it('rota si ayer tampoco asistió (última hace 2 días)', () => {
    const asistencias = [as('s1', 2), as('s1', 3), as('s1', 4)]
    expect(rachaActual(asistencias, 's1', HOY_ISO)).toBe(0)
  })

  it('un gap interno corta el conteo hacia atrás', () => {
    const asistencias = [as('s1', 0), as('s1', 1), as('s1', 3), as('s1', 4)]
    expect(rachaActual(asistencias, 's1', HOY_ISO)).toBe(2)
  })

  it('0 sin asistencias y 0 para socio inexistente', () => {
    expect(rachaActual([], 's1', HOY_ISO)).toBe(0)
    expect(rachaActual([as('s1', 0)], 's2', HOY_ISO)).toBe(0)
  })

  it('asistencias duplicadas el mismo día no inflan la racha', () => {
    const asistencias = [as('s1', 0), as('s1', 0), as('s1', 1)]
    expect(rachaActual(asistencias, 's1', HOY_ISO)).toBe(2)
  })
})

describe('rachaMejor — histórico', () => {
  it('devuelve el mejor tramo aunque la racha actual esté rota', () => {
    const asistencias = [as('s1', 0), as('s1', 10), as('s1', 11), as('s1', 12), as('s1', 20)]
    expect(rachaActual(asistencias, 's1', HOY_ISO)).toBe(1)
    expect(rachaMejor(asistencias, 's1', )).toBe(3)
  })

  it('0 sin asistencias', () => {
    expect(rachaMejor([], 's1')).toBe(0)
  })

  it('racha completa en curso iguala a la mejor', () => {
    const asistencias = [as('s1', 0), as('s1', 1), as('s1', 2)]
    expect(rachaMejor(asistencias, 's1')).toBe(3)
  })
})

describe('asistenciasMes — días únicos en el mes pedido', () => {
  it('cuenta solo el mes/año indicado (mes 1-12)', () => {
    const asistencias = [
      as('s1', 0),
      as('s1', 1),
      as('s1', 35),
      as('s2', 0),
    ]
    expect(asistenciasMes(asistencias, 's1', 2026, 9)).toBe(2)
    expect(asistenciasMes(asistencias, 's1', 2026, 8)).toBe(1)
    expect(asistenciasMes(asistencias, 's2', 2026, 9)).toBe(1)
  })

  it('duplicados del mismo día cuentan una sola vez', () => {
    const asistencias = [as('s1', 0), as('s1', 0), as('s1', 1)]
    expect(asistenciasMes(asistencias, 's1', 2026, 9)).toBe(2)
  })
})

describe('tempraneras — hora < 09:00', () => {
  it('cuenta entradas antes de las 9', () => {
    const asistencias = [
      as('s1', 0, '07:30'),
      as('s1', 1, '08:59'),
      as('s1', 2, '06:05'),
    ]
    expect(tempraneras(asistencias, 's1')).toBe(3)
  })

  it('las 09:00 exactas no son tempraneras', () => {
    const asistencias = [as('s1', 0, '09:00'), as('s1', 1, '10:15')]
    expect(tempraneras(asistencias, 's1')).toBe(0)
  })

  it('sin hora no cuenta (seeds viejos) ni rompe', () => {
    const asistencias = [as('s1', 0), as('s1', 1), as('s1', 2, '05:00')]
    expect(tempraneras(asistencias, 's1')).toBe(1)
    expect(tempraneras([], 's1')).toBe(0)
  })

  it('hora mal formada no cuenta', () => {
    const asistencias = [{ socioId: 's1', fecha: iso(0), hora: 'tarde' }]
    expect(tempraneras(asistencias, 's1')).toBe(0)
  })
})

describe('totalAsistencias', () => {
  it('cuenta días únicos', () => {
    const asistencias = [as('s1', 0), as('s1', 0), as('s1', 1), as('s1', 5)]
    expect(totalAsistencias(asistencias, 's1')).toBe(3)
  })
})

describe('logrosConseguidos — umbrales exactos', () => {
  it('umbral exacto alcanzado justo → conseguido con la fecha que lo completó', () => {
    const asistencias = [as('s1', 0), as('s1', 1)]
    const logro = { ...racha('t-2'), metrica: 'total-asistencias' as const, umbral: 2 }
    const resultado = logrosConseguidos([logro], asistencias, 's1', HOY_ISO)
    expect(resultado).toHaveLength(1)
    expect(resultado[0]?.fechaConseguido).toBe(iso(0))
  })

  it('umbral - 1 → no conseguido', () => {
    const asistencias = [as('s1', 0)]
    const logro = { ...racha('t-2'), metrica: 'total-asistencias' as const, umbral: 2 }
    expect(logrosConseguidos([logro], asistencias, 's1', HOY_ISO)).toHaveLength(0)
  })

  it('logro de racha: racha actual de 3 días completa umbral 2 ayer', () => {
    const asistencias = [as('s1', 0), as('s1', 1), as('s1', 2)]
    const resultado = logrosConseguidos([racha('t-r')], asistencias, 's1', HOY_ISO)
    expect(resultado).toHaveLength(1)
    expect(resultado[0]?.fechaConseguido).toBe(iso(1))
  })

  it('logro de racha sin racha activa no se concede aunque hubo días antes', () => {
    const asistencias = [as('s1', 4), as('s1', 5), as('s1', 6)]
    expect(logrosConseguidos([racha('t-r')], asistencias, 's1', HOY_ISO)).toHaveLength(0)
  })

  it('asistencias-mes usa el mes de hoyIso y cuenta días únicos', () => {
    const asistencias = [as('s1', 0), as('s1', 1), as('s1', 2)]
    const logro = { ...racha('t-m'), metrica: 'asistencias-mes' as const, umbral: 3 }
    const resultado = logrosConseguidos([logro], asistencias, 's1', HOY_ISO)
    expect(resultado).toHaveLength(1)
    expect(resultado[0]?.fechaConseguido).toBe(iso(0))
  })

  it('tempranero: la décima entrada tempranera fija la fecha, ordenada por fecha real', () => {
    const asistencias = Array.from({ length: 10 }, (_, i) => as('s1', i + 2, '07:00'))
    asistencias.push(as('s1', 0, '06:00'))
    const logro = { ...racha('t-t'), metrica: 'tempranero' as const, umbral: 10 }
    const resultado = logrosConseguidos([logro], asistencias, 's1', HOY_ISO)
    expect(resultado).toHaveLength(1)
    expect(resultado[0]?.fechaConseguido).toBe(iso(2))
  })

  it('tempranero: las entradas sin hora no llegan al umbral', () => {
    const asistencias = Array.from({ length: 12 }, (_, i) => as('s1', i))
    const logro = { ...racha('t-t'), metrica: 'tempranero' as const, umbral: 10 }
    expect(logrosConseguidos([logro], asistencias, 's1', HOY_ISO)).toHaveLength(0)
  })

  it('socio sin actividad → lista vacía, con el catálogo completo no rompe', () => {
    expect(logrosConseguidos(logrosMock, [], 'nadie', HOY_ISO)).toEqual([])
  })
})

describe('rankingRachas — top para el panel', () => {
  it('solo socios con racha > 0, ordenado desc', () => {
    const asistencias = [
      as('a', 0),
      as('b', 0),
      as('b', 1),
      as('b', 2),
      as('c', 5),
    ]
    const ranking = rankingRachas(asistencias, ['a', 'b', 'c'], HOY_ISO)
    expect(ranking.map((r) => r.socioId)).toEqual(['b', 'a'])
    expect(ranking[0]?.racha).toBe(3)
  })
})

describe('utilidades de fechas', () => {
  it('diaSiguienteIso avanza un día', () => {
    expect(diaSiguienteIso('2026-09-10')).toBe('2026-09-11')
    expect(diaSiguienteIso('2026-02-28')).toBe('2026-03-01')
  })
})
