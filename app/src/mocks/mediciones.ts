import { sociosMock } from './data'

export type Medicion = {
  socioId: string
  fecha: string
  pesoKg?: number
  grasaPct?: number
  alturaCm?: number
  cuelloCm?: number
  pechoCm?: number
  cinturaCm?: number
  brazoCm?: number
  musloCm?: number
}

export type CampoMedicion = Exclude<keyof Medicion, 'socioId' | 'fecha'>

export type DeltaMedicion = Partial<Record<CampoMedicion, number>>

export type PuntoProgreso = {
  fecha: string
  peso?: number
  grasa?: number
}

export type CategoriaImc = 'bajo' | 'normal' | 'sobrepeso' | 'obeso'

export type DireccionDelta = 'favorable' | 'desfavorable' | 'neutro'

const CAMPOS: readonly CampoMedicion[] = [
  'pesoKg',
  'grasaPct',
  'alturaCm',
  'cuelloCm',
  'pechoCm',
  'cinturaCm',
  'brazoCm',
  'musloCm',
]

const BAJA_FAVORABLE: ReadonlySet<CampoMedicion> = new Set(['pesoKg', 'grasaPct', 'cinturaCm'])

export const camposMedicion: readonly CampoMedicion[] = CAMPOS

export function serieMediciones(
  mediciones: readonly Medicion[],
  socioId: string,
): readonly Medicion[] {
  return mediciones
    .filter((medicion) => medicion.socioId === socioId)
    .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0))
}

export function delta(anterior: Medicion, actual: Medicion): DeltaMedicion {
  const resultado: DeltaMedicion = {}
  for (const campo of CAMPOS) {
    const desde = anterior[campo]
    const hasta = actual[campo]
    if (typeof desde === 'number' && typeof hasta === 'number') {
      resultado[campo] = hasta - desde
    }
  }
  return resultado
}

export function direccionDelta(campo: CampoMedicion, valor: number): DireccionDelta {
  if (valor === 0) return 'neutro'
  const favorable = BAJA_FAVORABLE.has(campo) ? valor < 0 : valor > 0
  return favorable ? 'favorable' : 'desfavorable'
}

export function imc(medicion: Medicion): number | null {
  const { pesoKg, alturaCm } = medicion
  if (typeof pesoKg !== 'number' || typeof alturaCm !== 'number' || alturaCm <= 0) {
    return null
  }
  const alturaM = alturaCm / 100
  return pesoKg / (alturaM * alturaM)
}

export function categoriaImc(valor: number): CategoriaImc {
  if (valor < 18.5) return 'bajo'
  if (valor < 25) return 'normal'
  if (valor < 30) return 'sobrepeso'
  return 'obeso'
}

export function progresoGrafico(
  mediciones: readonly Medicion[],
  socioId: string,
): readonly PuntoProgreso[] {
  return serieMediciones(mediciones, socioId).map((medicion) => {
    const punto: PuntoProgreso = { fecha: medicion.fecha }
    if (typeof medicion.pesoKg === 'number') punto.peso = medicion.pesoKg
    if (typeof medicion.grasaPct === 'number') punto.grasa = medicion.grasaPct
    return punto
  })
}

const HOY = new Date()
HOY.setHours(0, 0, 0, 0)

function aIso(fecha: Date): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function haceDias(dias: number): string {
  const fecha = new Date(HOY)
  fecha.setDate(fecha.getDate() - dias)
  return aIso(fecha)
}

const idsValidos = new Set(sociosMock.map((socio) => socio.id))

const borradores: readonly Medicion[] = [
  { socioId: 'soc-01', fecha: haceDias(90), pesoKg: 85, grasaPct: 24, alturaCm: 165, cuelloCm: 40, pechoCm: 104, cinturaCm: 96, brazoCm: 35, musloCm: 58 },
  { socioId: 'soc-01', fecha: haceDias(60), pesoKg: 83, grasaPct: 22.5, alturaCm: 165, cuelloCm: 39.5, pechoCm: 103, cinturaCm: 93, brazoCm: 35.5, musloCm: 57 },
  { socioId: 'soc-01', fecha: haceDias(30), pesoKg: 81, grasaPct: 20.5, alturaCm: 165, cuelloCm: 39, pechoCm: 102, cinturaCm: 91, brazoCm: 36, musloCm: 56.5 },
  { socioId: 'soc-01', fecha: haceDias(0), pesoKg: 79, grasaPct: 19, alturaCm: 165, cuelloCm: 38.5, pechoCm: 101, cinturaCm: 90, brazoCm: 36.5, musloCm: 56 },
  { socioId: 'soc-02', fecha: haceDias(45), pesoKg: 72, grasaPct: 15, alturaCm: 175, cinturaCm: 80, brazoCm: 33 },
  { socioId: 'soc-02', fecha: haceDias(5), pesoKg: 74, grasaPct: 15.5, alturaCm: 175, cinturaCm: 81, brazoCm: 34 },
  { socioId: 'soc-03', fecha: haceDias(10), pesoKg: 58, grasaPct: 22, alturaCm: 160, cinturaCm: 74, brazoCm: 28, musloCm: 52 },
]

export const medicionesMock: readonly Medicion[] = borradores.filter((borrador) =>
  idsValidos.has(borrador.socioId),
)
