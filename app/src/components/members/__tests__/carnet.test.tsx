import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CarnetSocio, TarjetaCarnet, contenidoQr } from '../CarnetSocio'
import { membresiaDeSocio, planDeSocio } from '@/components/checkin/membresia-ui'
import { planesMock, sociosMock } from '@/mocks/data'
import type { Membresia } from '@/mocks/types'

function isoEn(diasDesdeHoy: number): string {
  const fecha = new Date()
  fecha.setHours(0, 0, 0, 0)
  fecha.setDate(fecha.getDate() + diasDesdeHoy)
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

const socio = sociosMock[0]
const plan = planDeSocio(socio.id) ?? planesMock[0]

function membresiaCon(fechaFin: string): Membresia {
  return {
    id: 'mem-test',
    socioId: socio.id,
    planId: 'plan-mensual',
    fechaInicio: isoEn(-27),
    fechaFin,
    monto: 80,
    estado: 'vigente',
  }
}

describe('contenidoQr (payload legible por el futuro escáner)', () => {
  it('serializa JSON compacto con codigo, dni y vence', () => {
    expect(contenidoQr(socio, '2026-10-01')).toBe(
      '{"codigo":"MS-001","dni":"45782136","vence":"2026-10-01"}',
    )
  })

  it('sin membresía: vence va vacío', () => {
    expect(contenidoQr(socio, '')).toBe(
      '{"codigo":"MS-001","dni":"45782136","vence":""}',
    )
  })
})

describe('TarjetaCarnet — datos vía join socio→membresía→plan', () => {
  const html = renderToStaticMarkup(
    <TarjetaCarnet socio={socio} membresia={membresiaDeSocio(socio.id)} plan={plan} />,
  )

  it('muestra nombre, DNI y código MS-### del socio', () => {
    expect(html).toContain('Rosa Ñahui Quispe')
    expect(html).toContain('45782136')
    expect(html).toContain('MS-001')
  })

  it('resuelve plan y precio con formato S/', () => {
    expect(html).toContain('Mensual')
    expect(html).toContain('S/ 80.00')
  })

  it('renderiza el QR identificado con el código del socio', () => {
    expect(html).toContain('<svg')
    expect(html).toContain('<title>Carné MS-001</title>')
  })

  it('incluye la instrucción de recepción', () => {
    expect(html).toContain('Muestra este código en recepción')
  })

  it('socio sin membresía: sin badge y con guiones', () => {
    const vacio = renderToStaticMarkup(
      <TarjetaCarnet socio={socio} membresia={undefined} plan={undefined} />,
    )
    expect(vacio).not.toContain('bg-emerald-500/15')
    expect(vacio).not.toContain('S/')
  })
})

describe('TarjetaCarnet — badge de vencimiento según días restantes', () => {
  it('vencida → badge rojo', () => {
    const html = renderToStaticMarkup(
      <TarjetaCarnet socio={socio} membresia={membresiaCon(isoEn(-3))} plan={plan} />,
    )
    expect(html).toContain('bg-red-500/15')
  })

  it('vence hoy → badge rojo', () => {
    const html = renderToStaticMarkup(
      <TarjetaCarnet socio={socio} membresia={membresiaCon(isoEn(0))} plan={plan} />,
    )
    expect(html).toContain('bg-red-500/15')
    expect(html).toContain('Vence hoy')
  })

  it('3 días → badge ámbar (por vencer)', () => {
    const html = renderToStaticMarkup(
      <TarjetaCarnet socio={socio} membresia={membresiaCon(isoEn(3))} plan={plan} />,
    )
    expect(html).toContain('bg-amber-500/15')
  })

  it('20 días → badge verde (vigente)', () => {
    const html = renderToStaticMarkup(
      <TarjetaCarnet socio={socio} membresia={membresiaCon(isoEn(20))} plan={plan} />,
    )
    expect(html).toContain('bg-emerald-500/15')
  })
})

describe('CarnetSocio (Sheet contenedor)', () => {
  it('cerrado no renderiza nada', () => {
    const html = renderToStaticMarkup(
      <CarnetSocio open={false} onOpenChange={() => {}} socio={socio} />,
    )
    expect(html).not.toContain('MS-001')
    expect(html).not.toContain('Carné del socio')
  })
})
