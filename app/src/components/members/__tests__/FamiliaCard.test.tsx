import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FamiliaCard } from '../FamiliaCard'
import { facturasMock } from '@/mocks/familias'
import { sociosMock, sumarDiasIso } from '@/mocks/data'
import type { CuentaFamiliar, FacturaGrupo } from '@/mocks/familias'
import type { Membresia } from '@/mocks/types'

const HOY = '2026-09-11'

function render(props: Partial<Parameters<typeof FamiliaCard>[0]>): string {
  return renderToStaticMarkup(
    <FamiliaCard socioId="soc-05" hoyIso={HOY} {...props} />,
  ).replace(/<!--[^>]*-->/g, '')
}

describe('FamiliaCard — socio sin familia', () => {
  it('no renderiza nada para un socio sin cuenta', () => {
    const html = renderToStaticMarkup(
      <FamiliaCard socioId="soc-07" hoyIso={HOY} />,
    )
    expect(html).toBe('')
  })
})

describe('FamiliaCard — head de familia vencida (fam-rojas)', () => {
  const html = render({ facturas: facturasMock })

  it('muestra el badge "Cuenta familiar · Head"', () => {
    expect(html).toContain('Cuenta familiar')
    expect(html).toContain('Head')
  })

  it('lista head y cónyuge con su parentesco', () => {
    expect(html).toContain('Ana Sofía Rojas Paredes')
    expect(html).toContain('Cónyuge')
  })

  it('muestra el estado de la membresía de cada miembro', () => {
    expect(html).toContain('Vencida')
  })

  it('muestra el banner ámbar de responsabilidad solidaria del head', () => {
    expect(html).toContain('Membresía de la cuenta vencida')
    expect(html).toMatch(
      /el cobro va a cargo de\s*<span class="font-medium">Ana Sofía Rojas Paredes<\/span>/,
    )
    expect(html).toContain('bg-amber-500/10')
  })

  it('muestra la factura agrupada con items, conceptos y total grande', () => {
    expect(html).toContain('Factura agrupada')
    expect(html).toContain('Membresía')
    expect(html).toContain('S/ 55.00')
    expect(html).toContain('S/ 80.00')
    expect(html).toContain('Total')
    expect(html).toContain('S/ 135.00')
    expect(html).toContain('text-lg font-semibold')
  })

  it('badge de estado de la factura abierta en ámbar', () => {
    expect(html).toContain('Abierta')
  })

  it('CTA WhatsApp al head con el total de la factura', () => {
    expect(html).toContain('wa.me/51933640715')
    expect(html).toContain('S/ 135.00')
  })
})

describe('FamiliaCard — miembro de familia (con badge de parentesco)', () => {
  const html = render({
    socioId: 'soc-01',
    facturas: facturasMock,
  })

  it('muestra el parentesco del socio consultado', () => {
    expect(html).toContain('Cuenta familiar')
    expect(html).toContain('Cónyuge')
  })

  it('familia vigente: sin banner ámbar de vencida', () => {
    expect(html).not.toContain('Membresía de la cuenta vencida')
  })

  it('muestra al head destacado del grupo', () => {
    expect(html).toContain('Jorge Luis Ccahuana Ríos')
    expect(html).toContain('bg-muted/60')
  })
})

describe('FamiliaCard — familia vencida con teléfono inválido', () => {
  it('CTA WhatsApp queda deshabilitado cuando el head no tiene teléfono válido', () => {
    const sociosConHeadRoto = sociosMock.map((socio) =>
      socio.id === 'soc-05' ? { ...socio, telefono: '933 640 71' } : socio,
    )
    const html = render({ facturas: facturasMock, socios: sociosConHeadRoto })
    expect(html).toContain('aria-disabled="true"')
    expect(html).not.toContain('wa.me/')
  })

  it('sin factura abierta no renderiza el bloque de factura aunque exista una cobrada', () => {
    const html = render({
      socioId: 'soc-03',
      facturas: [],
    })
    expect(html).not.toContain('Factura agrupada')
  })
})

describe('FamiliaCard — cuenta solo con factura cobrada', () => {
  it('no muestra bloque de factura (solo se cobran las abiertas)', () => {
    const html = render({
      socioId: 'soc-03',
      facturas: facturasMock,
    })
    expect(html).not.toContain('Factura agrupada')
    expect(html).not.toContain('wa.me/')
  })
})

describe('FamiliaCard — datos inyectados (aislamiento del mock global)', () => {
  it('refleja una familia vencida construida ad-hoc', () => {
    const cuenta: CuentaFamiliar = {
      id: 'fam-test',
      headSocioId: 'soc-01',
      miembros: [{ socioId: 'soc-02', parentesco: 'conyuge' }],
    }
    const membresias: readonly Membresia[] = [
      {
        id: 'mem-f1',
        socioId: 'soc-01',
        planId: 'plan-mensual',
        fechaInicio: sumarDiasIso(HOY, -30),
        fechaFin: sumarDiasIso(HOY, 10),
        monto: 80,
        estado: 'vigente',
      },
      {
        id: 'mem-f2',
        socioId: 'soc-02',
        planId: 'plan-trimestral',
        fechaInicio: sumarDiasIso(HOY, -95),
        fechaFin: sumarDiasIso(HOY, -5),
        monto: 210,
        estado: 'vencida',
      },
    ]
    const facturas: readonly FacturaGrupo[] = [
      {
        id: 'fac-t',
        cuentaId: 'fam-test',
        fecha: sumarDiasIso(HOY, -5),
        items: [
          { socioId: 'soc-01', concepto: 'membresia', monto: 80 },
          { socioId: 'soc-02', concepto: 'membresia', monto: 210 },
        ],
        estado: 'abierta',
      },
    ]
    const html = render({
      socioId: 'soc-01',
      familias: [cuenta],
      membresias,
      facturas,
    })
    expect(html).toContain('Membresía de la cuenta vencida')
    expect(html).toContain('Rosa Ñahui Quispe')
    expect(html).toContain('S/ 290.00')
  })
})
