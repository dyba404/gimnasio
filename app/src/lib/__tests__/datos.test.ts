import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  filaAGasto,
  filaAMembresia,
  filaAMovimientoCaja,
  filaAPago,
  filaAPlan,
  filaAProducto,
  filaAVenta,
  siguienteCodigoSocio,
} from '@/lib/datos'

describe('siguienteCodigoSocio', () => {
  it('MS-016 tras 15 socios', () => {
    const codigos = Array.from({ length: 15 }, (_, i) => `MS-${String(i + 1).padStart(3, '0')}`)
    expect(siguienteCodigoSocio(codigos)).toBe('MS-016')
  })

  it('MS-001 con lista vacía', () => {
    expect(siguienteCodigoSocio([])).toBe('MS-001')
  })

  it('detecta el máximo aunque la lista venga desordenada', () => {
    expect(siguienteCodigoSocio(['MS-004', 'MS-021', 'MS-017'])).toBe('MS-022')
  })

  it('ignora códigos con formato distinto a MS-NNN', () => {
    expect(siguienteCodigoSocio(['MS-005', 'SOC-100', 'inv-01', ''])).toBe('MS-006')
  })

  it('no rellena huecos: MS-003 y MS-010 → MS-011', () => {
    expect(siguienteCodigoSocio(['MS-003', 'MS-010'])).toBe('MS-011')
  })

  it('convierte números sin padding: MS-9 → MS-010', () => {
    expect(siguienteCodigoSocio(['MS-9'])).toBe('MS-010')
  })
})

describe('filaAPlan', () => {
  it('mapea columnas snake_case a Plan', () => {
    expect(
      filaAPlan({ id: 'p1', nombre: 'Mensual', precio: 80, duracion_dias: 30 }),
    ).toEqual({ id: 'p1', nombre: 'Mensual', precio: 80, duracionDias: 30 })
  })

  it('preserva precios decimales', () => {
    expect(filaAPlan({ id: 'p2', nombre: 'Estudiante', precio: 55.5, duracion_dias: 30 }).precio).toBe(55.5)
  })
})

describe('filaAMembresia', () => {
  it('mapea una membresía sin congelamiento', () => {
    const fila = {
      id: 'm1',
      socio_id: 's1',
      plan_id: 'p1',
      fecha_inicio: '2026-08-01',
      fecha_fin: '2026-08-31',
      monto: 80,
      estado: 'vigente',
      congelada_desde: null,
      congelada_hasta: null,
    }
    const membresia = filaAMembresia(fila)
    expect(membresia.socioId).toBe('s1')
    expect(membresia.planId).toBe('p1')
    expect(membresia.fechaFin).toBe('2026-08-31')
    expect(membresia.estado).toBe('vigente')
    expect(membresia.congelada).toBeUndefined()
  })

  it('mapea el congelamiento a { desde, hasta }', () => {
    const fila = {
      id: 'm2',
      socio_id: 's2',
      plan_id: 'p2',
      fecha_inicio: '2026-08-01',
      fecha_fin: '2026-09-30',
      monto: 210,
      estado: 'vigente',
      congelada_desde: '2026-09-01',
      congelada_hasta: '2026-09-15',
    }
    expect(filaAMembresia(fila).congelada).toEqual({
      desde: '2026-09-01',
      hasta: '2026-09-15',
    })
  })
})

describe('filaAMovimientoCaja', () => {
  it('mapea socio_nombre → socioNombre y conserva monto decimal', () => {
    const movimiento = filaAMovimientoCaja({
      id: 'mv1',
      hora: '08:30',
      socio_nombre: 'Rosa Ñahui',
      concepto: 'membresia',
      metodo: 'yape',
      monto: 12.5,
    })
    expect(movimiento.socioNombre).toBe('Rosa Ñahui')
    expect(movimiento.monto).toBe(12.5)
    expect(movimiento.metodo).toBe('yape')
    expect(movimiento.concepto).toBe('membresia')
  })
})

describe('filaAPago', () => {
  it('aplanan el socio y el plan embebidos', () => {
    const pago = filaAPago({
      id: 'pg1',
      fecha: '2026-09-10',
      socio_id: 's1',
      plan_id: 'p1',
      monto: 80,
      metodo: 'efectivo',
      estado: 'completado',
      concepto: 'membresia',
      socios: { nombre: 'Rosa Ñahui Quispe', codigo: 'MS-001', dni: '45782136' },
      planes: { nombre: 'Mensual' },
    })
    expect(pago.nombre).toBe('Rosa Ñahui Quispe')
    expect(pago.codigo).toBe('MS-001')
    expect(pago.dni).toBe('45782136')
    expect(pago.planNombre).toBe('Mensual')
    expect(pago.socioId).toBe('s1')
    expect(pago.planId).toBe('p1')
    expect(pago.monto).toBe(80)
  })
})

describe('filaAProducto', () => {
  it('mapea min_stock → minStock', () => {
    const producto = filaAProducto({
      id: 'pr1',
      sku: 'SUP-001',
      nombre: 'Proteína Whey 2 lb',
      precio: 189,
      stock: 8,
      min_stock: 3,
      categoria: 'suplementos',
    })
    expect(producto.minStock).toBe(3)
    expect(producto.categoria).toBe('suplementos')
    expect(producto.precio).toBe(189)
  })
})

describe('filaAVenta', () => {
  it('socio null → socioId ausente', () => {
    const lineas = [{ productoId: 'pr1', nombre: 'Barra', cantidad: 2, precioUnitario: 8 }]
    const venta = filaAVenta({
      id: 'v1',
      socio_id: null,
      fecha: '2026-09-10',
      hora: '09:15',
      lineas,
      total: 16,
      metodo: 'efectivo',
    })
    expect(venta.socioId).toBeUndefined()
    expect(venta.lineas).toEqual(lineas)
    expect(venta.total).toBe(16)
  })

  it('socio presente → socioId con uuid', () => {
    const venta = filaAVenta({
      id: 'v2',
      socio_id: 's1',
      fecha: '2026-09-10',
      hora: '10:05',
      lineas: [],
      total: 189,
      metodo: 'yape',
    })
    expect(venta.socioId).toBe('s1')
    expect(venta.total).toBe(189)
  })
})

describe('filaAGasto', () => {
  it('mapea categoria al enum del formulario', () => {
    const gasto = filaAGasto({
      id: 'g1',
      categoria: 'equipamiento',
      descripcion: 'Mantenimiento',
      proveedor: 'Fitness Service',
      monto: 350,
      fecha: '2026-09-01',
    })
    expect(gasto.categoria).toBe('equipamiento')
    expect(gasto.monto).toBe(350)
  })
})

describe('registrarCobroMembresia', () => {
  const desdeMock = vi.fn()
  const clienteMock = {
    from: desdeMock,
  } as unknown as Parameters<typeof vi.mock>[1] extends never ? never : object

  function stubCliente(opciones: {
    gyms?: { id: string }[] | null
    errorEnInsert?: (tabla: string) => boolean
  }) {
    desdeMock.mockReset()
    desdeMock.mockImplementation((tabla: string) => {
      if (tabla === 'gyms') {
        return {
          select: () => ({
            limit: () =>
              Promise.resolve({
                data: opciones.gyms ?? null,
                error: null,
              }),
          }),
        }
      }
      const insertar = (carga: unknown) =>
        Promise.resolve(
          opciones.errorEnInsert?.(tabla)
            ? { data: null, error: new Error(`fallo insertando en ${tabla}`) }
            : { data: null, error: null, carga },
        )
      const actualizar = (carga: unknown) => ({
        eq: () =>
          Promise.resolve(
            opciones.errorEnInsert?.(tabla)
            ? { data: null, error: new Error(`fallo actualizando ${tabla}`) }
              : { data: null, error: null, carga },
          ),
      })
      return { insert: insertar, update: actualizar }
    })
    vi.doMock('@/lib/supabase', () => ({
      clienteSupabase: () => clienteMock,
      supabaseDisponible: () => true,
    }))
  }

  const entrada = {
    socioId: 'soc-04',
    socioNombre: 'Kevin Rodrigo Muñoz',
    planId: 'plan-student',
    membresiaId: 'mem-04',
    fechaFin: '2026-10-13',
    monto: 55,
    metodo: 'efectivo',
    hora: '10:30',
    estadoSocio: 'moroso',
  }

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(async () => {
    vi.doUnmock('@/lib/supabase')
    await vi.resetModules()
  })

  it('false sin cliente Supabase (modo demo): nada que persistir', async () => {
    vi.doMock('@/lib/supabase', () => ({
      clienteSupabase: () => null,
      supabaseDisponible: () => false,
    }))
    const { registrarCobroMembresia } = await import('@/lib/datos')
    const ok = await registrarCobroMembresia(entrada)
    expect(ok).toBe(false)
  })

  it('persiste pago, caja, renovación de membresía y reactivación del socio', async () => {
    stubCliente({ gyms: [{ id: 'gym-1' }] })
    const { registrarCobroMembresia } = await import('@/lib/datos')

    const ok = await registrarCobroMembresia(entrada)

    expect(ok).toBe(true)
    const tablas = desdeMock.mock.calls.map((llamada) => llamada[0])
    expect(tablas).toContain('pagos')
    expect(tablas).toContain('movimientos_caja')
    expect(tablas).toContain('membresias')
    expect(tablas).toContain('socios')
  })

  it('falla si el pago no se persiste y no toca membresías ni socios', async () => {
    stubCliente({
      gyms: [{ id: 'gym-1' }],
      errorEnInsert: (tabla) => tabla === 'pagos',
    })
    const { registrarCobroMembresia } = await import('@/lib/datos')

    const ok = await registrarCobroMembresia(entrada)

    expect(ok).toBe(false)
    const tablas = desdeMock.mock.calls.map((llamada) => llamada[0])
    expect(tablas).toContain('pagos')
    expect(tablas).not.toContain('membresias')
    expect(tablas).not.toContain('socios')
  })
})
