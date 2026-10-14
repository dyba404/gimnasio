import { describe, expect, it } from 'vitest'
import { sociosMock, sumarDiasIso } from '@/mocks/data'
import {
  DIAS_ENTRE_RESENAS,
  etiquetaGatillo,
  momentoFeliz,
  puedePedirResena,
  solicitudesResenaMock,
  sociosElegiblesParaResena,
  ultimaSolicitudPorSocio,
} from '../resenas'

function hoyIso(): string {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}

describe('puedePedirResena — máx. 1 por socio cada 90 días', () => {
  const hoy = hoyIso()

  it('nunca pedida → true', () => {
    expect(puedePedirResena(undefined, hoy)).toBe(true)
  })

  it('89 días desde la última → false (aún dentro de la ventana)', () => {
    expect(puedePedirResena(sumarDiasIso(hoy, -89), hoy)).toBe(false)
  })

  it('90 días desde la última → true (ventana completa)', () => {
    expect(puedePedirResena(sumarDiasIso(hoy, -90), hoy)).toBe(true)
  })

  it('91 días desde la última → true', () => {
    expect(puedePedirResena(sumarDiasIso(hoy, -91), hoy)).toBe(true)
  })

  it('fecha futura (dato corrupto) → false', () => {
    expect(puedePedirResena(sumarDiasIso(hoy, 5), hoy)).toBe(false)
  })

  it('DIAS_ENTRE_RESENAS es 90 y rechaza fechas malformadas', () => {
    expect(DIAS_ENTRE_RESENAS).toBe(90)
    expect(() => puedePedirResena('11/09/2026', hoy)).toThrow(RangeError)
  })
})

describe('momentoFeliz — gatillos del analyst', () => {
  it('renovación registrada → gatillo renovacion', () => {
    expect(momentoFeliz('renovacion')).toBe('renovacion')
  })

  it('racha ≥10 días (S15) → gatillo asistencia', () => {
    expect(momentoFeliz('racha-asistencia')).toBe('asistencia')
  })

  it('etiquetas en español con acentos', () => {
    expect(etiquetaGatillo).toEqual({
      renovacion: 'Renovación',
      asistencia: 'Asistencia',
    })
  })
})

describe('ultimaSolicitudPorSocio', () => {
  it('conserva la fecha más reciente por socio', () => {
    const mapa = ultimaSolicitudPorSocio(solicitudesResenaMock)
    const socio01 = mapa.get('soc-01')
    const socio03 = mapa.get('soc-03')
    expect(socio01).toBe(solicitudesResenaMock.find((s) => s.socioId === 'soc-01')?.fecha)
    expect(socio03).toBe(solicitudesResenaMock.find((s) => s.socioId === 'soc-03')?.fecha)
  })
})

describe('seeds de solicitudes de reseña', () => {
  const hoy = hoyIso()

  it('4 solicitudes: 1 reciente bloqueada (<90 días) y 3 viejas OK', () => {
    expect(solicitudesResenaMock).toHaveLength(4)
    const bloqueadas = solicitudesResenaMock.filter(
      (solicitud) => !puedePedirResena(solicitud.fecha, hoy),
    )
    const permitidas = solicitudesResenaMock.filter(
      (solicitud) => puedePedirResena(solicitud.fecha, hoy),
    )
    expect(bloqueadas).toHaveLength(1)
    expect(permitidas).toHaveLength(3)
  })

  it('todas las solicitudes usan socios reales y gatillo renovacion (hoy)', () => {
    const ids = new Set(sociosMock.map((socio) => socio.id))
    for (const solicitud of solicitudesResenaMock) {
      expect(ids.has(solicitud.socioId)).toBe(true)
      expect(solicitud.gatillo).toBe('renovacion')
    }
  })

  it('socios elegibles hoy: activos sin solicitud en la ventana de 90 días', () => {
    const elegibles = sociosElegiblesParaResena(
      sociosMock,
      solicitudesResenaMock,
      hoy,
    )
    for (const socio of elegibles) {
      expect(socio.estado).toBe('activo')
    }
    expect(elegibles.length).toBe(6)
  })
})
