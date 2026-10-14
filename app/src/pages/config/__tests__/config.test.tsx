import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ConfigPage from '../ConfigPage'
import { EquipoPlaceholder } from '@/components/config/EquipoPlaceholder'
import { GimnasioForm } from '@/components/config/GimnasioForm'
import { MetodosPago } from '@/components/config/MetodosPago'
import { NotificacionesForm } from '@/components/config/NotificacionesForm'

describe('ConfigPage — estructura', () => {
  const html = renderToStaticMarkup(<ConfigPage />)

  it('título en español con las tres secciones (sin tab Equipo)', () => {
    expect(html).toContain('Configuración')
    expect(html).toContain('Gimnasio')
    expect(html).toContain('Cobros')
    expect(html).toContain('Notificaciones')
    expect(html).not.toContain('value="equipo"')
  })

  it('la pestaña inicial es Gimnasio (formulario visible, resto montado bajo demanda)', () => {
    expect(html).toContain('Datos del gimnasio')
    expect(html).not.toContain('Métodos de pago')
    expect(html).not.toContain('Notificaciones automáticas')
  })
})

describe('GimnasioForm', () => {
  const html = renderToStaticMarkup(<GimnasioForm />)

  it('campos: nombre, RUC a 11 dígitos, dirección y teléfono', () => {
    expect(html).toContain('Nombre del gimnasio')
    expect(html).toContain('RUC')
    expect(html).toContain('maxLength="11"')
    expect(html).toContain('Dirección')
    expect(html).toContain('Teléfono')
  })

  it('logo placeholder con la inicial del nombre', () => {
    expect(html).toContain('>M<')
  })

  it('no muestra feedback de guardado antes de guardar', () => {
    expect(html).not.toContain('Cambios guardados')
  })
})

describe('MetodosPago', () => {
  const html = renderToStaticMarkup(<MetodosPago />)

  it('muestra los cuatro métodos de pago peruanos', () => {
    expect(html).toContain('Efectivo')
    expect(html).toContain('Yape')
    expect(html).toContain('Plin')
    expect(html).toContain('Tarjeta')
  })

  it('Efectivo, Yape y Plin activos por defecto (3 switches marcados)', () => {
    const marcados = html.match(/data-state="checked"/g) ?? []
    expect(marcados.length / 2).toBe(3)
  })

  it('Tarjeta apagada no muestra badge "Próximamente" hasta habilitarla', () => {
    expect(html).not.toContain('Próximamente')
  })

  it('Yape y Plin activos muestran su campo de cuenta', () => {
    expect(html).toContain('Número Yape')
    expect(html).toContain('Número o cuenta Plin')
  })

  it('umbral de "por vencer" con 7 días por defecto', () => {
    expect(html).toContain('value="7"')
    expect(html).toContain('días antes del vencimiento')
  })

  it('CulqiLink: campo vacío al montar (sin prefill de mock) y ayuda visible', () => {
    expect(html).toContain('Link de pago (CulqiLink)')
    expect(html).toContain(
      'Créalo gratis en tu panel de Culqi y pégalo aquí. Acepta Yape, Plin y tarjetas.',
    )
    expect(html).toContain('value=""')
    expect(html).not.toContain('DEMOMARS01')
    expect(html).not.toContain('Debe ser una URL válida')
  })
})

describe('NotificacionesForm', () => {
  const html = renderToStaticMarkup(<NotificacionesForm />)

  it('muestra los tres avisos', () => {
    expect(html).toContain('Recordatorio de vencimiento')
    expect(html).toContain('Aviso a socios morosos')
    expect(html).toContain('Resumen diario')
  })

  it('solo el aviso a morosos arranca activado', () => {
    const marcados = html.match(/data-state="checked"/g) ?? []
    expect(marcados.length / 2).toBe(1)
  })
})

describe('EquipoPlaceholder', () => {
  const html = renderToStaticMarkup(<EquipoPlaceholder />)

  it('explica que se activa con la cuenta', () => {
    expect(html).toContain(
      'Gestiona los accesos de tu equipo — disponible al activar tu cuenta',
    )
  })

  it('card deshabilitada con botón de invitación inactivo', () => {
    expect(html).toContain('Recepcionistas y entrenadores')
    expect(html).toContain('disabled')
  })
})
