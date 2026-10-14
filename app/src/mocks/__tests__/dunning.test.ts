import { describe, expect, it } from 'vitest'
import type { GestionCobranza } from '../bitacora'
import {
  DIAS_DUNNING,
  ETAPAS_DUNNING,
  descripcionEtapa,
  etapaDeGestion,
  etapaMayor,
  etapaVigente,
  gestionPendiente,
  gestionesDunningMock,
  membresiasDunningMock,
  pipelineDunning,
  recuperadosPostSecuencia,
  sociosDunningMock,
} from '../dunning'
import { bitacoraMock } from '../bitacora'
import { sumarDiasIso } from '../data'

const HOY = fechaHoyIsoLocal()

function fechaHoyIsoLocal(): string {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}

function venceEn(dias: number): string {
  return sumarDiasIso(HOY, dias)
}

describe('etapaVigente — etapa según días vencidos', () => {
  it('membresía vigente → null', () => {
    expect(etapaVigente(venceEn(1), HOY)).toBeNull()
    expect(etapaVigente(venceEn(15), HOY)).toBeNull()
  })

  it('vence hoy → d0', () => {
    expect(etapaVigente(venceEn(0), HOY)).toBe('d0')
  })

  it('día exacto de cada etapa', () => {
    expect(etapaVigente(venceEn(-1), HOY)).toBe('d1')
    expect(etapaVigente(venceEn(-4), HOY)).toBe('d4')
    expect(etapaVigente(venceEn(-7), HOY)).toBe('d7')
    expect(etapaVigente(venceEn(-12), HOY)).toBe('d12')
  })

  it('más de 12 días → escalado', () => {
    expect(etapaVigente(venceEn(-13), HOY)).toBe('escalado')
    expect(etapaVigente(venceEn(-40), HOY)).toBe('escalado')
  })

  it('casos borde intermedios conservan la etapa previa', () => {
    expect(etapaVigente(venceEn(-2), HOY)).toBe('d1')
    expect(etapaVigente(venceEn(-5), HOY)).toBe('d4')
    expect(etapaVigente(venceEn(-8), HOY)).toBe('d7')
    expect(etapaVigente(venceEn(-11), HOY)).toBe('d7')
  })

  it('DIAS_DUNNING coincide con las etapas del ciclo', () => {
    expect([...DIAS_DUNNING]).toEqual([0, 1, 4, 7, 12])
    expect(ETAPAS_DUNNING).toHaveLength(6)
  })
})

describe('gestionPendiente — ¿contactar hoy?', () => {
  it('sin gestión previa → pendiente', () => {
    expect(gestionPendiente('d0')).toBe(true)
    expect(gestionPendiente('escalado', undefined)).toBe(true)
  })

  it('etapa actual ya gestionada → no pendiente', () => {
    expect(gestionPendiente('d4', 'd4')).toBe(false)
    expect(gestionPendiente('d0', 'd0')).toBe(false)
    expect(gestionPendiente('escalado', 'escalado')).toBe(false)
  })

  it('etapa mayor que la última gestionada → pendiente', () => {
    expect(gestionPendiente('d4', 'd1')).toBe(true)
    expect(gestionPendiente('escalado', 'd12')).toBe(true)
  })

  it('etapa menor o igual gestionada antes → no pendiente', () => {
    expect(gestionPendiente('d0', 'd1')).toBe(false)
    expect(gestionPendiente('d7', 'd12')).toBe(false)
  })

  it('etapaMayor ordena de d0 a escalado', () => {
    expect(etapaMayor('d1', 'd0')).toBe(true)
    expect(etapaMayor('escalado', 'd12')).toBe(true)
    expect(etapaMayor('d0', 'd1')).toBe(false)
    expect(etapaMayor('d4', 'd4')).toBe(false)
  })
})

describe('descripcionEtapa — títulos y acciones en español', () => {
  it('las 6 etapas tienen título y acción no vacíos', () => {
    for (const etapa of ETAPAS_DUNNING) {
      const descripcion = descripcionEtapa(etapa)
      expect(descripcion.titulo.length).toBeGreaterThan(0)
      expect(descripcion.accion.length).toBeGreaterThan(0)
    }
  })

  it('contenido clave por etapa', () => {
    expect(descripcionEtapa('d0')).toEqual({
      titulo: 'Venció hoy',
      accion: 'WhatsApp con link de pago',
    })
    expect(descripcionEtapa('d1').accion).toBe('Recordatorio amigable')
    expect(descripcionEtapa('d4').accion).toContain('Reintento')
    expect(descripcionEtapa('d7').accion).toBe('Llamada del dueño')
    expect(descripcionEtapa('d12').accion).toContain('congelar')
    expect(descripcionEtapa('escalado').accion).toBe('Baja o plan de pago')
  })
})

describe('pipelineDunning — agrupación por etapa', () => {
  const socios = new Map(sociosDunningMock.map((socio) => [socio.id, socio]))
  const gestiones = [...bitacoraMock, ...gestionesDunningMock]
  const columnas = pipelineDunning(membresiasDunningMock, socios, gestiones, HOY)

  it('devuelve las 6 columnas del tablero', () => {
    expect(columnas.map((columna) => columna.etapa)).toEqual([
      'd0',
      'd1',
      'd4',
      'd7',
      'd12',
      'escalado',
    ])
  })

  it('solo incluye membresías vencidas', () => {
    for (const columna of columnas) {
      for (const moroso of columna.morosos) {
        expect(moroso.diasVencido).toBeGreaterThanOrEqual(0)
      }
    }
    const total = columnas.reduce((suma, columna) => suma + columna.morosos.length, 0)
    expect(total).toBe(6)
  })

  it('agrupa cada moroso en su etapa correcta', () => {
    const porEtapa = new Map(
      columnas.map((columna) => [
        columna.etapa,
        columna.morosos.map((moroso) => moroso.socio.id),
      ]),
    )
    expect(porEtapa.get('d0')).toEqual(['soc-13'])
    expect(porEtapa.get('d1')).toEqual(['soc-12'])
    expect(porEtapa.get('d4')).toEqual(['soc-04'])
    expect(porEtapa.get('d7')).toEqual(['soc-14'])
    expect(porEtapa.get('d12')).toEqual(['soc-15'])
    expect(porEtapa.get('escalado')).toEqual(['soc-09'])
  })

  it('calcula el monto debido con meses vencidos prorrateados', () => {
    const escalado = columnas.find((columna) => columna.etapa === 'escalado')
    const moroso = escalado?.morosos[0]
    expect(moroso?.montoDebido).toBe(55)
    expect(moroso?.diasVencido).toBe(15)
  })

  it('prorratea a 2 meses a partir de 31 días vencidos', () => {
    const socio = sociosDunningMock.find((s) => s.id === 'soc-09')
    const membresia = membresiasDunningMock.find((m) => m.id === 'mem-09')
    const columnas = pipelineDunning(
      [{ ...membresia!, fechaFin: sumarDiasIso(HOY, -35) }],
      new Map([[socio!.id, socio!]]),
      [],
      HOY,
    )
    expect(columnas.find((c) => c.etapa === 'escalado')?.morosos[0]?.montoDebido).toBe(110)
  })

  it('la deuda de cada columna suma los montos de sus morosos', () => {
    for (const columna of columnas) {
      const suma = columna.morosos.reduce((total, moroso) => total + moroso.montoDebido, 0)
      expect(columna.deuda).toBe(suma)
    }
    expect(columnas.find((c) => c.etapa === 'd0')?.deuda).toBe(80)
    expect(columnas.find((c) => c.etapa === 'd12')?.deuda).toBe(55)
  })

  it('adjunta la última gestión registrada del socio', () => {
    const d4 = columnas.find((columna) => columna.etapa === 'd4')
    const moroso = d4?.morosos[0]
    expect(moroso?.ultimaGestion?.socioId).toBe('soc-04')
    expect(moroso?.telefono).toBe('999 876 543')
  })
})

describe('etapaDeGestion — etapa vigente en la fecha de la gestión', () => {
  it('gestión el día del vencimiento → d0', () => {
    expect(etapaDeGestion(venceEn(0), HOY)).toBe('d0')
  })

  it('gestión antes del vencimiento → null', () => {
    expect(etapaDeGestion(venceEn(0), venceEn(-3))).toBeNull()
  })

  it('gestión a los 5 días de vencida → d4', () => {
    expect(etapaDeGestion(venceEn(0), venceEn(5))).toBe('d4')
  })
})

describe('recuperadosPostSecuencia — KPI derivado de la bitácora', () => {
  it('cuenta socios cuya última gestión terminó en compromiso', () => {
    const gestiones: readonly GestionCobranza[] = [
      { id: 'g1', socioId: 'a', tipo: 'whatsapp', nota: '', resultado: 'prometio', fecha: '2026-09-01' },
      { id: 'g2', socioId: 'a', tipo: 'llamada', nota: '', resultado: 'no-responde', fecha: '2026-09-05' },
      { id: 'g3', socioId: 'b', tipo: 'whatsapp', nota: '', resultado: 'pagara-hoy', fecha: '2026-09-10' },
      { id: 'g4', socioId: 'c', tipo: 'visita', nota: '', resultado: 'pendiente', fecha: '2026-09-10' },
    ]
    expect(recuperadosPostSecuencia(gestiones)).toBe(1)
  })

  it('con el mock completo: Kevin prometió, Gabriela negocia, Álvaro paga hoy, resto sin gestión', () => {
    expect(
      recuperadosPostSecuencia([...bitacoraMock, ...gestionesDunningMock]),
    ).toBeGreaterThanOrEqual(1)
  })
})
