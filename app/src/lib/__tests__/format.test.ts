import { describe, expect, it } from "vitest"
import {
  abreviarTexto,
  diasParaVencer,
  formatoSoles,
  formatoSolesCompacto,
  iniciales,
} from "../format"

describe("formatoSoles", () => {
  it("formatea cero con dos decimales", () => {
    expect(formatoSoles(0)).toBe("S/ 0.00")
  })

  it("formatea -0 sin signo negativo", () => {
    expect(formatoSoles(-0)).toBe("S/ 0.00")
  })

  it("formatea el plan fundador S/99", () => {
    expect(formatoSoles(99)).toBe("S/ 99.00")
  })

  it("agrupa miles y completa decimales", () => {
    expect(formatoSoles(1234.5)).toBe("S/ 1,234.50")
  })

  it("formatea centavos sueltos", () => {
    expect(formatoSoles(0.5)).toBe("S/ 0.50")
  })

  it("trunca a dos decimales en miles grandes", () => {
    expect(formatoSoles(1234567.891)).toBe("S/ 1,234,567.89")
  })

  it("pone el signo antes del prefijo S/", () => {
    expect(formatoSoles(-45.5)).toBe("-S/ 45.50")
  })

  it("rechaza NaN", () => {
    expect(() => formatoSoles(Number.NaN)).toThrow(RangeError)
  })

  it("rechaza Infinity", () => {
    expect(() => formatoSoles(Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })
})

describe("diasParaVencer", () => {
  it("devuelve 0 cuando vence hoy", () => {
    expect(diasParaVencer(new Date(2026, 8, 10), new Date(2026, 8, 10))).toBe(0)
  })

  it("devuelve 1 cuando vence mañana", () => {
    expect(diasParaVencer(new Date(2026, 8, 11), new Date(2026, 8, 10))).toBe(1)
  })

  it("devuelve negativo si ya venció (anteayer)", () => {
    expect(diasParaVencer(new Date(2026, 8, 8), new Date(2026, 8, 10))).toBe(-2)
  })

  it("ignora la hora: 23:59 vs 00:05 del mismo día es 0", () => {
    expect(
      diasParaVencer(new Date(2026, 8, 11, 23, 59), new Date(2026, 8, 11, 0, 5)),
    ).toBe(0)
  })

  it("parsea cadena YYYY-MM-DD en zona local, no UTC", () => {
    expect(diasParaVencer("2026-09-11", new Date(2026, 8, 11))).toBe(0)
  })

  it("entendido 31 días entre 1 de enero y 1 de febrero", () => {
    expect(diasParaVencer(new Date(2026, 1, 1), new Date(2026, 0, 1))).toBe(31)
  })

  it("año bisiesto: 2028-02-29 a 2028-03-01 es 1 día", () => {
    expect(
      diasParaVencer(new Date(2028, 2, 1), new Date(2028, 1, 29)),
    ).toBe(1)
  })

  it("28 de febrero hacia el 29 bisiesto es 1 día", () => {
    expect(
      diasParaVencer(new Date(2028, 1, 29), new Date(2028, 1, 28)),
    ).toBe(1)
  })

  it("miembro moroso: cadena ISO de fecha bisiesta vencida", () => {
    expect(
      diasParaVencer("2028-02-29", new Date(2028, 2, 5)),
    ).toBe(-5)
  })

  it("rechaza cadena no fecha", () => {
    expect(() => diasParaVencer("no-es-fecha")).toThrow(RangeError)
  })

  it("rechaza 30 de febrero", () => {
    expect(() => diasParaVencer("2026-02-30")).toThrow(RangeError)
  })

  it("rechaza Date inválida", () => {
    expect(() => diasParaVencer(new Date("xyz"))).toThrow(RangeError)
  })
})

describe("formatoSolesCompacto", () => {
  it("formatea cero sin decimales", () => {
    expect(formatoSolesCompacto(0)).toBe("S/ 0")
  })

  it("montos menores a mil quedan enteros", () => {
    expect(formatoSolesCompacto(950)).toBe("S/ 950")
  })

  it("miles con un decimal", () => {
    expect(formatoSolesCompacto(3500)).toBe("S/ 3.5k")
  })

  it("miles exactos sin decimal", () => {
    expect(formatoSolesCompacto(12000)).toBe("S/ 12k")
  })

  it("cifras grandes redondean a miles enteros", () => {
    expect(formatoSolesCompacto(123456)).toBe("S/ 123k")
  })

  it("pone el signo antes del prefijo S/", () => {
    expect(formatoSolesCompacto(-3500)).toBe("-S/ 3.5k")
  })

  it("rechaza NaN", () => {
    expect(() => formatoSolesCompacto(Number.NaN)).toThrow(RangeError)
  })

  it("rechaza Infinity", () => {
    expect(() => formatoSolesCompacto(Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })
})

describe("abreviarTexto", () => {
  it("no altera textos dentro del límite", () => {
    expect(abreviarTexto("Kevin Ríos", 20)).toBe("Kevin Ríos")
  })

  it("corta por palabra y concatena elipsis sin espacio suelto", () => {
    expect(abreviarTexto("Álvaro Nunura Sifuentes", 20)).toBe("Álvaro Nunura…")
  })

  it("corte duro cuando no hay espacios", () => {
    expect(abreviarTexto("MaximilianoFirmatZapata", 10)).toBe("Maximilian…")
  })

  it("normaliza espacios en los extremos", () => {
    expect(abreviarTexto("  Ana Sofía Rojas Pérez  ", 18)).toBe("Ana Sofía Rojas…")
  })

  it("nunca deja un espacio antes de la elipsis", () => {
    const abreviado = abreviarTexto("Gabriel Alarcón Ramos", 10)
    expect(abreviado.endsWith("…")).toBe(true)
    expect(abreviado.endsWith(" …")).toBe(false)
  })
})

describe("iniciales", () => {
  it("dos palabras: primera letra de cada una", () => {
    expect(iniciales("Ana Rojas")).toBe("AR")
  })

  it("tres o más palabras: primera letra de las dos primeras", () => {
    expect(iniciales("Rosa Ñahui Quispe")).toBe("RÑ")
    expect(iniciales("Jorge Luis Ccahuana Ríos")).toBe("JL")
  })

  it("una sola palabra: sus dos primeras letras", () => {
    expect(iniciales("Karla")).toBe("KA")
  })

  it("conserva ñ y acentos", () => {
    expect(iniciales("Carmen Rosa Ñaupari")).toBe("CR")
  })

  it("normaliza espacios extra", () => {
    expect(iniciales("  Ana   Sofía  Rojas ")).toBe("AS")
  })

  it("convierte a mayúsculas", () => {
    expect(iniciales("ana rojas")).toBe("AR")
  })

  it("cadena vacía devuelve vacío", () => {
    expect(iniciales("")).toBe("")
    expect(iniciales("   ")).toBe("")
  })
})
