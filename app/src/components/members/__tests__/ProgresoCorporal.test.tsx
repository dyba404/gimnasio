import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProgresoCorporal } from '../ProgresoCorporal'
import type { Medicion } from '@/mocks/mediciones'

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

function med(socioId: string, diasAtras: number, campos: Partial<Medicion>): Medicion {
  return { socioId, fecha: isoHace(diasAtras), ...campos }
}

function render(props: Parameters<typeof ProgresoCorporal>[0]): string {
  return renderToStaticMarkup(<ProgresoCorporal {...props} />).replace(/<!--[^>]*-->/g, '')
}

describe('ProgresoCorporal — deltas con dirección favorable/desfavorable', () => {
  const html = render({ socioId: 'soc-01' })

  it('peso -2 kg vs anterior es favorable: ▼ en emerald', () => {
    expect(html).toContain('▼ -2 kg')
    expect(html).toContain('text-emerald-600')
  })

  it('grasa -1.5 % es favorable: ▼ en emerald', () => {
    expect(html).toContain('▼ -1.5 %')
  })

  it('brazo +0.5 cm es favorable: ▲ en emerald (subir es bueno aquí)', () => {
    expect(html).toContain('▲ +0.5 cm')
  })

  it('pecho -1 cm es desfavorable: ▼ en rojo (bajar es malo aquí)', () => {
    expect(html).toContain('▼ -1 cm')
    expect(html).toContain('text-red-600')
  })

  it('IMC de la última medición (79 kg, 165 cm ≈ 29.0) marca Sobrepeso', () => {
    expect(html).toContain('29.0')
    expect(html).toContain('Sobrepeso')
  })

  it('muestra el badge con el número de mediciones', () => {
    expect(html).toContain('4 mediciones')
  })
})

describe('ProgresoCorporal — desfavorable en otro socio', () => {
  it('soc-02 subió de peso: ▲ +2 kg en rojo', () => {
    const html = render({ socioId: 'soc-02' })
    expect(html).toContain('▲ +2 kg')
    expect(html).toContain('text-red-600')
    expect(html).toContain('▲ +1 cm')
  })
})

describe('ProgresoCorporal — una sola medición: valores sin delta', () => {
  it('soc-03 muestra valores y ninguna flecha', () => {
    const html = render({ socioId: 'soc-03' })
    expect(html).toContain('1 medición')
    expect(html).toContain('58 kg')
    expect(html).not.toContain('▼')
    expect(html).not.toContain('▲')
    expect(html).toContain('Normal')
  })
})

describe('ProgresoCorporal — sin mediciones: empty state', () => {
  it('muestra el llamado a registrar la primera', () => {
    const html = render({ socioId: 'soc-07' })
    expect(html).toContain('Sin mediciones — registra la primera')
    expect(html).toContain('0 mediciones')
  })
})

describe('ProgresoCorporal — mediciones inyectadas (independiente del reloj)', () => {
  it('deltas calculados sobre datos fijos', () => {
    const html = render({
      socioId: 't1',
      mediciones: [
        med('t1', 30, { pesoKg: 80, grasaPct: 20, alturaCm: 170 }),
        med('t1', 0, { pesoKg: 78, grasaPct: 21, alturaCm: 170 }),
      ],
    })
    expect(html).toContain('▼ -2 kg')
    expect(html).toContain('▲ +1 %')
    expect(html).toContain('text-emerald-600')
    expect(html).toContain('text-red-600')
  })

  it('delta de cero se muestra neutro con =', () => {
    const html = render({
      socioId: 't1',
      mediciones: [
        med('t1', 30, { pesoKg: 80 }),
        med('t1', 0, { pesoKg: 80 }),
      ],
    })
    expect(html).toContain('= 0 kg')
  })
})
