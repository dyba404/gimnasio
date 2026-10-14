import { describe, expect, it } from 'vitest'
import { sociosMock } from '@/mocks/data'
import {
  agotarse,
  descontarStock,
  hayStock,
  productosMock,
  resumenLineas,
  totalVenta,
  ventaAMovimiento,
  ventasMock,
} from '../pos'
import type { LineaVenta, Producto, Venta } from '../pos'

const productoBase: Producto = {
  id: 'p1',
  sku: 'SKU-1',
  nombre: 'Producto base',
  precio: 10,
  stock: 5,
  minStock: 2,
  categoria: 'accesorios',
}

describe('hayStock', () => {
  it('true cuando el stock es exactamente la cantidad pedida', () => {
    expect(hayStock(productoBase, 5)).toBe(true)
  })

  it('false cuando la cantidad supera el stock', () => {
    expect(hayStock(productoBase, 6)).toBe(false)
  })

  it('false con stock 0 aunque se pida 1', () => {
    expect(hayStock({ ...productoBase, stock: 0 }, 1)).toBe(false)
  })

  it('true para cantidad 0 incluso sin stock (caso límite)', () => {
    expect(hayStock({ ...productoBase, stock: 0 }, 0)).toBe(true)
  })
})

describe('agotarse', () => {
  it('true en el límite exacto: stock igual a minStock', () => {
    expect(agotarse({ ...productoBase, stock: 2, minStock: 2 })).toBe(true)
  })

  it('false cuando el stock queda por encima del mínimo', () => {
    expect(agotarse({ ...productoBase, stock: 3, minStock: 2 })).toBe(false)
  })

  it('true con stock 0 (agotado total)', () => {
    expect(agotarse({ ...productoBase, stock: 0, minStock: 2 })).toBe(true)
  })
})

describe('totalVenta', () => {
  it('devuelve 0 con lista vacía', () => {
    expect(totalVenta([])).toBe(0)
  })

  it('suma cantidad × precioUnitario de varias líneas', () => {
    const lineas: readonly LineaVenta[] = [
      { productoId: 'p1', nombre: 'A', cantidad: 2, precioUnitario: 8 },
      { productoId: 'p2', nombre: 'B', cantidad: 3, precioUnitario: 2.5 },
    ]
    expect(totalVenta(lineas)).toBe(23.5)
  })
})

describe('descontarStock', () => {
  it('no muta el array original (inmutabilidad)', () => {
    const originales: readonly Producto[] = [
      productoBase,
      { ...productoBase, id: 'p2', sku: 'SKU-2', stock: 10 },
    ]
    const venta: Venta = {
      id: 'v1',
      fecha: '2026-09-11',
      hora: '10:00',
      lineas: [
        { productoId: 'p1', nombre: 'Producto base', cantidad: 2, precioUnitario: 10 },
      ],
      total: 20,
      metodo: 'efectivo',
    }
    const copia = [...originales]
    const resultado = descontarStock(originales, venta)
    expect(originales).toEqual(copia)
    expect(originales[0]?.stock).toBe(5)
    expect(resultado[0]?.stock).toBe(3)
    expect(originales[0]).not.toBe(resultado[0])
  })

  it('descuenta solo los productos presentes en la venta', () => {
    const originales: readonly Producto[] = [
      productoBase,
      { ...productoBase, id: 'p2', sku: 'SKU-2', stock: 10 },
    ]
    const venta: Venta = {
      id: 'v2',
      fecha: '2026-09-11',
      hora: '11:00',
      lineas: [
        { productoId: 'p2', nombre: 'Otro', cantidad: 4, precioUnitario: 10 },
      ],
      total: 40,
      metodo: 'yape',
    }
    const resultado = descontarStock(originales, venta)
    expect(resultado[0]?.stock).toBe(5)
    expect(resultado[1]?.stock).toBe(6)
  })
})

describe('ventaAMovimiento', () => {
  it('concepto producto, monto = total y método de la venta (walk-in)', () => {
    const venta: Venta = {
      id: 'v3',
      fecha: '2026-09-11',
      hora: '12:30',
      lineas: [
        { productoId: 'p1', nombre: 'A', cantidad: 1, precioUnitario: 35 },
      ],
      total: 35,
      metodo: 'plin',
    }
    const movimiento = ventaAMovimiento(venta)
    expect(movimiento.concepto).toBe('producto')
    expect(movimiento.monto).toBe(35)
    expect(movimiento.metodo).toBe('plin')
    expect(movimiento.socioNombre).toBe('Cliente mostrador')
    expect(movimiento.hora).toBe('12:30')
  })

  it('con socio resuelve el nombre real desde sociosMock', () => {
    const socio = sociosMock[0]
    if (!socio) throw new Error('sociosMock vacío')
    const venta: Venta = {
      id: 'v4',
      fecha: '2026-09-11',
      hora: '09:00',
      socioId: socio.id,
      lineas: [
        { productoId: 'p1', nombre: 'A', cantidad: 1, precioUnitario: 189 },
      ],
      total: 189,
      metodo: 'yape',
    }
    expect(ventaAMovimiento(venta).socioNombre).toBe(socio.nombre)
  })
})

describe('seeds del mock POS', () => {
  it('10 productos con precio positivo y exactamente 2 en agotarse', () => {
    expect(productosMock).toHaveLength(10)
    for (const producto of productosMock) {
      expect(producto.precio).toBeGreaterThan(0)
      expect(producto.minStock).toBeGreaterThan(0)
    }
    expect(productosMock.filter(agotarse)).toHaveLength(2)
  })

  it('las 4 categorías del catálogo están representadas', () => {
    const categorias = new Set(productosMock.map((producto) => producto.categoria))
    expect(categorias).toEqual(
      new Set(['suplementos', 'bebidas', 'accesorios', 'ropa']),
    )
  })

  it('5 ventas históricas: una con socio, resto walk-in, total S/ 358.50', () => {
    expect(ventasMock).toHaveLength(5)
    const conSocio = ventasMock.filter((venta) => venta.socioId !== undefined)
    expect(conSocio).toHaveLength(1)
    const total = ventasMock.reduce((suma, venta) => suma + venta.total, 0)
    expect(total).toBeCloseTo(358.5, 2)
    for (const venta of ventasMock) {
      expect(venta.total).toBe(totalVenta(venta.lineas))
    }
  })

  it('resumenLineas resume como "2× Nombre, 1× Otro"', () => {
    expect(
      resumenLineas([
        { productoId: 'p1', nombre: 'Barra proteica', cantidad: 2, precioUnitario: 8 },
        { productoId: 'p2', nombre: 'Agua', cantidad: 1, precioUnitario: 2.5 },
      ]),
    ).toBe('2× Barra proteica, 1× Agua')
  })
})
