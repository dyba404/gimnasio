import { sociosMock, sumarDiasIso } from './data'
import type { Membresia, Socio } from './types'

export type DiaSemana = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom'

export type EstadoReserva = 'confirmada' | 'espera' | 'cancelada'

export type Clase = {
  id: string
  nombre: string
  instructor: string
  dias: readonly DiaSemana[]
  horaInicio: string
  duracionMin: number
  cupo: number
  esPrueba?: boolean
}

export type Reserva = {
  id: string
  claseId: string
  socioId: string
  fecha: string
  estado: EstadoReserva
  esPrueba?: boolean
}

export const MOTIVO_VENCIDA = 'Membresía vencida'
export const MOTIVO_PRUEBA_USADA = 'Ya reservaste clase de prueba'

export const SOCIO_ACTIVO_ID = 'soc-01'

const DIAS_SEMANA: readonly DiaSemana[] = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']

export const clasesMock: readonly Clase[] = [
  { id: 'cl-funcional', nombre: 'Funcional', instructor: 'Coach Bruno Salas', dias: ['lun', 'mie', 'vie', 'sab'], horaInicio: '06:00', duracionMin: 45, cupo: 12 },
  { id: 'cl-crossfit', nombre: 'CrossFit', instructor: 'Coach Marco Huamán', dias: ['lun', 'mar', 'mie', 'jue', 'vie'], horaInicio: '19:30', duracionMin: 60, cupo: 13 },
  { id: 'cl-spinning', nombre: 'Spinning', instructor: 'Profe Daniela Ríos', dias: ['mar', 'jue', 'sab', 'dom'], horaInicio: '18:30', duracionMin: 45, cupo: 20 },
  { id: 'cl-zumba', nombre: 'Zumba', instructor: 'Profe Valeria Campos', dias: ['lun', 'mie', 'vie'], horaInicio: '18:30', duracionMin: 60, cupo: 24, esPrueba: true },
  { id: 'cl-yoga', nombre: 'Yoga', instructor: 'Profe Lucía Paredes', dias: ['mar', 'jue', 'dom'], horaInicio: '19:30', duracionMin: 60, cupo: 12 },
  { id: 'cl-boxeo', nombre: 'Boxeo', instructor: 'Coach Renzo Quispe', dias: ['vie', 'sab', 'dom'], horaInicio: '19:30', duracionMin: 60, cupo: 13 },
]

export const invitadosMock: Readonly<Record<string, string>> = {
  'inv-01': 'Xiomara Chávez Ríos',
  'inv-02': 'Diego Alejandro Tuesta',
}

export function diaDeFecha(fechaIso: string): DiaSemana {
  const [anio, mes, dia] = fechaIso.split('-').map(Number)
  const fecha = new Date(anio, (mes ?? 1) - 1, dia ?? 1)
  return DIAS_SEMANA[fecha.getDay()] ?? 'lun'
}

export function confirmadasEn(
  reservas: readonly Reserva[],
  claseId: string,
  fechaIso: string,
): number {
  return reservas.filter(
    (reserva) =>
      reserva.claseId === claseId &&
      reserva.fecha === fechaIso &&
      reserva.estado === 'confirmada',
  ).length
}

export function cuposLibres(
  clase: Clase,
  reservas: readonly Reserva[],
  fecha: string,
): number {
  return Math.max(0, clase.cupo - confirmadasEn(reservas, clase.id, fecha))
}

export function motivoBloqueo(
  socio: Socio,
  membresia: Membresia | undefined,
  clase: Clase,
  reservas: readonly Reserva[],
): string | null {
  const usoPrueba = reservas.some(
    (reserva) =>
      reserva.socioId === socio.id &&
      reserva.esPrueba === true &&
      reserva.estado !== 'cancelada',
  )
  if (clase.esPrueba === true && usoPrueba) {
    return MOTIVO_PRUEBA_USADA
  }
  if (clase.esPrueba === true) {
    return null
  }
  if (socio.estado === 'moroso') {
    return MOTIVO_VENCIDA
  }
  if (membresia === undefined || membresia.estado === 'vencida') {
    return MOTIVO_VENCIDA
  }
  return null
}

export function puedeReservar(
  socio: Socio,
  membresia: Membresia | undefined,
  clase: Clase,
  reservas: readonly Reserva[],
): boolean {
  return motivoBloqueo(socio, membresia, clase, reservas) === null
}

function siguienteId(reservas: readonly Reserva[]): string {
  let maximo = 0
  for (const reserva of reservas) {
    const numero = Number(reserva.id.replace(/^res-/, ''))
    if (Number.isFinite(numero) && numero > maximo) {
      maximo = numero
    }
  }
  return `res-${String(maximo + 1).padStart(3, '0')}`
}

export function crearReserva(
  clase: Clase,
  socio: Socio,
  fecha: string,
  reservas: readonly Reserva[],
): Reserva {
  const conCupo = cuposLibres(clase, reservas, fecha) > 0
  return {
    id: siguienteId(reservas),
    claseId: clase.id,
    socioId: socio.id,
    fecha,
    estado: conCupo ? 'confirmada' : 'espera',
    ...(clase.esPrueba === true ? { esPrueba: true } : {}),
  }
}

function promoverEspera(
  reservas: readonly Reserva[],
  claseId: string,
  fechaIso: string,
): readonly Reserva[] {
  const enEspera = reservas
    .filter(
      (reserva) =>
        reserva.claseId === claseId &&
        reserva.fecha === fechaIso &&
        reserva.estado === 'espera',
    )
    .sort((a, b) => a.id.localeCompare(b.id))
  const primera = enEspera[0]
  if (primera === undefined) {
    return reservas
  }
  return reservas.map((reserva) =>
    reserva.id === primera.id ? { ...reserva, estado: 'confirmada' as const } : reserva,
  )
}

export function cancelarReserva(
  reservaId: string,
  reservas: readonly Reserva[],
): readonly Reserva[] {
  const objetivo = reservas.find((reserva) => reserva.id === reservaId)
  if (objetivo === undefined || objetivo.estado === 'cancelada') {
    return reservas
  }
  const canceladas = reservas.map((reserva) =>
    reserva.id === reservaId ? { ...reserva, estado: 'cancelada' as const } : reserva,
  )
  if (objetivo.estado !== 'confirmada') {
    return canceladas
  }
  return promoverEspera(canceladas, objetivo.claseId, objetivo.fecha)
}

export function proximoDia(clase: Clase, desdeIso: string): string {
  let fecha = desdeIso
  for (let paso = 0; paso < 7; paso += 1) {
    if (clase.dias.includes(diaDeFecha(fecha))) {
      return fecha
    }
    fecha = sumarDiasIso(fecha, 1)
  }
  return desdeIso
}

export function clasesDelDia(clases: readonly Clase[], fechaIso: string): readonly Clase[] {
  const dia = diaDeFecha(fechaIso)
  return clases.filter((clase) => clase.dias.includes(dia))
}

export function reservasDeClase(
  reservas: readonly Reserva[],
  claseId: string,
  fechaIso: string,
): readonly Reserva[] {
  return reservas
    .filter(
      (reserva) =>
        reserva.claseId === claseId &&
        reserva.fecha === fechaIso &&
        reserva.estado === 'confirmada',
    )
    .sort((a, b) => a.id.localeCompare(b.id))
}

export function esperasDe(
  reservas: readonly Reserva[],
  claseId: string,
  fechaIso: string,
): readonly Reserva[] {
  return reservas
    .filter(
      (reserva) =>
        reserva.claseId === claseId &&
        reserva.fecha === fechaIso &&
        reserva.estado === 'espera',
    )
    .sort((a, b) => a.id.localeCompare(b.id))
}

export function reservaActivaDe(
  reservas: readonly Reserva[],
  claseId: string,
  fechaIso: string,
  socioId: string,
): Reserva | undefined {
  return reservas.find(
    (reserva) =>
      reserva.claseId === claseId &&
      reserva.fecha === fechaIso &&
      reserva.socioId === socioId &&
      reserva.estado !== 'cancelada',
  )
}

export function reservasDelDia(
  reservas: readonly Reserva[],
  fechaIso: string,
): readonly Reserva[] {
  return reservas.filter(
    (reserva) => reserva.fecha === fechaIso && reserva.estado !== 'cancelada',
  )
}

export function cuposLibresDelDia(
  clases: readonly Clase[],
  reservas: readonly Reserva[],
  fechaIso: string,
): number {
  return clasesDelDia(clases, fechaIso).reduce(
    (suma, clase) => suma + cuposLibres(clase, reservas, fechaIso),
    0,
  )
}

export function nombreReservado(socioId: string): string {
  const socio = sociosMock.find((candidato) => candidato.id === socioId)
  if (socio !== undefined) {
    return socio.nombre
  }
  return invitadosMock[socioId] ?? 'Invitado'
}

const HOY = new Date()
HOY.setHours(0, 0, 0, 0)

function aIso(fecha: Date): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function fechaHoyIso(): string {
  return aIso(HOY)
}

type BorradorReserva = Omit<Reserva, 'id'>

const hoyIso = aIso(HOY)
const idsSocios = sociosMock.map((socio) => socio.id)

const clasesHoyOrdenadas = [...clasesDelDia(clasesMock, hoyIso)].sort(
  (a, b) => a.cupo - b.cupo || a.horaInicio.localeCompare(b.horaInicio) || a.id.localeCompare(b.id),
)

const claseLlena = clasesHoyOrdenadas[0]
const claseCasiLlena = clasesHoyOrdenadas.find((clase) => clase.id !== claseLlena.id && clase.cupo <= 13)
const claseBoxeo = clasesMock.find((clase) => clase.id === 'cl-boxeo')
const fechaBoxeo = claseBoxeo === undefined ? hoyIso : proximoDia(claseBoxeo, sumarDiasIso(hoyIso, 1))

const borradores: readonly BorradorReserva[] = [
  ...idsSocios.map((socioId) => ({
    claseId: claseLlena.id,
    socioId,
    fecha: hoyIso,
    estado: 'confirmada' as const,
  })),
  { claseId: claseLlena.id, socioId: 'inv-01', fecha: hoyIso, estado: 'espera' as const },
  { claseId: claseLlena.id, socioId: 'inv-02', fecha: hoyIso, estado: 'espera' as const },
  ...(claseCasiLlena === undefined
    ? []
    : idsSocios
        .slice(0, claseCasiLlena.cupo - 1)
        .map((socioId) => ({
          claseId: claseCasiLlena.id,
          socioId,
          fecha: hoyIso,
          estado: 'confirmada' as const,
        }))),
  { claseId: 'cl-boxeo', socioId: 'soc-04', fecha: fechaBoxeo, estado: 'confirmada' as const, esPrueba: true },
  { claseId: 'cl-boxeo', socioId: 'soc-09', fecha: fechaBoxeo, estado: 'confirmada' as const, esPrueba: true },
]

export const reservasMock: readonly Reserva[] = borradores.map((borrador, indice) => ({
  ...borrador,
  id: `res-${String(indice + 1).padStart(3, '0')}`,
}))
