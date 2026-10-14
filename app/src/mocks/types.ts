export type EstadoSocio = 'activo' | 'moroso' | 'congelado'

export type EstadoMembresia = 'vigente' | 'por-vencer' | 'vencida'

export type Plan = {
  id: string
  nombre: string
  precio: number
  duracionDias: number
}

export type Socio = {
  id: string
  codigo: string
  nombre: string
  dni: string
  telefono: string
  planId: string
  estado: EstadoSocio
  fechaRegistro: string
}

export type Congelamiento = { desde: string; hasta: string }

export type ConfigGym = {
  nombre?: string
  yapeNumero?: string
  plinNumero?: string
  linkPagoCulqi?: string
  linkResenaGoogle?: string
  qrPermitirLegado?: boolean
}

export type Membresia = {
  id: string
  socioId: string
  planId: string
  fechaInicio: string
  fechaFin: string
  monto: number
  estado: EstadoMembresia
  congelada?: Congelamiento
}
