import { describe, expect, it } from 'vitest'
import { buscarSocios } from '@/lib/search'
import { sociosMock } from '@/mocks/data'
import type { SocioBuscable } from '@/lib/search'

function socio(nombre: string, dni: string): SocioBuscable {
  return { nombre, dni, codigo: 'MS-999' }
}

const sociosPrueba: readonly SocioBuscable[] = [
  socio('Pedro Núñez Quispe', '45782136'),
  socio('Darío Ramírez Torres', '40112958'),
  socio('María Gracia Belaúnde', '44120765'),
]

describe('búsqueda de socios (integración con lib/search)', () => {
  it('"nunez" encuentra "Núñez" (ignora tildes y mayúsculas)', () => {
    const resultados = buscarSocios(sociosPrueba, 'nunez')
    expect(resultados).toHaveLength(1)
    expect(resultados[0]?.nombre).toBe('Pedro Núñez Quispe')
  })

  it('"NÚÑEZ" también encuentra (insensible a mayúsculas)', () => {
    const resultados = buscarSocios(sociosPrueba, 'NÚÑEZ')
    expect(resultados[0]?.nombre).toBe('Pedro Núñez Quispe')
  })

  it('"dario" encuentra "Darío" (ignora tildes)', () => {
    const resultados = buscarSocios(sociosPrueba, 'dario')
    expect(resultados).toHaveLength(1)
    expect(resultados[0]?.nombre).toBe('Darío Ramírez Torres')
  })

  it('DNI parcial encuentra por prefijo de documento', () => {
    const resultados = buscarSocios(sociosPrueba, '4578')
    expect(resultados).toHaveLength(1)
    expect(resultados[0]?.nombre).toBe('Pedro Núñez Quispe')
    expect(buscarSocios(sociosPrueba, '4011')[0]?.nombre).toBe('Darío Ramírez Torres')
  })

  it('consulta sin coincidencias devuelve vacío', () => {
    expect(buscarSocios(sociosPrueba, 'zzz')).toEqual([])
  })

  it('consulta vacía devuelve vacío (el padre decide mostrar todos)', () => {
    expect(buscarSocios(sociosPrueba, '')).toEqual([])
    expect(buscarSocios(sociosPrueba, '   ')).toEqual([])
  })

  it('respeta el límite de resultados', () => {
    expect(buscarSocios(sociosPrueba, 'a', 2)).toHaveLength(2)
  })

  it('busca sobre sociosMock reales sin truncar con limite = length', () => {
    const resultados = buscarSocios(sociosMock, 'nahui', sociosMock.length)
    expect(resultados[0]?.nombre).toBe('Rosa Ñahui Quispe')
    const todos = buscarSocios(sociosMock, 'a', sociosMock.length)
    expect(todos.length).toBeGreaterThan(2)
  })
})
