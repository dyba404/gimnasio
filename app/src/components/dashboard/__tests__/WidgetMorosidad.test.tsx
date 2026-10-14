import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { WidgetMorosidad } from '../WidgetMorosidad'
import { membresiasMock, planesMock, sociosMock } from '@/mocks/data'
import type { Membresia, Plan, Socio } from '@/mocks/types'

const planesMap: ReadonlyMap<string, Plan> = new Map(planesMock.map((p) => [p.id, p]))
const sociosMap: ReadonlyMap<string, Socio> = new Map(sociosMock.map((s) => [s.id, s]))

function isoHace(dias: number): string {
  const fecha = new Date()
  fecha.setHours(0, 0, 0, 0)
  fecha.setDate(fecha.getDate() - dias)
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function vencida(id: string, socioId: string, planId: string, diasVencida: number): Membresia {
  const plan = planesMap.get(planId)
  return {
    id,
    socioId,
    planId,
    fechaInicio: isoHace(diasVencida + (plan?.duracionDias ?? 30)),
    fechaFin: isoHace(diasVencida),
    monto: plan?.precio ?? 0,
    estado: 'vencida',
  }
}

function render(membresias: readonly Membresia[]): string {
  const html = renderToStaticMarkup(
    <WidgetMorosidad membresias={membresias} socios={sociosMap} planes={planesMap} />,
  )
  // React 19 SSR inserta <!-- --> entre trozos de texto; se quitan para poder
  // assertion de frases completas.
  return html.replace(/<!--[^>]*-->/g, '')
}

function contarFilas(html: string): number {
  // Ojo: '<li' también casaba con <line> de los svg de lucide; exigir frontera de tag.
  return (html.match(/<li(?![a-zA-Z])/g) ?? []).length
}

describe('WidgetMorosidad — derivación sobre los mocks reales', () => {
  const html = render(membresiasMock)

  it('muestra exactamente las 3 membresías vencidas de los mocks, sin filas de más', () => {
    expect(contarFilas(html)).toBe(3)
  })

  it('ordena por monto debido desc y desempata por días vencidos desc', () => {
    // mem-12: mensual 80×1 (2 días) > mem-09: student 55×1 (15 días) > mem-04: student 55×1 (6 días)
    const alvaro = html.indexOf('Álvaro Nunura Sifuentes')
    const gabriela = html.indexOf('Gabriela Sánchez León')
    const kevin = html.indexOf('Kevin Rodrigo Muñoz')
    expect(alvaro).toBeGreaterThanOrEqual(0)
    expect(gabriela).toBeGreaterThan(alvaro)
    expect(kevin).toBeGreaterThan(gabriela)
  })

  it('total por cobrar = suma de montos (80 + 55 + 55 = 190) con formato canónico', () => {
    expect(html).toContain('S/ 190.00')
  })

  it('pluraliza correctamente "3 socios con deuda"', () => {
    expect(html).toContain('3 socios con deuda')
  })

  it('muestra los días vencidos correctos por socio', () => {
    expect(html).toContain('vencida hace 2 días')
    expect(html).toContain('vencida hace 15 días')
    expect(html).toContain('vencida hace 6 días')
  })

  it('no muestra deudas con "NaN" ni montos sin formatear', () => {
    expect(html).not.toContain('NaN')
  })
})

describe('WidgetMorosidad — casos borde', () => {
  it('0 morosos: empty state y total S/ 0.00', () => {
    const html = render(
      membresiasMock
        .filter((m) => m.estado !== 'vencida')
        .map((m) => ({ ...m, estado: 'vigente' as const })),
    )
    expect(html).toContain('Sin morosidad registrada. Todo al día.')
    expect(html).toContain('S/ 0.00')
    expect(html).toContain('0 socios con deuda')
    expect(contarFilas(html)).toBe(0)
  })

  it('1 moroso: singular "1 socio con deuda" y "1 día"', () => {
    const html = render([vencida('t1', 'soc-01', 'plan-mensual', 1)])
    expect(html).toContain('1 socio con deuda')
    expect(html).toContain('vencida hace 1 día')
    expect(contarFilas(html)).toBe(1)
  })

  it('nombre con ñ y acentos pasa intacto y las iniciales salen bien (CR)', () => {
    const html = render([vencida('t1', 'soc-07', 'plan-mensual', 4)])
    expect(html).toContain('Carmen Rosa Ñaupari')
    expect(html).toContain('CR')
    const html2 = render([vencida('t2', 'soc-01', 'plan-mensual', 4)])
    expect(html2).toContain('Rosa Ñahui Quispe')
    expect(html2).toContain('RÑ')
  })
})

describe('WidgetMorosidad — estimación monto = precio × ceil(días/30)', () => {
  const casos: readonly { dias: number; esperado: string }[] = [
    { dias: 1, esperado: 'S/ 80.00' }, // mensual 80 → 1 mes
    { dias: 29, esperado: 'S/ 80.00' }, // ceil(29/30)=1
    { dias: 30, esperado: 'S/ 80.00' }, // ceil(30/30)=1 (límite exacto)
    { dias: 31, esperado: 'S/ 160.00' }, // ceil(31/30)=2
    { dias: 60, esperado: 'S/ 160.00' }, // ceil(60/30)=2
    { dias: 61, esperado: 'S/ 240.00' }, // ceil(61/30)=3
  ]

  for (const { dias, esperado } of casos) {
    it(`${dias} días vencido → deuda ${esperado}`, () => {
      const html = render([vencida('t1', 'soc-02', 'plan-mensual', dias)])
      expect(html).toContain(esperado)
      // el total grande debe coincidir con el único badge de deuda
      expect(html.match(/S\/ \d[\d,]*\.\d{2}/g)).toHaveLength(2)
    })
  }

  it('socio "vencido hoy" (0 días) no rompe: cobra 1 mes, sin NaN', () => {
    const html = render([vencida('t1', 'soc-02', 'plan-mensual', 0)])
    expect(html).toContain('S/ 80.00')
    expect(html).not.toContain('NaN')
    expect(html).toContain('vencida hace 0 días')
  })
})

describe('WidgetMorosidad — orden por monto y recorte a top 5', () => {
  it('ordena por DINERO, no por antigüedad: vencida reciente cara va primero', () => {
    const vieja = vencida('t-vieja', 'soc-02', 'plan-mensual', 45) // 80×2=160
    const cara = vencida('t-cara', 'soc-03', 'plan-anual', 3) // 660×1=660
    const html = render([vieja, cara])
    expect(html.indexOf('María Gracia Belaúnde')).toBeLessThan(
      html.indexOf('Jorge Luis Ccahuana Ríos'),
    )
  })

  it('7 morosos → solo 5 filas, se recortan las 2 deudoras más chicas', () => {
    const morosas = [1, 2, 3, 4, 5, 6, 7].map((k) =>
      vencida(`t-${k}`, `soc-0${k}`, 'plan-mensual', k * 30), // 80×k soles
    )
    const html = render(morosas)
    expect(contarFilas(html)).toBe(5)
    // incluidas: k=3..7 (240..560) → soc-03 María Gracia sí, soc-02 Jorge Luis no (160)
    expect(html).toContain('María Gracia Belaúnde')
    expect(html).not.toContain('Jorge Luis Ccahuana Ríos')
    expect(html).not.toContain('Rosa Ñahui Quispe')
    // total 240+320+400+480+560 = 2000
    expect(html).toContain('S/ 2,000.00')
  })

  it('badge de monto por fila usa el monto debido, no el precio del plan', () => {
    const html = render([vencida('t1', 'soc-08', 'plan-anual', 400)]) // 660×ceil(400/30)=660×14=9240
    expect(html).toContain('S/ 9,240.00')
  })
})

describe('WidgetMorosidad — teléfono inválido deshabilita el botón de WhatsApp', () => {
  const socioSinTelefonoValido: Socio = {
    ...sociosMock[0],
    telefono: '99987654',
  }
  const sociosInvalidos: ReadonlyMap<string, Socio> = new Map([
    [socioSinTelefonoValido.id, socioSinTelefonoValido],
  ])

  function renderConSocioInvalido(): string {
    return renderToStaticMarkup(
      <WidgetMorosidad
        membresias={[vencida('t1', socioSinTelefonoValido.id, 'plan-mensual', 3)]}
        socios={sociosInvalidos}
        planes={planesMap}
      />,
    ).replace(/<!--[^>]*-->/g, '')
  }

  it('8 dígitos: el botón se renderiza aria-disabled sin enlace wa.me roto', () => {
    const html = renderConSocioInvalido()
    expect(html).toContain('aria-disabled="true"')
    expect(html).not.toContain('wa.me')
    expect(html).toContain('pointer-events-none')
  })

  it('con teléfono válido el mismo widget sí genera el enlace wa.me', () => {
    const html = render([vencida('t1', 'soc-04', 'plan-mensual', 3)])
    expect(html).toContain('href="https://wa.me/51999876543?text=')
    expect(html).not.toContain('aria-disabled="true"')
  })
})

describe('WidgetMorosidad — mensaje de cobranza sin link demo', () => {
  function mensajeDelEnlace(html: string): string {
    const texto = html.split('?text=')[1]?.split('"')[0] ?? ''
    return decodeURIComponent(texto)
  }

  it('sin backend el mensaje va SIN el link demo DEMOMARS01 ni yape hardcodeado', () => {
    const html = render([vencida('t1', 'soc-04', 'plan-mensual', 3)])
    const mensaje = mensajeDelEnlace(html)
    expect(mensaje).toContain('venció el')
    expect(mensaje).not.toContain('https://express.culqi.com/DEMOMARS01')
    expect(mensaje).not.toContain('Renueva aquí')
    // sin config cargada no debe inventar un número de Yape
    expect(mensaje).not.toContain('yapear al 9XX')
  })

  it('la fila muestra "—" mientras cargan las gestiones remotas (sin leer bitacoraMock)', () => {
    const html = render([vencida('t1', 'soc-04', 'plan-mensual', 3)])
    // soc-04 tiene 3 gestiones en bitacoraMock; el widget ya no debe asumirlas
    expect(html).not.toContain('3 gestiones')
    expect(html).not.toContain('gestión</span>')
    expect(html).not.toContain('gestiones</span>')
  })
})
