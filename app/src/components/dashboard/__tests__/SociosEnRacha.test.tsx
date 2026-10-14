import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SociosEnRacha } from '../SociosEnRacha'
import { asistenciasMock } from '@/mocks/asistencias'
import type { Asistencia } from '@/mocks/asistencias'
import { sociosMock } from '@/mocks/data'

function render(asistencias: readonly Asistencia[] = asistenciasMock): string {
  return renderToStaticMarkup(<SociosEnRacha asistencias={asistencias} />).replace(
    /<!--[^>]*-->/g,
    '',
  )
}

describe('SociosEnRacha — panel espejo positivo de SociosEnRiesgo', () => {
  it('con los mocks reales muestra el título y 3 socios con racha activa', () => {
    const html = render()
    expect(html).toContain('Socios en racha')
    expect((html.match(/<li(?![a-zA-Z])/g) ?? []).length).toBe(3)
    expect(html).toContain('días seguidos')
  })

  it('muestra a socios con racha viva de los mocks', () => {
    const html = render()
    expect(html).toContain('Jorge Luis Ccahuana Ríos')
    expect(html).toContain('María Gracia Belaúnde')
  })

  it('sin asistencias: empty state y ninguna fila', () => {
    const html = render([])
    expect(html).toContain('Sin rachas registradas aún.')
    expect((html.match(/<li(?![a-zA-Z])/g) ?? []).length).toBe(0)
  })

  it('usa el sociosMap recibido (backend), no sociosMock', () => {
    const socioReal = {
      ...sociosMock[0]!,
      id: 'soc-backend-1',
      nombre: 'Socio De Backend Uno',
    }
    const sociosMap = new Map([[socioReal.id, socioReal]])
    const hoy = new Date()
    const ayer = new Date(hoy)
    ayer.setDate(ayer.getDate() - 1)
    const aIso = (fecha: Date): string =>
      `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
    const asistencias: readonly Asistencia[] = [
      { socioId: socioReal.id, fecha: aIso(hoy) },
      { socioId: socioReal.id, fecha: aIso(ayer) },
    ]
    const html = renderToStaticMarkup(
      <SociosEnRacha asistencias={asistencias} sociosMap={sociosMap} />,
    ).replace(/<!--[^>]*-->/g, '')
    expect(html).toContain('Socio De Backend Uno')
    expect(html).toContain('2 días seguidos')
    // No filtra a ningún socio de sociosMock en modo backend.
    for (const socio of sociosMock) {
      if (socio.id !== sociosMock[0]?.id) {
        expect(html).not.toContain(socio.nombre)
      }
    }
  })

  it('socios del backend sin registro en el mapa: ninguna fila', () => {
    const hoy = new Date()
    const aIso = (fecha: Date): string =>
      `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
    const asistencias: readonly Asistencia[] = [
      { socioId: 'soc-desconocido', fecha: aIso(hoy) },
    ]
    const html = renderToStaticMarkup(
      <SociosEnRacha asistencias={asistencias} sociosMap={new Map()} />,
    ).replace(/<!--[^>]*-->/g, '')
    expect((html.match(/<li(?![a-zA-Z])/g) ?? []).length).toBe(0)
    expect(html).toContain('Sin rachas registradas aún.')
  })
})
