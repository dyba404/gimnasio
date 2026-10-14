export type ResultadoMonto = {
  valor: number | null
  error: string | null
}

const PATRON_MONTO = /^\d+([.,]\d{0,2})?$/

export function parseMonto(texto: string): ResultadoMonto {
  const limpio = texto.trim()
  if (limpio.length === 0) return { valor: null, error: null }
  if (!PATRON_MONTO.test(limpio)) {
    if (/[eE]/.test(limpio)) {
      return { valor: null, error: 'No se permite notación científica (ej. 1e5)' }
    }
    return {
      valor: null,
      error: 'Usa solo números, con coma o punto y hasta 2 decimales',
    }
  }
  const valor = Number.parseFloat(limpio.replace(',', '.'))
  if (!Number.isFinite(valor) || valor <= 0) {
    return { valor: null, error: 'El monto debe ser mayor a S/ 0.00' }
  }
  return { valor, error: null }
}
