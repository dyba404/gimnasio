export { formatoSoles } from '@/lib/format'
export { sociosMock } from '@/mocks/data'
export type { Socio } from '@/mocks/types'

export type ConceptoCobro = 'membresia' | 'inscripcion' | 'producto'

export type MetodoPago = 'efectivo' | 'yape' | 'plin'

export type ResultadoIngreso = 'aceptado' | 'cobrado' | 'denegado' | 'legado'

export type Ingreso = {
  id: string
  hora: string
  socioNombre: string
  socioCodigo: string
  resultado: ResultadoIngreso
  motivo?: string
}

export type MovimientoCaja = {
  id: string
  hora: string
  socioNombre: string
  concepto: ConceptoCobro
  metodo: MetodoPago
  monto: number
}

export function horaAhora(): string {
  return new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

let contadorId = 0

export function nuevoId(): string {
  contadorId += 1
  return `id-${Date.now()}-${contadorId}`
}

export const ingresosIniciales: readonly Ingreso[] = [
  {
    id: 'i-seed-4',
    hora: '09:10',
    socioNombre: 'Álvaro Nunura Sifuentes',
    socioCodigo: 'MS-012',
    resultado: 'denegado',
  },
  {
    id: 'i-seed-3',
    hora: '08:42',
    socioNombre: 'Jorge Luis Ccahuana Ríos',
    socioCodigo: 'MS-002',
    resultado: 'aceptado',
  },
  {
    id: 'i-seed-2',
    hora: '08:30',
    socioNombre: 'Kevin Rodrigo Muñoz',
    socioCodigo: 'MS-004',
    resultado: 'cobrado',
  },
  {
    id: 'i-seed-1',
    hora: '07:15',
    socioNombre: 'Rosa Ñahui Quispe',
    socioCodigo: 'MS-001',
    resultado: 'aceptado',
  },
]

export const movimientosIniciales: readonly MovimientoCaja[] = [
  {
    id: 'm-seed-3',
    hora: '08:32',
    socioNombre: 'Kevin Rodrigo Muñoz',
    concepto: 'membresia',
    metodo: 'efectivo',
    monto: 55,
  },
  {
    id: 'm-seed-2',
    hora: '08:10',
    socioNombre: 'Ana Sofía Rojas Paredes',
    concepto: 'membresia',
    metodo: 'yape',
    monto: 80,
  },
  {
    id: 'm-seed-1',
    hora: '07:18',
    socioNombre: 'Rosa Ñahui Quispe',
    concepto: 'producto',
    metodo: 'efectivo',
    monto: 12.5,
  },
]

export const precioInscripcion = 30

export const etiquetaConcepto: Record<ConceptoCobro, string> = {
  membresia: 'Membresía',
  inscripcion: 'Inscripción',
  producto: 'Producto',
}

export const etiquetaMetodo: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  yape: 'Yape',
  plin: 'Plin',
}
