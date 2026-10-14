import { membresiasMock, sociosMock } from '@/mocks/data'

// Fuente de verdad independiente del componente: si alguien hardcodea un KPI
// en Dashboard.tsx y luego cambian los mocks, estos valores divergirán y el
// test de Dashboard fallará.
export const sociosActivosEsperados: number = sociosMock.filter(
  (socio) => socio.estado === 'activo',
).length

export const membrosiasVencidasEsperadas: number = membresiasMock.filter(
  (membresia) => membresia.estado === 'vencida',
).length
