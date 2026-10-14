import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ColumnaDunning } from '@/components/cobranza/ColumnaDunning'
import { membresiasDunningMock, sociosDunningMock } from '@/mocks/dunning'

function renderColumna(
  props: Partial<Parameters<typeof ColumnaDunning>[0]> = {},
): string {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const socioValido = sociosDunningMock.find((s) => s.id === 'soc-13')!
  const socioInvalido = sociosDunningMock.find((s) => s.id === 'soc-15')!
  const membresiaValida = membresiasDunningMock.find((m) => m.id === 'mem-13')!
  const membresiaInvalida = membresiasDunningMock.find((m) => m.id === 'mem-15')!
  const morosoValido = {
    socio: socioValido,
    membresia: membresiaValida,
    montoDebido: 80,
    diasVencido: 0,
    telefono: socioValido.telefono,
  }
  const morosoInvalido = {
    socio: socioInvalido,
    membresia: membresiaInvalida,
    montoDebido: 55,
    diasVencido: 12,
    telefono: socioInvalido.telefono,
  }
  return renderToStaticMarkup(
    <ColumnaDunning
      etapa="d0"
      deuda={135}
      morosos={[morosoValido, morosoInvalido]}
      gestionados={new Set<string>()}
      onWhatsapp={() => undefined}
      nombreGym="Marsmode Fitness"
      {...props}
    />,
  ).replace(/<!--[^>]*-->/g, '')
}

describe('ColumnaDunning — cards de morosos', () => {
  const html = renderColumna()

  it('muestra título de etapa, contador y deuda', () => {
    expect(html).toContain('Venció hoy')
    expect(html).toContain('WhatsApp con link de pago')
    expect(html).toContain('S/ 135.00')
  })

  it('renderiza los nombres de los morosos con monto en rojo', () => {
    expect(html).toContain('Fiorella Mendívil Anaya')
    expect(html).toContain('S/ 80.00')
    expect(html).toContain('S/ 55.00')
  })

  it('deshabilita WhatsApp cuando el teléfono es inválido', () => {
    expect(html).toContain('aria-disabled="true"')
    expect(html).toContain('pointer-events-none opacity-50')
  })

  it('con moroso gestionado hoy muestra el badge de confirmación', () => {
    const gestionado = renderColumna({
      gestionados: new Set(['mem-13']),
    })
    expect(gestionado).toContain('Gestionado hoy')
    expect(gestionado).toContain('opacity-60')
  })

  it('columna vacía muestra estado vacío', () => {
    const vacia = renderColumna({ morosos: [], deuda: 0 })
    expect(vacia).toContain('Sin socios en esta etapa')
  })
})
