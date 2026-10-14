import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ComponentProps } from 'react'
import PosPage from '../PosPage'
import { agotarse, productosMock, ventasMock } from '@/mocks/pos'

type Props = ComponentProps<typeof PosPage>

function render(props: Props = {}): string {
  return renderToStaticMarkup(<PosPage {...props} />).replace(/<!--[^>]*-->/g, '')
}

function contar(aguja: string, html: string): number {
  return html.split(aguja).length - 1
}

describe('PosPage — encabezado y KPIs', () => {
  const html = render()

  it('título "Tienda" con subtítulo de punto de venta y stock', () => {
    expect(html).toContain('Tienda')
    expect(html).toContain('Punto de venta y control de stock')
  })

  it('KPI "Ventas hoy" = suma de los totales de las ventas seed (S/ 358.50)', () => {
    const esperado = ventasMock.reduce((suma, venta) => suma + venta.total, 0)
    expect(html).toContain('Ventas hoy')
    expect(html).toContain(`>S/ ${esperado.toFixed(2)}<`)
  })

  it('KPI "Transacciones hoy" = 5 ventas seed', () => {
    expect(html).toContain('Transacciones hoy')
    expect(html).toContain(`>${ventasMock.length}<`)
  })

  it('KPI "Productos bajo stock" = 2 según agotarse()', () => {
    const esperado = productosMock.filter(agotarse).length
    expect(esperado).toBe(2)
    expect(html).toContain('Productos bajo stock')
    expect(html).toContain(`>${esperado}<`)
  })

  it('KPI "Valor inventario" = Σ precio × stock con formato soles', () => {
    const esperado = productosMock.reduce(
      (suma, producto) => suma + producto.precio * producto.stock,
      0,
    )
    expect(html).toContain('Valor inventario')
    expect(html).toContain(`>S/ ${esperado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<`)
  })
})

describe('PosPage — catálogo', () => {
  const html = render()

  it('renderiza una tarjeta por cada producto del mock (10)', () => {
    for (const producto of productosMock) {
      expect(html).toContain(producto.nombre)
    }
    expect(contar('Añadir ', html)).toBe(productosMock.length)
  })

  it('badge rojo "Agotado" en el producto con stock 0 y su botón + deshabilitado', () => {
    expect(html).toContain('>Agotado</span>')
    const deshabilitados = contar('disabled=""', html)
    expect(deshabilitados).toBe(2)
  })

  it('badge rojo "Bajo stock" cuando stock ≤ minStock', () => {
    const bajos = productosMock.filter(
      (producto) => producto.stock > 0 && agotarse(producto),
    )
    expect(bajos.length).toBeGreaterThan(0)
    for (const producto of bajos) {
      expect(html).toContain(`Bajo stock · ${producto.stock}`)
    }
  })

  it('badge emerald "N en stock" en el resto del catálogo', () => {
    const normales = productosMock.filter((producto) => !agotarse(producto))
    for (const producto of normales) {
      expect(html).toContain(`>${producto.stock} en stock</span>`)
    }
  })

  it('categorías como badge en español y precios con formato soles', () => {
    expect(html).toContain('Suplementos')
    expect(html).toContain('Bebidas')
    expect(html).toContain('Accesorios')
    expect(html).toContain('Ropa')
    expect(html).toContain('S/ 189.00')
    expect(html).toContain('S/ 2.50')
  })
})

describe('PosPage — carrito con prop inicial', () => {
  const html = render({
    carritoInicial: [
      {
        productoId: 'prod-10',
        nombre: 'Shaker 700 ml',
        cantidad: 2,
        precioUnitario: 18,
      },
    ],
  })

  it('renderiza la línea del carrito con cantidad y subtotal', () => {
    expect(html).toContain('Shaker 700 ml')
    expect(html).toContain('>2<')
    expect(html).toContain('S/ 36.00')
  })

  it('muestra stepper, quitar, selector de socio, método y botón cobrar habilitado', () => {
    expect(html).toContain('Quitar una unidad de Shaker 700 ml')
    expect(html).toContain('Asociar a socio')
    expect(html).toContain('Método de pago')
    expect(html).toContain('Cobrar venta')
    expect(html).not.toContain('Sin productos en el carrito')
  })
})

describe('PosPage — últimas ventas', () => {
  const html = render()

  it('lista las 5 ventas seed con hora y resumen de líneas', () => {
    expect(html).toContain('Últimas ventas')
    expect(html).toContain('09:15')
    expect(html).toContain('12:10')
    expect(html).toContain('2× Barra proteica')
    expect(html).toContain('1× Proteína Whey 2 lb')
    expect(contar('× ', html)).toBeGreaterThanOrEqual(7)
  })

  it('métodos de pago como badges estilo caja', () => {
    expect(html).toContain('Efectivo')
    expect(html).toContain('Yape')
    expect(html).toContain('Plin')
  })

  it('carrito vacío por defecto muestra el mensaje de estado vacío', () => {
    expect(html).toContain('Sin productos en el carrito')
  })
})
