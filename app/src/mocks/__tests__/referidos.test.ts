import { describe, expect, it } from 'vitest'
import { membresiasMock, sociosMock } from '@/mocks/data'
import { pagosMock } from '@/mocks/pagos'
import type { EstadoPago } from '@/mocks/pagos'
import {
  agruparPagosPorSocio,
  descuentoProximoPago,
  elegibleParaRecompensa,
  estadoDerivado,
  motivoNoCalifica,
  RECOMPENSA_REFERIDO,
  referidoDeSocio,
  referidosDeReferidor,
  referidosMock,
  referidosPorSocio,
} from '@/mocks/referidos'
import type { ContextoReferidos, Referido } from '@/mocks/referidos'
import type { EstadoMembresia, EstadoSocio, Membresia, Socio } from '@/mocks/types'

function socioSintetico(id: string, estado: EstadoSocio): Socio {
  return {
    id,
    codigo: `MS-${id.toUpperCase()}`,
    nombre: `Socio ${id}`,
    dni: '00000000',
    telefono: '999 000 000',
    planId: 'plan-mensual',
    estado,
    fechaRegistro: '2026-01-01',
  }
}

function membresiaSintetica(socioId: string, estado: EstadoMembresia): Membresia {
  return {
    id: `mem-${socioId}`,
    socioId,
    planId: 'plan-mensual',
    fechaInicio: '2026-08-01',
    fechaFin: '2026-09-30',
    monto: 80,
    estado,
  }
}

function pagoSintetico(id: string, socioId: string, estado: EstadoPago) {
  return {
    id,
    fecha: '2026-08-20',
    socioId,
    nombre: 'Socio test',
    codigo: 'MS-T',
    dni: '00000000',
    planId: 'plan-mensual',
    planNombre: 'Mensual',
    monto: 80,
    metodo: 'efectivo' as const,
    estado,
    concepto: 'membresia' as const,
  }
}

function construirContexto(
  socios: readonly Socio[],
  membresias: readonly Membresia[],
  pagosPorSocio: ContextoReferidos['pagosPorSocio'],
): ContextoReferidos {
  return {
    socios: new Map(socios.map((socio): [string, Socio] => [socio.id, socio])),
    membresias: new Map(
      membresias.map((membresia): [string, Membresia] => [membresia.socioId, membresia]),
    ),
    pagosPorSocio,
  }
}

const CONTEXTO_BASE = construirContexto(
  [socioSintetico('t-1', 'activo')],
  [membresiaSintetica('t-1', 'vigente')],
  new Map([['t-1', [pagoSintetico('p-1', 't-1', 'completado')]]]),
)

describe('elegibleParaRecompensa — regla anti-abuso', () => {
  it('referido activo con cuota pagada y membresía al día → elegible', () => {
    expect(
      elegibleParaRecompensa('t-1', CONTEXTO_BASE.socios, CONTEXTO_BASE.membresias, CONTEXTO_BASE.pagosPorSocio),
    ).toBe(true)
  })

  it('referido activo sin ningún pago → no elegible', () => {
    const contexto = construirContexto(
      [socioSintetico('t-1', 'activo')],
      [membresiaSintetica('t-1', 'vigente')],
      new Map(),
    )
    expect(
      elegibleParaRecompensa('t-1', contexto.socios, contexto.membresias, contexto.pagosPorSocio),
    ).toBe(false)
  })

  it('referido congelado (inactivo) → no elegible aunque tenga pagos', () => {
    const contexto = construirContexto(
      [socioSintetico('t-1', 'congelado')],
      [membresiaSintetica('t-1', 'vigente')],
      CONTEXTO_BASE.pagosPorSocio,
    )
    expect(
      elegibleParaRecompensa('t-1', contexto.socios, contexto.membresias, contexto.pagosPorSocio),
    ).toBe(false)
  })

  it('referido con deuda (membresía vencida) → no elegible', () => {
    const contexto = construirContexto(
      [socioSintetico('t-1', 'moroso')],
      [membresiaSintetica('t-1', 'vencida')],
      CONTEXTO_BASE.pagosPorSocio,
    )
    expect(
      elegibleParaRecompensa('t-1', contexto.socios, contexto.membresias, contexto.pagosPorSocio),
    ).toBe(false)
  })

  it('socio inexistente → no elegible', () => {
    expect(
      elegibleParaRecompensa('fantasma', CONTEXTO_BASE.socios, CONTEXTO_BASE.membresias, CONTEXTO_BASE.pagosPorSocio),
    ).toBe(false)
  })

  it('pagos pendientes o anulados no cuentan como cuota pagada', () => {
    const contexto = construirContexto(
      [socioSintetico('t-1', 'activo')],
      [membresiaSintetica('t-1', 'vigente')],
      new Map([
        ['t-1', [pagoSintetico('p-1', 't-1', 'pendiente'), pagoSintetico('p-2', 't-1', 'anulado')]],
      ]),
    )
    expect(
      elegibleParaRecompensa('t-1', contexto.socios, contexto.membresias, contexto.pagosPorSocio),
    ).toBe(false)
  })
})

describe('estadoDerivado', () => {
  const referidoBase: Referido = {
    id: 'ref-t1',
    referidorId: 't-9',
    referidoId: 't-1',
    fecha: '2026-08-01',
    estado: 'pendiente',
  }

  it('referido que califica → elegible', () => {
    expect(estadoDerivado(referidoBase, CONTEXTO_BASE)).toBe('elegible')
  })

  it('referido congelado → inválido', () => {
    const contexto = construirContexto(
      [socioSintetico('t-1', 'congelado')],
      [membresiaSintetica('t-1', 'vigente')],
      CONTEXTO_BASE.pagosPorSocio,
    )
    expect(estadoDerivado(referidoBase, contexto)).toBe('invalido')
  })

  it('referido con deuda → pendiente (aún no califica)', () => {
    const contexto = construirContexto(
      [socioSintetico('t-1', 'moroso')],
      [membresiaSintetica('t-1', 'vencida')],
      CONTEXTO_BASE.pagosPorSocio,
    )
    expect(estadoDerivado(referidoBase, contexto)).toBe('pendiente')
  })

  it('aplicado se mantiene aunque el referido después se congele', () => {
    const contexto = construirContexto(
      [socioSintetico('t-1', 'congelado')],
      [membresiaSintetica('t-1', 'vencida')],
      new Map(),
    )
    expect(estadoDerivado({ ...referidoBase, estado: 'aplicado' }, contexto)).toBe('aplicado')
  })

  it('elegible almacenado se reevalúa si el referido deja de calificar', () => {
    const contexto = construirContexto(
      [socioSintetico('t-1', 'moroso')],
      [membresiaSintetica('t-1', 'vencida')],
      CONTEXTO_BASE.pagosPorSocio,
    )
    expect(estadoDerivado({ ...referidoBase, estado: 'elegible' }, contexto)).toBe('pendiente')
  })
})

describe('motivoNoCalifica', () => {
  const referidoBase: Referido = {
    id: 'ref-t1',
    referidorId: 't-9',
    referidoId: 't-1',
    fecha: '2026-08-01',
    estado: 'pendiente',
  }

  it('referido congelado → "Referido inactivo"', () => {
    const contexto = construirContexto(
      [socioSintetico('t-1', 'congelado')],
      [membresiaSintetica('t-1', 'vigente')],
      CONTEXTO_BASE.pagosPorSocio,
    )
    expect(motivoNoCalifica(referidoBase, contexto)).toBe('Referido inactivo')
  })

  it('referido sin cuota paga → "Referido aún sin cuota paga"', () => {
    const contexto = construirContexto(
      [socioSintetico('t-1', 'activo')],
      [membresiaSintetica('t-1', 'vigente')],
      new Map(),
    )
    expect(motivoNoCalifica(referidoBase, contexto)).toBe('Referido aún sin cuota paga')
  })

  it('referido con deuda → "Referido con membresía vencida"', () => {
    const contexto = construirContexto(
      [socioSintetico('t-1', 'moroso')],
      [membresiaSintetica('t-1', 'vencida')],
      CONTEXTO_BASE.pagosPorSocio,
    )
    expect(motivoNoCalifica(referidoBase, contexto)).toBe('Referido con membresía vencida')
  })
})

describe('descuentoProximoPago — S/ 20 fijo por aplicado', () => {
  const referidos: readonly Referido[] = [
    { id: 'r1', referidorId: 't-1', referidoId: 'a-1', fecha: '2026-07-01', estado: 'aplicado' },
    { id: 'r2', referidorId: 't-1', referidoId: 'a-2', fecha: '2026-07-15', estado: 'aplicado' },
    { id: 'r3', referidorId: 't-1', referidoId: 'a-3', fecha: '2026-07-20', estado: 'elegible' },
    { id: 'r4', referidorId: 't-2', referidoId: 'a-4', fecha: '2026-07-25', estado: 'aplicado' },
  ]

  it('dos aplicados → S/ 40', () => {
    expect(descuentoProximoPago('t-1', referidos)).toBe(2 * RECOMPENSA_REFERIDO)
    expect(descuentoProximoPago('t-1', referidos)).toBe(40)
  })

  it('un aplicado → S/ 20', () => {
    expect(descuentoProximoPago('t-2', referidos)).toBe(20)
  })

  it('referidor sin aplicados → 0', () => {
    expect(descuentoProximoPago('t-3', referidos)).toBe(0)
  })

  it('la constante es el monto fijo acordado (S/ 20)', () => {
    expect(RECOMPENSA_REFERIDO).toBe(20)
  })
})

describe('referidosPorSocio — conteo por referidor', () => {
  const referidos: readonly Referido[] = [
    { id: 'r1', referidorId: 't-1', referidoId: 'a-1', fecha: '2026-07-01', estado: 'aplicado' },
    { id: 'r2', referidorId: 't-1', referidoId: 'a-2', fecha: '2026-07-15', estado: 'pendiente' },
    { id: 'r3', referidorId: 't-2', referidoId: 'a-3', fecha: '2026-07-20', estado: 'elegible' },
  ]

  it('cuenta referidos de cada referidor sin filtrar por estado', () => {
    const conteo = referidosPorSocio(referidos)
    expect(conteo.get('t-1')).toBe(2)
    expect(conteo.get('t-2')).toBe(1)
    expect(conteo.has('t-3')).toBe(false)
  })

  it('lista vacía → mapa vacío', () => {
    expect(referidosPorSocio([]).size).toBe(0)
  })
})

describe('referidosMock — dataset determinista sobre los mocks reales', () => {
  const contexto = construirContexto(sociosMock, membresiasMock, agruparPagosPorSocio(pagosMock))
  const estados = referidosMock.map((referido) => estadoDerivado(referido, contexto))

  it('tiene exactamente 8 referidos con ids únicos', () => {
    expect(referidosMock).toHaveLength(8)
    expect(new Set(referidosMock.map((referido) => referido.id)).size).toBe(8)
  })

  it('nadie se refiere a sí mismo', () => {
    for (const referido of referidosMock) {
      expect(referido.referidorId).not.toBe(referido.referidoId)
    }
  })

  it('distribución: 3 elegibles, 2 aplicados, 2 pendientes, 1 inválido', () => {
    expect(estados.filter((estado) => estado === 'elegible')).toHaveLength(3)
    expect(estados.filter((estado) => estado === 'aplicado')).toHaveLength(2)
    expect(estados.filter((estado) => estado === 'pendiente')).toHaveLength(2)
    expect(estados.filter((estado) => estado === 'invalido')).toHaveLength(1)
  })

  it('los referidos y referidores existen en sociosMock', () => {
    const ids = new Set(sociosMock.map((socio) => socio.id))
    for (const referido of referidosMock) {
      expect(ids.has(referido.referidorId)).toBe(true)
      expect(ids.has(referido.referidoId)).toBe(true)
    }
  })

  it('helpers de consulta responden con el mock real', () => {
    expect(referidoDeSocio('soc-01')).toBeDefined()
    expect(referidoDeSocio('soc-01')?.referidorId).toBe('soc-02')
    expect(referidosDeReferidor('soc-05')).toHaveLength(2)
    expect(referidoDeSocio('soc-fantasma')).toBeUndefined()
  })
})
