import { describe, expect, it } from 'vitest'
import { telefonoValido } from '@/lib/whatsapp'
import {
  buscarProspectos,
  construirMensajePrimerContacto,
  diasSinGestion,
  estaSinGestion,
  fechaHoyIso,
  ganadosEnMes,
  marcarGanado,
  marcarPerdido,
  pipelineActivo,
  porContactar,
  prospectosMock,
  registrarGestionProspecto,
  tasaConversion,
  textoHaceDias,
  valorPipeline,
} from '../prospectos'
import type { Prospecto } from '../prospectos'

const HOY_ISO = fechaHoyIso()

function crearProspecto(overrides: Partial<Prospecto> = {}): Prospecto {
  return {
    id: 'pro-test',
    nombre: 'Test Pérez',
    telefono: '987654321',
    fuente: 'walk-in',
    estado: 'nuevo',
    valorPotencialMensual: 99,
    notasGestion: [],
    creadoEn: HOY_ISO,
    ...overrides,
  }
}

describe('diasSinGestion', () => {
  it('devuelve 0 cuando la última gestión fue hoy mismo', () => {
    const prospecto = crearProspecto({
      notasGestion: [{ fecha: HOY_ISO, nota: 'Primera llamada', tipo: 'llamada' }],
      creadoEn: '2026-01-01',
    })
    expect(diasSinGestion(prospecto, HOY_ISO)).toBe(0)
  })

  it('devuelve exactamente 7 cuando la última gestión fue hace 7 días', () => {
    const prospecto = crearProspecto({
      notasGestion: [{ fecha: '2026-09-04', nota: 'WhatsApp', tipo: 'whatsapp' }],
      creadoEn: '2026-01-01',
    })
    expect(diasSinGestion(prospecto, '2026-09-11')).toBe(7)
  })

  it('usa creadoEn como respaldo cuando no hay notas', () => {
    const prospecto = crearProspecto({ creadoEn: '2026-09-09' })
    expect(diasSinGestion(prospecto, '2026-09-11')).toBe(2)
  })

  it('toma la nota más reciente, no la primera', () => {
    const prospecto = crearProspecto({
      creadoEn: '2026-01-01',
      notasGestion: [
        { fecha: '2026-08-01', nota: 'Antigua', tipo: 'llamada' },
        { fecha: '2026-09-10', nota: 'Reciente', tipo: 'whatsapp' },
      ],
    })
    expect(diasSinGestion(prospecto, '2026-09-11')).toBe(1)
  })
})

describe('estaSinGestion', () => {
  it('marca en ámbar solo prospectos en pipeline con 7+ días', () => {
    const enRiesgo = crearProspecto({ estado: 'contactado', creadoEn: '2026-08-30' })
    const reciente = crearProspecto({ estado: 'contactado', creadoEn: HOY_ISO })
    const ganado = crearProspecto({ estado: 'ganado', creadoEn: '2026-08-30' })
    expect(estaSinGestion(enRiesgo, HOY_ISO)).toBe(true)
    expect(estaSinGestion(reciente, HOY_ISO)).toBe(false)
    expect(estaSinGestion(ganado, HOY_ISO)).toBe(false)
  })
})

describe('pipelineActivo y valorPipeline', () => {
  it('excluye ganados y perdidos', () => {
    const activos = pipelineActivo([
      crearProspecto({ id: 'a', estado: 'nuevo' }),
      crearProspecto({ id: 'b', estado: 'ganado' }),
      crearProspecto({ id: 'c', estado: 'perdido' }),
      crearProspecto({ id: 'd', estado: 'negociacion' }),
    ])
    expect(activos.map((p) => p.id)).toEqual(['a', 'd'])
  })

  it('suma el valor potencial solo del pipeline activo', () => {
    const valor = valorPipeline([
      crearProspecto({ id: 'a', estado: 'nuevo', valorPotencialMensual: 99 }),
      crearProspecto({ id: 'b', estado: 'ganado', valorPotencialMensual: 66 }),
      crearProspecto({ id: 'c', estado: 'perdido', valorPotencialMensual: 55 }),
    ])
    expect(valor).toBe(99)
  })

  it('devuelve 0 con lista vacía', () => {
    expect(valorPipeline([])).toBe(0)
  })
})

describe('ganadosEnMes', () => {
  it('el mock tiene 4 ganados en el mes actual', () => {
    const hoy = new Date(fechaHoyIso())
    const ganados = ganadosEnMes(prospectosMock, hoy.getFullYear(), hoy.getMonth() + 1)
    expect(ganados.length).toBe(4)
  })

  it('devuelve 0 para un mes sin cierres', () => {
    const ganados = ganadosEnMes(prospectosMock, 2020, 1)
    expect(ganados.length).toBe(0)
  })

  it('reconoce un ganado recién marcado en el mes en curso', () => {
    const conNuevoGanado = marcarGanado(prospectosMock, 'pro-05', HOY_ISO)
    const hoy = new Date(HOY_ISO)
    const ganados = ganadosEnMes(conNuevoGanado, hoy.getFullYear(), hoy.getMonth() + 1)
    expect(ganados.length).toBe(5)
  })
})

describe('tasaConversion', () => {
  it('calcula el porcentaje redondeado de ganados sobre el total', () => {
    const prospectos = [
      crearProspecto({ id: 'a', estado: 'ganado' }),
      crearProspecto({ id: 'b', estado: 'ganado' }),
      crearProspecto({ id: 'c', estado: 'perdido' }),
      crearProspecto({ id: 'd', estado: 'nuevo' }),
      crearProspecto({ id: 'e', estado: 'contactado' }),
      crearProspecto({ id: 'f', estado: 'demo' }),
    ]
    expect(tasaConversion(prospectos)).toBe(33)
  })

  it('devuelve 0 con lista vacía', () => {
    expect(tasaConversion([])).toBe(0)
  })
})

describe('porContactar', () => {
  it('cuenta nuevos más pipeline sin gestión 7+ días, sin duplicar', () => {
    const prospectos = [
      crearProspecto({ id: 'a', estado: 'nuevo', creadoEn: HOY_ISO }),
      crearProspecto({ id: 'b', estado: 'contactado', creadoEn: '2026-08-30' }),
      crearProspecto({ id: 'c', estado: 'contactado', creadoEn: HOY_ISO }),
      crearProspecto({ id: 'd', estado: 'ganado', creadoEn: '2026-08-30' }),
    ]
    expect(porContactar(prospectos, HOY_ISO).map((p) => p.id)).toEqual(['a', 'b'])
  })
})

describe('buscarProspectos', () => {
  it('normaliza acentos en la búsqueda', () => {
    const resultados = buscarProspectos(prospectosMock, 'raul')
    expect(resultados.map((p) => p.id)).toContain('pro-11')
  })

  it('busca por teléfono', () => {
    const resultados = buscarProspectos(prospectosMock, '987123456')
    expect(resultados.length).toBe(1)
  })

  it('busca por fuente', () => {
    const resultados = buscarProspectos(prospectosMock, 'instagram')
    expect(resultados.length).toBe(2)
  })

  it('devuelve todos con consulta vacía', () => {
    expect(buscarProspectos(prospectosMock, '  ')).toHaveLength(prospectosMock.length)
  })
})

describe('registrarGestionProspecto', () => {
  it('añade la nota y promueve de nuevo a contactado', () => {
    const resultado = registrarGestionProspecto(
      prospectosMock,
      'pro-05',
      'llamada',
      'Contestó, pide horarios',
      HOY_ISO,
    )
    const actualizado = resultado.find((p) => p.id === 'pro-05')
    expect(actualizado?.estado).toBe('contactado')
    expect(actualizado?.notasGestion.at(-1)).toEqual({
      fecha: HOY_ISO,
      nota: 'Contestó, pide horarios',
      tipo: 'llamada',
    })
  })

  it('no muta la lista original', () => {
    const original = prospectosMock.find((p) => p.id === 'pro-06')
    registrarGestionProspecto(prospectosMock, 'pro-06', 'visita', 'Vino a preguntar', HOY_ISO)
    expect(original?.notasGestion).toHaveLength(0)
  })
})

describe('marcarPerdido', () => {
  it('guarda el motivo como nota y limpia la próxima acción', () => {
    const resultado = marcarPerdido(prospectosMock, 'pro-01', 'Precio alto', HOY_ISO)
    const actualizado = resultado.find((p) => p.id === 'pro-01')
    expect(actualizado?.estado).toBe('perdido')
    expect(actualizado?.proximaAccion).toBeUndefined()
    expect(actualizado?.notasGestion.at(-1)?.nota).toBe('Perdido: Precio alto')
  })
})

describe('textoHaceDias', () => {
  it('cubre hoy, ayer y días', () => {
    expect(textoHaceDias(0)).toBe('hoy')
    expect(textoHaceDias(1)).toBe('ayer')
    expect(textoHaceDias(12)).toBe('hace 12 días')
  })
})

describe('construirMensajePrimerContacto', () => {
  it('saluda con el nombre y menciona el plan fundador', () => {
    const mensaje = construirMensajePrimerContacto('Ana')
    expect(mensaje.startsWith('Hola Ana!')).toBe(true)
    expect(mensaje).toContain('plan fundador')
  })
})

describe('prospectosMock — invariantes del pipeline', () => {
  it('tiene 14 prospectos con todos los estados', () => {
    expect(prospectosMock).toHaveLength(14)
    const estados = new Set(prospectosMock.map((p) => p.estado))
    expect(estados.size).toBe(6)
  })

  it('cubre varias fuentes', () => {
    const fuentes = new Set(prospectosMock.map((p) => p.fuente))
    expect(fuentes.size).toBeGreaterThanOrEqual(4)
  })

  it('tiene 2 prospectos con próxima acción en los próximos días', () => {
    const conAccion = prospectosMock.filter(
      (p) => p.proximaAccion !== undefined && p.proximaAccion.fecha > HOY_ISO,
    )
    expect(conAccion.length).toBe(2)
  })

  it('tiene un prospecto sin gestión hace 12+ días (alerta)', () => {
    const alertados = prospectosMock.filter((p) => diasSinGestion(p, HOY_ISO) >= 12)
    expect(alertados.length).toBe(1)
  })

  it('incluye un teléfono inválido para probar el auto-disable de WhatsApp', () => {
    const invalidos = prospectosMock.filter((p) => !telefonoValido(p.telefono))
    expect(invalidos.length).toBe(1)
  })
})
