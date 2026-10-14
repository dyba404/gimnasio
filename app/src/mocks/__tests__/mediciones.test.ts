import { describe, expect, it } from 'vitest'
import {
  categoriaImc,
  delta,
  direccionDelta,
  imc,
  medicionesMock,
  progresoGrafico,
  serieMediciones,
} from '../mediciones'
import type { Medicion } from '../mediciones'

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

function medicion(parcial: Partial<Medicion> & { fecha: string }): Medicion {
  return { socioId: 'soc-test', ...parcial }
}

describe('serieMediciones — orden y filtro', () => {
  it('ordena ascendente por fecha aunque la entrada esté desordenada', () => {
    const serie = serieMediciones(
      [
        medicion({ fecha: isoHace(10), pesoKg: 80 }),
        medicion({ fecha: isoHace(30), pesoKg: 85 }),
        medicion({ fecha: isoHace(20), pesoKg: 82 }),
      ],
      'soc-test',
    )
    expect(serie.map((m) => m.pesoKg)).toEqual([85, 82, 80])
  })

  it('filtra solo las mediciones del socio pedido', () => {
    const serie = serieMediciones(
      [
        medicion({ fecha: isoHace(10), pesoKg: 80 }),
        { socioId: 'soc-otro', fecha: isoHace(5), pesoKg: 60 },
      ],
      'soc-test',
    )
    expect(serie).toHaveLength(1)
    expect(serie[0]?.socioId).toBe('soc-test')
  })

  it('los mocks de soc-01 van de 85 kg a 79 kg en 4 mediciones mensuales', () => {
    const serie = serieMediciones(medicionesMock, 'soc-01')
    expect(serie).toHaveLength(4)
    expect(serie[0]?.pesoKg).toBe(85)
    expect(serie[3]?.pesoKg).toBe(79)
    expect(serie[3]?.grasaPct).toBe(19)
  })
})

describe('delta — solo campos presentes en ambas', () => {
  it('calcula b-a para los campos que ambas mediciones comparten', () => {
    const resultado = delta(
      medicion({ fecha: isoHace(30), pesoKg: 85, grasaPct: 24, cinturaCm: 96 }),
      medicion({ fecha: isoHace(0), pesoKg: 79, grasaPct: 19, cinturaCm: 90 }),
    )
    expect(resultado.pesoKg).toBeCloseTo(-6)
    expect(resultado.grasaPct).toBeCloseTo(-5)
    expect(resultado.cinturaCm).toBeCloseTo(-6)
  })

  it('omite el campo que existe solo en una de las dos', () => {
    const resultado = delta(
      medicion({ fecha: isoHace(30), pesoKg: 85, cuelloCm: 40 }),
      medicion({ fecha: isoHace(0), pesoKg: 79, brazoCm: 36 }),
    )
    expect(resultado.pesoKg).toBeCloseTo(-6)
    expect(resultado.cuelloCm).toBeUndefined()
    expect(resultado.brazoCm).toBeUndefined()
  })

  it('sin campos compartidos devuelve objeto vacío', () => {
    const resultado = delta(
      medicion({ fecha: isoHace(30), cuelloCm: 40 }),
      medicion({ fecha: isoHace(0), brazoCm: 36 }),
    )
    expect(Object.keys(resultado)).toHaveLength(0)
  })
})

describe('imc — con y sin datos', () => {
  it('calcula peso / (altura/100)²', () => {
    expect(imc(medicion({ fecha: isoHace(0), pesoKg: 75, alturaCm: 180 })) ?? 0).toBeCloseTo(
      23.148,
      2,
    )
  })

  it('sin peso devuelve null', () => {
    expect(imc(medicion({ fecha: isoHace(0), alturaCm: 180 }))).toBeNull()
  })

  it('sin altura devuelve null', () => {
    expect(imc(medicion({ fecha: isoHace(0), pesoKg: 75 }))).toBeNull()
  })

  it('altura 0 no divide entre cero', () => {
    expect(imc(medicion({ fecha: isoHace(0), pesoKg: 75, alturaCm: 0 }))).toBeNull()
  })
})

describe('categoriaImc — umbrales OMS', () => {
  it('clasifica según 18.5 / 25 / 30', () => {
    expect(categoriaImc(17)).toBe('bajo')
    expect(categoriaImc(18.49)).toBe('bajo')
    expect(categoriaImc(18.5)).toBe('normal')
    expect(categoriaImc(24.9)).toBe('normal')
    expect(categoriaImc(25)).toBe('sobrepeso')
    expect(categoriaImc(29.9)).toBe('sobrepeso')
    expect(categoriaImc(30)).toBe('obeso')
    expect(categoriaImc(35)).toBe('obeso')
  })
})

describe('direccionDelta — bajar es favorable según métrica', () => {
  it('peso, grasa y cintura: bajar favorable, subir desfavorable', () => {
    expect(direccionDelta('pesoKg', -2)).toBe('favorable')
    expect(direccionDelta('grasaPct', -1)).toBe('favorable')
    expect(direccionDelta('cinturaCm', -3)).toBe('favorable')
    expect(direccionDelta('pesoKg', 1)).toBe('desfavorable')
    expect(direccionDelta('grasaPct', 0.5)).toBe('desfavorable')
  })

  it('brazo y pecho: subir favorable, bajar desfavorable', () => {
    expect(direccionDelta('brazoCm', 1)).toBe('favorable')
    expect(direccionDelta('pechoCm', 2)).toBe('favorable')
    expect(direccionDelta('brazoCm', -1)).toBe('desfavorable')
    expect(direccionDelta('pechoCm', -2)).toBe('desfavorable')
  })

  it('cero es neutro', () => {
    expect(direccionDelta('pesoKg', 0)).toBe('neutro')
    expect(direccionDelta('brazoCm', 0)).toBe('neutro')
  })
})

describe('progresoGrafico — puntos listos para recharts', () => {
  it('devuelve fecha ascendente con peso y grasa cuando existen', () => {
    const puntos = progresoGrafico(medicionesMock, 'soc-01')
    expect(puntos).toHaveLength(4)
    expect(puntos[0]).toEqual({
      fecha: expect.any(String),
      peso: 85,
      grasa: 24,
    })
    expect(puntos[3]).toEqual({ fecha: expect.any(String), peso: 79, grasa: 19 })
  })

  it('omite las claves ausentes en el mock de soc-02 (sin muslo ni pecho no rompe)', () => {
    const puntos = progresoGrafico(medicionesMock, 'soc-02')
    expect(puntos).toHaveLength(2)
    expect(puntos[0]?.peso).toBe(72)
    expect(puntos[0]?.grasa).toBe(15)
    expect('muslo' in (puntos[0] ?? {})).toBe(false)
  })

  it('socio sin mediciones devuelve lista vacía', () => {
    expect(progresoGrafico(medicionesMock, 'soc-99')).toEqual([])
  })
})
