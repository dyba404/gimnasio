import { epochActual, verificarToken } from '@/lib/totp'
import { calcularEstado } from '@/mocks/data'
import type { ConfigGym, Membresia, Socio } from '@/mocks/types'

export type PayloadCarnet = {
  codigo: string
  dni: string
  vence: string
  token?: string
  exp?: number
}

export type TipoResultadoCarnet =
  | 'desconocido'
  | 'legado'
  | 'expirado'
  | 'token-invalido'
  | 'aceptado'
  | 'moroso'

export type ResultadoCarnet = {
  tipo: TipoResultadoCarnet
  socio?: Socio
  motivo: string
  codigoLeido?: string
  viaLegado?: boolean
}

export type MapasCarnet = {
  socios: ReadonlyMap<string, Socio>
  membresias: ReadonlyMap<string, Membresia>
}

export function parsearPayload(texto: string): PayloadCarnet | null {
  let datos: unknown
  try {
    datos = JSON.parse(texto)
  } catch {
    return null
  }
  if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) {
    return null
  }
  const registro = datos as Record<string, unknown>
  if (
    typeof registro.codigo !== 'string' ||
    typeof registro.dni !== 'string' ||
    typeof registro.vence !== 'string'
  ) {
    return null
  }
  const payload: PayloadCarnet = {
    codigo: registro.codigo,
    dni: registro.dni,
    vence: registro.vence,
  }
  if (
    typeof registro.token === 'string' &&
    registro.token.length > 0 &&
    typeof registro.exp === 'number' &&
    Number.isFinite(registro.exp)
  ) {
    payload.token = registro.token
    payload.exp = registro.exp
  }
  return payload
}

function membresiaVencida(
  membresias: ReadonlyMap<string, Membresia>,
  socioId: string,
): boolean {
  const membresia = membresias.get(socioId)
  if (!membresia) return true
  return calcularEstado(membresia.fechaFin) === 'vencida'
}

export function decidirIngreso(
  payload: PayloadCarnet,
  mapas: MapasCarnet,
  config: ConfigGym,
  epoch: number = epochActual(),
): ResultadoCarnet {
  const base = { codigoLeido: payload.codigo } satisfies Pick<
    ResultadoCarnet,
    'codigoLeido'
  >
  const socio = mapas.socios.get(payload.codigo)
  if (!socio) {
    return {
      ...base,
      tipo: 'desconocido',
      motivo: 'Código de carné no registrado en el gimnasio',
    }
  }
  if (payload.token === undefined || payload.exp === undefined) {
    if (config.qrPermitirLegado === true) {
      return {
        ...base,
        tipo: 'aceptado',
        socio,
        motivo: 'QR legado — reemitir carné',
        viaLegado: true,
      }
    }
    return {
      ...base,
      tipo: 'legado',
      socio,
      motivo: 'Carné desactualizado — búscalo por nombre o DNI',
    }
  }
  if (payload.exp <= epoch) {
    return {
      ...base,
      tipo: 'expirado',
      socio,
      motivo: 'QR vencido — el socio debe regenerarlo',
    }
  }
  if (!verificarToken(socio, payload.token, epoch)) {
    return {
      ...base,
      tipo: 'token-invalido',
      socio,
      motivo: 'Código no válido — captura de pantalla o QR viejo',
    }
  }
  if (membresiaVencida(mapas.membresias, socio.id)) {
    return {
      ...base,
      tipo: 'moroso',
      socio,
      motivo: 'Membresía vencida — registra el cobro para permitir el ingreso',
    }
  }
  return { ...base, tipo: 'aceptado', socio, motivo: 'Acceso autorizado' }
}
