export type PeriodoOpcion = {
  dias: number
  etiqueta: string
}

export const OPCIONES_PERIODO: readonly PeriodoOpcion[] = [
  { dias: 30, etiqueta: '30 días' },
  { dias: 90, etiqueta: '3 meses' },
  { dias: 180, etiqueta: '6 meses' },
]
