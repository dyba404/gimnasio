import { describe, expect, it } from 'vitest'
import {
  bitacoraMock,
  claseResultado,
  contarGestiones,
  etiquetaResultado,
  etiquetaTipo,
  fechaHoyIso,
  fechaRelativa,
  gestionesDeSocio,
  gestionesRecientes,
  registrarGestion,
  ultimaGestion,
} from '../bitacora'

const HOY = new Date()
HOY.setHours(0, 0, 0, 0)

function isoHace(dias: number): string {
  const fecha = new Date(HOY)
  fecha.setDate(fecha.getDate() - dias)
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

describe('bitacoraMock — datos base', () => {
  it('12 gestiones con ids únicos y fecha ISO', () => {
    expect(bitacoraMock).toHaveLength(12)
    const ids = bitacoraMock.map((gestion) => gestion.id)
    expect(new Set(ids).size).toBe(12)
    for (const gestion of bitacoraMock) {
      expect(gestion.id).toMatch(/^ges-\d{3}$/)
      expect(gestion.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('solo cubre a los 3 morosos: soc-04, soc-09, soc-12', () => {
    const socioIds = new Set(bitacoraMock.map((gestion) => gestion.socioId))
    expect([...socioIds].sort()).toEqual(['soc-04', 'soc-09', 'soc-12'])
  })

  it('Kevin tiene exactamente 3 gestiones: whatsapp no-responde, llamada prometió, whatsapp pendiente', () => {
    const kevin = gestionesDeSocio('soc-04')
    expect(kevin).toHaveLength(3)
    expect(kevin.map((gestion) => gestion.tipo)).toEqual(['whatsapp', 'llamada', 'whatsapp'])
    expect(kevin.map((gestion) => gestion.resultado)).toEqual([
      'pendiente',
      'prometio',
      'no-responde',
    ])
  })

  it('etiquetas visibles en español', () => {
    expect(etiquetaTipo.whatsapp).toBe('WhatsApp')
    expect(etiquetaTipo.llamada).toBe('Llamada')
    expect(etiquetaTipo.visita).toBe('Visita')
    expect(etiquetaTipo.recordatorio).toBe('Recordatorio')
    expect(etiquetaResultado['pagara-hoy']).toBe('Paga hoy')
    expect(etiquetaResultado['no-responde']).toBe('No responde')
    expect(etiquetaResultado.negocia).toBe('Negociando')
  })

  it('clases de color: verde para paga hoy, ámbar prometió/negocia, rojo no responde, gris pendiente', () => {
    expect(claseResultado['pagara-hoy']).toContain('emerald')
    expect(claseResultado.prometio).toContain('amber')
    expect(claseResultado.negocia).toContain('amber')
    expect(claseResultado['no-responde']).toContain('red')
    expect(claseResultado.pendiente).toContain('muted')
  })
})

describe('gestionesDeSocio — filtro y orden', () => {
  it('devuelve solo gestiones del socio en orden desc por fecha', () => {
    const gestiones = gestionesDeSocio('soc-12')
    expect(gestiones).toHaveLength(5)
    for (const gestion of gestiones) {
      expect(gestion.socioId).toBe('soc-12')
    }
    for (let i = 1; i < gestiones.length; i++) {
      expect(gestiones[i - 1]!.fecha >= gestiones[i]!.fecha).toBe(true)
    }
  })

  it('socio sin gestiones → array vacío', () => {
    expect(gestionesDeSocio('soc-99')).toEqual([])
  })
})

describe('registrarGestion — inmutable e id incremental', () => {
  it('no muta el array original y añade la nueva gestión al inicio con id incremental', () => {
    const nueva = {
      socioId: 'soc-04',
      tipo: 'llamada' as const,
      resultado: 'prometio' as const,
      nota: 'Test de registro',
      fecha: fechaHoyIso(),
    }
    const resultado = registrarGestion(bitacoraMock, nueva)
    expect(bitacoraMock).toHaveLength(12)
    expect(bitacoraMock.some((gestion) => gestion.id === 'ges-013')).toBe(false)
    expect(resultado).toHaveLength(13)
    expect(resultado[0]?.id).toBe('ges-013')
    expect(resultado[0]?.nota).toBe('Test de registro')
    expect(resultado.slice(1)).toEqual([...bitacoraMock])
  })

  it('id incremental acumulativo en llamadas sucesivas', () => {
    const base: typeof bitacoraMock = []
    const primera = registrarGestion(base, {
      socioId: 'soc-99',
      tipo: 'visita',
      resultado: 'pendiente',
      nota: 'Primera',
      fecha: fechaHoyIso(),
    })
    const segunda = registrarGestion(primera, {
      socioId: 'soc-99',
      tipo: 'visita',
      resultado: 'pendiente',
      nota: 'Segunda',
      fecha: fechaHoyIso(),
    })
    expect(primera[0]?.id).toBe('ges-001')
    expect(segunda[0]?.id).toBe('ges-002')
    expect(segunda.map((gestion) => gestion.nota)).toEqual(['Segunda', 'Primera'])
  })
})

describe('gestionesRecientes — ventana de días', () => {
  it('ventana de 1 día incluye solo las gestiones de hoy', () => {
    const recientes = gestionesRecientes(1)
    expect(recientes).toHaveLength(2)
    for (const gestion of recientes) {
      expect(gestion.fecha).toBe(fechaHoyIso())
    }
  })

  it('ventana de 0 días → vacío', () => {
    expect(gestionesRecientes(0)).toEqual([])
  })

  it('ventana de 7 días excluye gestiones de hace 10', () => {
    const recientes = gestionesRecientes(7)
    expect(recientes.every((gestion) => gestion.fecha >= isoHace(6))).toBe(true)
    expect(recientes.some((gestion) => gestion.fecha === isoHace(10))).toBe(false)
    expect(recientes).toHaveLength(9)
  })

  it('ventana amplia (30 días) devuelve todo el mock', () => {
    expect(gestionesRecientes(30)).toHaveLength(bitacoraMock.length)
  })
})

describe('contarGestiones y ultimaGestion', () => {
  it('contadores por moroso: Kevin 3, Gabriela 4, Álvaro 5, resto 0', () => {
    expect(contarGestiones('soc-04')).toBe(3)
    expect(contarGestiones('soc-09')).toBe(4)
    expect(contarGestiones('soc-12')).toBe(5)
    expect(contarGestiones('soc-99')).toBe(0)
  })

  it('contarGestiones coincide con el largo de gestionesDeSocio', () => {
    for (const socioId of ['soc-04', 'soc-09', 'soc-12', 'soc-99']) {
      expect(contarGestiones(socioId)).toBe(gestionesDeSocio(socioId).length)
    }
  })

  it('ultimaGestion devuelve la más reciente o undefined', () => {
    const ultima = ultimaGestion('soc-04')
    expect(ultima?.tipo).toBe('whatsapp')
    expect(ultima?.fecha).toBe(fechaHoyIso())
    expect(ultimaGestion('soc-99')).toBeUndefined()
  })
})

describe('fechaRelativa — formato simple', () => {
  it('hoy, ayer y hace N días', () => {
    expect(fechaRelativa(isoHace(0))).toBe('hoy')
    expect(fechaRelativa(isoHace(1))).toBe('ayer')
    expect(fechaRelativa(isoHace(5))).toBe('hace 5 días')
    expect(fechaRelativa(isoHace(9))).toBe('hace 9 días')
  })
})
