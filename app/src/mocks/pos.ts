import type { MetodoPago, MovimientoCaja } from '@/mocks/caja-data'
import { sociosMock } from '@/mocks/data'

export type CategoriaProducto = 'suplementos' | 'bebidas' | 'accesorios' | 'ropa'

export type Producto = {
  id: string
  sku: string
  nombre: string
  precio: number
  stock: number
  minStock: number
  categoria: CategoriaProducto
}

export type LineaVenta = {
  productoId: string
  nombre: string
  cantidad: number
  precioUnitario: number
}

export type Venta = {
  id: string
  fecha: string
  hora: string
  socioId?: string
  lineas: readonly LineaVenta[]
  total: number
  metodo: MetodoPago
}

export const etiquetaCategoria: Record<CategoriaProducto, string> = {
  suplementos: 'Suplementos',
  bebidas: 'Bebidas',
  accesorios: 'Accesorios',
  ropa: 'Ropa',
}

export function fechaHoyIso(): string {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}

export function hayStock(producto: Producto, cantidad: number): boolean {
  return producto.stock >= cantidad
}

export function agotarse(producto: Producto): boolean {
  return producto.stock <= producto.minStock
}

export function totalVenta(lineas: readonly LineaVenta[]): number {
  return lineas.reduce(
    (suma, linea) => suma + linea.cantidad * linea.precioUnitario,
    0,
  )
}

export function descontarStock(
  productos: readonly Producto[],
  venta: Venta,
): readonly Producto[] {
  return productos.map((producto) => {
    const linea = venta.lineas.find((item) => item.productoId === producto.id)
    if (!linea) return producto
    return { ...producto, stock: producto.stock - linea.cantidad }
  })
}

export function ventaAMovimiento(venta: Venta): MovimientoCaja {
  const socio = venta.socioId
    ? sociosMock.find((item) => item.id === venta.socioId)
    : undefined
  return {
    id: `mov-${venta.id}`,
    hora: venta.hora,
    socioNombre: socio?.nombre ?? 'Cliente mostrador',
    concepto: 'producto',
    metodo: venta.metodo,
    monto: venta.total,
  }
}

export const productosMock: readonly Producto[] = [
  { id: 'prod-01', sku: 'SUP-001', nombre: 'Proteína Whey 2 lb', precio: 189, stock: 8, minStock: 3, categoria: 'suplementos' },
  { id: 'prod-02', sku: 'SUP-002', nombre: 'Creatina Monohidratada 300 g', precio: 95, stock: 4, minStock: 5, categoria: 'suplementos' },
  { id: 'prod-03', sku: 'SUP-003', nombre: 'Barra proteica', precio: 8, stock: 24, minStock: 10, categoria: 'suplementos' },
  { id: 'prod-04', sku: 'BEB-001', nombre: 'Agua San Mateo 625 ml', precio: 2.5, stock: 48, minStock: 24, categoria: 'bebidas' },
  { id: 'prod-05', sku: 'BEB-002', nombre: 'Gatorade 500 ml', precio: 6, stock: 18, minStock: 12, categoria: 'bebidas' },
  { id: 'prod-06', sku: 'ACC-001', nombre: 'Guantes de entrenamiento', precio: 35, stock: 6, minStock: 3, categoria: 'accesorios' },
  { id: 'prod-07', sku: 'ACC-002', nombre: 'Banda de resistencia', precio: 15, stock: 0, minStock: 4, categoria: 'accesorios' },
  { id: 'prod-08', sku: 'ACC-003', nombre: 'Toalla deportiva', precio: 20, stock: 10, minStock: 4, categoria: 'accesorios' },
  { id: 'prod-09', sku: 'ROP-001', nombre: 'Camiseta dry-fit', precio: 45, stock: 15, minStock: 5, categoria: 'ropa' },
  { id: 'prod-10', sku: 'ACC-004', nombre: 'Shaker 700 ml', precio: 18, stock: 14, minStock: 6, categoria: 'accesorios' },
]

type BorradorVenta = {
  id: string
  hora: string
  socioId?: string
  lineas: readonly LineaVenta[]
  metodo: MetodoPago
}

function ventaSemilla(borrador: BorradorVenta): Venta {
  return {
    ...borrador,
    fecha: fechaHoyIso(),
    total: totalVenta(borrador.lineas),
  }
}

const borradoresVentas: readonly BorradorVenta[] = [
  {
    id: 'venta-01',
    hora: '09:15',
    lineas: [
      { productoId: 'prod-03', nombre: 'Barra proteica', cantidad: 2, precioUnitario: 8 },
      { productoId: 'prod-04', nombre: 'Agua San Mateo 625 ml', cantidad: 1, precioUnitario: 2.5 },
    ],
    metodo: 'efectivo',
  },
  {
    id: 'venta-02',
    hora: '10:05',
    socioId: 'soc-05',
    lineas: [
      { productoId: 'prod-01', nombre: 'Proteína Whey 2 lb', cantidad: 1, precioUnitario: 189 },
    ],
    metodo: 'yape',
  },
  {
    id: 'venta-03',
    hora: '10:40',
    lineas: [
      { productoId: 'prod-06', nombre: 'Guantes de entrenamiento', cantidad: 1, precioUnitario: 35 },
      { productoId: 'prod-07', nombre: 'Banda de resistencia', cantidad: 1, precioUnitario: 15 },
    ],
    metodo: 'plin',
  },
  {
    id: 'venta-04',
    hora: '11:20',
    lineas: [
      { productoId: 'prod-05', nombre: 'Gatorade 500 ml', cantidad: 3, precioUnitario: 6 },
      { productoId: 'prod-10', nombre: 'Shaker 700 ml', cantidad: 1, precioUnitario: 18 },
    ],
    metodo: 'efectivo',
  },
  {
    id: 'venta-05',
    hora: '12:10',
    lineas: [
      { productoId: 'prod-09', nombre: 'Camiseta dry-fit', cantidad: 1, precioUnitario: 45 },
      { productoId: 'prod-08', nombre: 'Toalla deportiva', cantidad: 1, precioUnitario: 20 },
    ],
    metodo: 'yape',
  },
]

export const ventasMock: readonly Venta[] = borradoresVentas.map(ventaSemilla)

export function resumenLineas(lineas: readonly LineaVenta[]): string {
  return lineas
    .map((linea) => `${linea.cantidad}× ${linea.nombre}`)
    .join(', ')
}
