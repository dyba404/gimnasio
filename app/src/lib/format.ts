const FORMATO_SOLES = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const MILISEGUNDOS_POR_DIA = 86_400_000

const PATRON_FECHA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/

export function formatoSoles(monto: number): string {
  if (!Number.isFinite(monto)) {
    throw new RangeError(`monto no válido: ${monto}`)
  }
  const signo = monto < 0 ? "-" : ""
  return `${signo}S/ ${FORMATO_SOLES.format(Math.abs(monto))}`
}

export function formatoSolesCompacto(monto: number): string {
  if (!Number.isFinite(monto)) {
    throw new RangeError(`monto no válido: ${monto}`)
  }
  const signo = monto < 0 ? "-" : ""
  const absoluto = Math.abs(monto)
  const miles = absoluto / 1000
  const cuerpo =
    miles >= 100
      ? `${miles.toFixed(0)}k`
      : miles >= 1
        ? miles % 1 === 0
          ? `${String(miles)}k`
          : `${miles.toFixed(1)}k`
        : String(Math.round(absoluto))
  return `${signo}S/ ${cuerpo}`
}

export function abreviarTexto(texto: string, maximo: number): string {
  const limpio = texto.trim()
  if (limpio.length <= maximo) {
    return limpio
  }
  const recorte = limpio.slice(0, maximo)
  const ultimoEspacio = recorte.lastIndexOf(" ")
  const base = ultimoEspacio > 0 ? recorte.slice(0, ultimoEspacio) : recorte
  return `${base.trimEnd()}…`
}

function aFechaLocal(valor: Date | string): Date {
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) {
      throw new RangeError("fecha inválida: Date no válida")
    }
    return valor
  }
  const partes = PATRON_FECHA_ISO.exec(valor)
  if (partes) {
    const anio = Number(partes[1])
    const mes = Number(partes[2])
    const dia = Number(partes[3])
    const fecha = new Date(anio, mes - 1, dia)
    if (
      fecha.getFullYear() !== anio ||
      fecha.getMonth() !== mes - 1 ||
      fecha.getDate() !== dia
    ) {
      throw new RangeError(`fecha inválida: ${valor}`)
    }
    return fecha
  }
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) {
    throw new RangeError(`fecha inválida: ${valor}`)
  }
  return fecha
}

function medianocheLocal(fecha: Date): number {
  return new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate(),
  ).getTime()
}

export function diasParaVencer(
  vencimiento: Date | string,
  hoy: Date = new Date(),
): number {
  const fechaVencimiento = aFechaLocal(vencimiento)
  return Math.round(
    (medianocheLocal(fechaVencimiento) - medianocheLocal(hoy)) /
      MILISEGUNDOS_POR_DIA,
  )
}

export function iniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) {
    return ''
  }
  const [primera, segunda] = palabras
  if (!segunda) {
    return primera.slice(0, 2).toUpperCase()
  }
  return `${primera.charAt(0)}${segunda.charAt(0)}`.toUpperCase()
}
