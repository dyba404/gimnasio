import { normalizar } from '@/lib/search'
import { GYM_NOMBRE } from '@/lib/whatsapp'

export type EstadoProspecto =
  | 'nuevo'
  | 'contactado'
  | 'demo'
  | 'negociacion'
  | 'ganado'
  | 'perdido'

export type FuenteProspecto =
  | 'walk-in'
  | 'referido'
  | 'facebook'
  | 'instagram'
  | 'marketplace'
  | 'otra'

export type InteresProspecto = 'mensual' | 'trimestral' | 'anual' | 'estudiante'

export type TipoNotaProspecto = 'llamada' | 'whatsapp' | 'visita' | 'otro'

export type NotaGestion = {
  fecha: string
  nota: string
  tipo: TipoNotaProspecto
}

export type ProximaAccion = {
  fecha: string
  detalle: string
}

export type Prospecto = {
  id: string
  nombre: string
  telefono: string
  fuente: FuenteProspecto
  estado: EstadoProspecto
  interes?: InteresProspecto
  valorPotencialMensual: number
  notasGestion: NotaGestion[]
  proximaAccion?: ProximaAccion
  creadoEn: string
}

export const estadosProspecto: readonly EstadoProspecto[] = [
  'nuevo',
  'contactado',
  'demo',
  'negociacion',
  'ganado',
  'perdido',
]

export const etiquetaEstado: Record<EstadoProspecto, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  demo: 'Demo',
  negociacion: 'Negociación',
  ganado: 'Ganado',
  perdido: 'Perdido',
}

export const claseEstado: Record<EstadoProspecto, string> = {
  nuevo: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  contactado: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  demo: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  negociacion: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  ganado: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  perdido: 'bg-red-500/15 text-red-600 dark:text-red-400',
}

export const etiquetaFuente: Record<FuenteProspecto, string> = {
  'walk-in': 'Walk-in',
  referido: 'Referido',
  facebook: 'Facebook',
  instagram: 'Instagram',
  marketplace: 'Marketplace',
  otra: 'Otra',
}

export const etiquetaInteres: Record<InteresProspecto, string> = {
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  anual: 'Anual',
  estudiante: 'Estudiante',
}

export const tiposNota: readonly TipoNotaProspecto[] = ['llamada', 'whatsapp', 'visita', 'otro']

export const etiquetaTipoNota: Record<TipoNotaProspecto, string> = {
  llamada: 'Llamada',
  whatsapp: 'WhatsApp',
  visita: 'Visita',
  otro: 'Otro',
}

const UMBRAL_SIN_GESTION_DIAS = 7

const MILISEGUNDOS_POR_DIA = 86_400_000

export function fechaHoyIso(): string {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return aIso(hoy)
}

function aIso(fecha: Date): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function aFecha(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Date(anio, (mes ?? 1) - 1, dia ?? 1)
}

export function fechaUltimaGestion(prospecto: Prospecto): string {
  let ultima = prospecto.creadoEn
  for (const nota of prospecto.notasGestion) {
    if (nota.fecha > ultima) {
      ultima = nota.fecha
    }
  }
  return ultima
}

export function diasSinGestion(prospecto: Prospecto, hoyIso: string): number {
  const ultima = aFecha(fechaUltimaGestion(prospecto)).getTime()
  const hoy = aFecha(hoyIso).getTime()
  return Math.round((hoy - ultima) / MILISEGUNDOS_POR_DIA)
}

export function estaSinGestion(prospecto: Prospecto, hoyIso: string): boolean {
  const enPipeline = prospecto.estado !== 'ganado' && prospecto.estado !== 'perdido'
  return enPipeline && diasSinGestion(prospecto, hoyIso) >= UMBRAL_SIN_GESTION_DIAS
}

export function textoHaceDias(dias: number): string {
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  return `hace ${dias} días`
}

export function pipelineActivo(prospectos: readonly Prospecto[]): Prospecto[] {
  return prospectos.filter(
    (prospecto) => prospecto.estado !== 'ganado' && prospecto.estado !== 'perdido',
  )
}

export function valorPipeline(prospectos: readonly Prospecto[]): number {
  return pipelineActivo(prospectos).reduce(
    (suma, prospecto) => suma + prospecto.valorPotencialMensual,
    0,
  )
}

export function ganadosEnMes(
  prospectos: readonly Prospecto[],
  anno: number,
  mes: number,
): Prospecto[] {
  const prefijo = `${anno}-${String(mes).padStart(2, '0')}-`
  return prospectos.filter(
    (prospecto) =>
      prospecto.estado === 'ganado' && fechaUltimaGestion(prospecto).startsWith(prefijo),
  )
}

export function tasaConversion(prospectos: readonly Prospecto[]): number {
  if (prospectos.length === 0) return 0
  const ganados = prospectos.filter((prospecto) => prospecto.estado === 'ganado').length
  return Math.round((ganados / prospectos.length) * 100)
}

export function porContactar(prospectos: readonly Prospecto[], hoyIso: string): Prospecto[] {
  return prospectos.filter(
    (prospecto) => prospecto.estado === 'nuevo' || estaSinGestion(prospecto, hoyIso),
  )
}

export function buscarProspectos(
  prospectos: readonly Prospecto[],
  query: string,
): Prospecto[] {
  const consulta = normalizar(query.trim())
  if (consulta.length === 0) return [...prospectos]
  return prospectos.filter(
    (prospecto) =>
      normalizar(prospecto.nombre).includes(consulta) ||
      prospecto.telefono.includes(consulta) ||
      normalizar(etiquetaFuente[prospecto.fuente]).includes(consulta),
  )
}

export function construirMensajePrimerContacto(nombre: string): string {
  return `Hola ${nombre}! Soy de ${GYM_NOMBRE}. Vi que te interesa entrenar con nosotros. El plan fundador cuesta S/ 99 al mes con acceso completo al gimnasio. ¿Te paso los detalles?`
}

export function registrarGestionProspecto(
  prospectos: readonly Prospecto[],
  prospectoId: string,
  tipo: TipoNotaProspecto,
  nota: string,
  fechaIso: string,
): Prospecto[] {
  return prospectos.map((prospecto) => {
    if (prospecto.id !== prospectoId) return prospecto
    return {
      ...prospecto,
      estado: prospecto.estado === 'nuevo' ? 'contactado' : prospecto.estado,
      notasGestion: [...prospecto.notasGestion, { fecha: fechaIso, nota, tipo }],
    }
  })
}

export function marcarGanado(
  prospectos: readonly Prospecto[],
  prospectoId: string,
  fechaIso: string,
): Prospecto[] {
  return prospectos.map((prospecto) => {
    if (prospecto.id !== prospectoId) return prospecto
    return {
      ...prospecto,
      estado: 'ganado',
      proximaAccion: undefined,
      notasGestion: [
        ...prospecto.notasGestion,
        { fecha: fechaIso, nota: 'Cerró el plan fundador (S/ 99/mes).', tipo: 'otro' },
      ],
    }
  })
}

export function marcarPerdido(
  prospectos: readonly Prospecto[],
  prospectoId: string,
  motivo: string,
  fechaIso: string,
): Prospecto[] {
  return prospectos.map((prospecto) => {
    if (prospecto.id !== prospectoId) return prospecto
    return {
      ...prospecto,
      estado: 'perdido',
      proximaAccion: undefined,
      notasGestion: [
        ...prospecto.notasGestion,
        { fecha: fechaIso, nota: `Perdido: ${motivo}`, tipo: 'otro' },
      ],
    }
  })
}

const HOY = new Date()
HOY.setHours(0, 0, 0, 0)

function haceDias(dias: number): string {
  const fecha = new Date(HOY)
  fecha.setDate(fecha.getDate() - dias)
  return aIso(fecha)
}

function enDias(dias: number): string {
  const fecha = new Date(HOY)
  fecha.setDate(fecha.getDate() + dias)
  return aIso(fecha)
}

function enMesActual(diasAtras: number): string {
  const candidata = haceDias(diasAtras)
  const inicioMes = aIso(new Date(HOY.getFullYear(), HOY.getMonth(), 1))
  return candidata < inicioMes ? inicioMes : candidata
}

const borradores: readonly Prospecto[] = [
  {
    id: 'pro-01',
    nombre: 'Luis Ramírez',
    telefono: '987123456',
    fuente: 'walk-in',
    estado: 'negociacion',
    interes: 'mensual',
    valorPotencialMensual: 99,
    notasGestion: [
      { fecha: haceDias(3), nota: 'Pasó a preguntar precios, entrena en otro gym cerca.', tipo: 'visita' },
      { fecha: haceDias(1), nota: 'Le envié propuesta del plan fundador, pide pensar el fin de semana.', tipo: 'whatsapp' },
    ],
    proximaAccion: { fecha: enDias(2), detalle: 'Confirmar cierre del plan fundador' },
    creadoEn: haceDias(3),
  },
  {
    id: 'pro-02',
    nombre: 'Carla Flores',
    telefono: '934567812',
    fuente: 'instagram',
    estado: 'demo',
    interes: 'estudiante',
    valorPotencialMensual: 55,
    notasGestion: [
      { fecha: haceDias(2), nota: 'Escribió por DM, es universitaria.', tipo: 'whatsapp' },
      { fecha: haceDias(1), nota: 'Agendó clase de prueba, vino a ver las instalaciones.', tipo: 'visita' },
    ],
    proximaAccion: { fecha: enDias(1), detalle: 'Clase de prueba a las 7 pm' },
    creadoEn: haceDias(2),
  },
  {
    id: 'pro-03',
    nombre: 'Jorge Salas',
    telefono: '954321876',
    fuente: 'referido',
    estado: 'ganado',
    interes: 'anual',
    valorPotencialMensual: 66,
    notasGestion: [
      { fecha: haceDias(6), nota: 'Lo refirió Carlos Rojas.', tipo: 'llamada' },
      { fecha: haceDias(4), nota: 'Probó una clase sin costo.', tipo: 'visita' },
      { fecha: enMesActual(2), nota: 'Cerró el plan fundador (S/ 99/mes).', tipo: 'otro' },
    ],
    creadoEn: haceDias(6),
  },
  {
    id: 'pro-04',
    nombre: 'María Torres',
    telefono: '965874123',
    fuente: 'facebook',
    estado: 'ganado',
    interes: 'mensual',
    valorPotencialMensual: 99,
    notasGestion: [
      { fecha: haceDias(9), nota: 'Comentó en la publicación de anuncios.', tipo: 'whatsapp' },
      { fecha: haceDias(7), nota: 'Visitó el gym con su hermana.', tipo: 'visita' },
      { fecha: enMesActual(5), nota: 'Cerró el plan fundador (S/ 99/mes).', tipo: 'otro' },
    ],
    creadoEn: haceDias(9),
  },
  {
    id: 'pro-05',
    nombre: 'Diego Herrera',
    telefono: '912345678',
    fuente: 'marketplace',
    estado: 'nuevo',
    interes: 'mensual',
    valorPotencialMensual: 99,
    notasGestion: [],
    creadoEn: haceDias(1),
  },
  {
    id: 'pro-06',
    nombre: 'Ana Quispe',
    telefono: '976543210',
    fuente: 'walk-in',
    estado: 'nuevo',
    interes: 'trimestral',
    valorPotencialMensual: 79,
    notasGestion: [],
    creadoEn: haceDias(12),
  },
  {
    id: 'pro-07',
    nombre: 'Pedro Sánchez',
    telefono: '98765',
    fuente: 'referido',
    estado: 'contactado',
    interes: 'mensual',
    valorPotencialMensual: 99,
    notasGestion: [
      { fecha: haceDias(8), nota: 'Número incompleto en el formulario, contestó un tercero.', tipo: 'llamada' },
    ],
    creadoEn: haceDias(10),
  },
  {
    id: 'pro-08',
    nombre: 'Rosa García',
    telefono: '945612378',
    fuente: 'instagram',
    estado: 'contactado',
    interes: 'mensual',
    valorPotencialMensual: 99,
    notasGestion: [
      { fecha: haceDias(2), nota: 'Respondió el primer contacto, pide horarios de la mañana.', tipo: 'whatsapp' },
    ],
    creadoEn: haceDias(4),
  },
  {
    id: 'pro-09',
    nombre: 'Miguel Chávez',
    telefono: '923456789',
    fuente: 'facebook',
    estado: 'demo',
    interes: 'anual',
    valorPotencialMensual: 66,
    notasGestion: [
      { fecha: haceDias(5), nota: 'Quiere entrenar en las noches, evaluamos el plan anual.', tipo: 'llamada' },
      { fecha: haceDias(4), nota: 'Probó la sala de musculación.', tipo: 'visita' },
    ],
    creadoEn: haceDias(5),
  },
  {
    id: 'pro-10',
    nombre: 'Lucía Mendoza',
    telefono: '967891234',
    fuente: 'referido',
    estado: 'negociacion',
    interes: 'anual',
    valorPotencialMensual: 66,
    notasGestion: [
      { fecha: haceDias(4), nota: 'Pide descuento por pago al contado del plan anual.', tipo: 'whatsapp' },
      { fecha: haceDias(3), nota: 'Le ofrecí incluir la inscripción sin costo, lo evalúa.', tipo: 'whatsapp' },
    ],
    creadoEn: haceDias(6),
  },
  {
    id: 'pro-11',
    nombre: 'Raúl Castro',
    telefono: '938765412',
    fuente: 'marketplace',
    estado: 'perdido',
    interes: 'mensual',
    valorPotencialMensual: 99,
    notasGestion: [
      { fecha: haceDias(7), nota: 'Consultó por el precio mensual.', tipo: 'whatsapp' },
      { fecha: haceDias(6), nota: 'Perdido: encontró un gimnasio más barato en su cuadra.', tipo: 'otro' },
    ],
    creadoEn: haceDias(7),
  },
  {
    id: 'pro-12',
    nombre: 'Fiorella Díaz',
    telefono: '956789123',
    fuente: 'otra',
    estado: 'perdido',
    interes: 'estudiante',
    valorPotencialMensual: 55,
    notasGestion: [
      { fecha: haceDias(9), nota: 'Perdido: se mudó de distrito, quedó lejos del gym.', tipo: 'otro' },
    ],
    creadoEn: haceDias(9),
  },
  {
    id: 'pro-13',
    nombre: 'Carlos Rojas',
    telefono: '981234567',
    fuente: 'walk-in',
    estado: 'ganado',
    interes: 'mensual',
    valorPotencialMensual: 99,
    notasGestion: [
      { fecha: haceDias(3), nota: 'Walk-in directo, entrenó el mismo día.', tipo: 'visita' },
      { fecha: enMesActual(1), nota: 'Cerró el plan fundador (S/ 99/mes).', tipo: 'otro' },
    ],
    creadoEn: haceDias(3),
  },
  {
    id: 'pro-14',
    nombre: 'Beatriz Luna',
    telefono: '945123678',
    fuente: 'facebook',
    estado: 'ganado',
    interes: 'trimestral',
    valorPotencialMensual: 79,
    notasGestion: [
      { fecha: haceDias(5), nota: 'Escribió por Messenger, quiere clases grupales.', tipo: 'whatsapp' },
      { fecha: enMesActual(3), nota: 'Cerró el plan fundador (S/ 99/mes).', tipo: 'otro' },
    ],
    creadoEn: haceDias(5),
  },
]

export const prospectosMock: readonly Prospecto[] = borradores
