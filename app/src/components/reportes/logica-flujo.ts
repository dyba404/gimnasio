import type { IngresoMes } from '@/components/pagos/logica-pagos'
import type { GastoMes } from '@/mocks/gastos'

export type FlujoMes = {
  clave: string
  etiqueta: string
  ingresos: number
  gastos: number
  utilidad: number
}

export function combinarFlujo(
  ingresos: readonly IngresoMes[],
  gastos: readonly GastoMes[],
): FlujoMes[] {
  const porClave = new Map<string, { etiqueta: string; ingresos: number; gastos: number }>()
  for (const mes of ingresos) {
    porClave.set(mes.clave, { etiqueta: mes.etiqueta, ingresos: mes.total, gastos: 0 })
  }
  for (const mes of gastos) {
    const previo = porClave.get(mes.clave) ?? { etiqueta: mes.etiqueta, ingresos: 0, gastos: 0 }
    previo.gastos = mes.total
    porClave.set(mes.clave, previo)
  }
  return [...porClave.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([clave, dato]) => ({
      clave,
      etiqueta: dato.etiqueta,
      ingresos: dato.ingresos,
      gastos: dato.gastos,
      utilidad: dato.ingresos - dato.gastos,
    }))
}
