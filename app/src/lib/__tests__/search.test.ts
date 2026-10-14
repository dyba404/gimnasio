import { describe, expect, it } from 'vitest'
import { buscarSocios, normalizar } from '../search'
import { sociosMock } from '@/mocks/data'

describe('normalizar', () => {
  it('quita diacríticos y pasa a minúsculas', () => {
    expect(normalizar('Sánchez')).toBe('sanchez')
    expect(normalizar('Álvaro')).toBe('alvaro')
    expect(normalizar('María Gracia')).toBe('maria gracia')
  })

  it('ñ se mapea a n', () => {
    expect(normalizar('Ñahui')).toBe('nahui')
    expect(normalizar('Muñoz')).toBe('munoz')
  })

  it('conserva dígitos y guiones', () => {
    expect(normalizar('MS-001')).toBe('ms-001')
  })
})

describe('buscarSocios', () => {
  it('encuentra por apellido sin acento aunque el mock lo tenga con acento', () => {
    expect(buscarSocios(sociosMock, 'sanchez').map((s) => s.id)).toEqual(['soc-09'])
  })

  it('también funciona con la query acentuada', () => {
    expect(buscarSocios(sociosMock, 'sánchez').map((s) => s.id)).toEqual(['soc-09'])
  })

  it('encuentra por nombre con ñ sin teclear la ñ', () => {
    expect(buscarSocios(sociosMock, 'nahui').map((s) => s.id)).toEqual(['soc-01'])
  })

  it('acepta nombre parcial con varias palabras en orden', () => {
    expect(buscarSocios(sociosMock, 'rosa ñahui').map((s) => s.id)).toEqual(['soc-01'])
  })

  it('encuentra por DNI exacto', () => {
    expect(buscarSocios(sociosMock, '40112958').map((s) => s.id)).toEqual(['soc-02'])
  })

  it('encuentra por código aunque se teclee en minúscula', () => {
    expect(buscarSocios(sociosMock, 'ms-003').map((s) => s.id)).toEqual(['soc-03'])
  })

  it('prefijo de código devuelve todas las coincidencias', () => {
    const codigos = buscarSocios(sociosMock, 'ms-01').map((s) => s.codigo)
    expect(codigos).toEqual(['MS-010', 'MS-011', 'MS-012'])
    expect(buscarSocios(sociosMock, 'ms-0', 12)).toHaveLength(12)
  })

  it('query vacía o solo espacios: sin resultados', () => {
    expect(buscarSocios(sociosMock, '')).toEqual([])
    expect(buscarSocios(sociosMock, '   ')).toEqual([])
  })

  it('sin coincidencias: lista vacía', () => {
    expect(buscarSocios(sociosMock, 'zzzz')).toEqual([])
  })

  it('respeta el límite de resultados', () => {
    expect(buscarSocios(sociosMock, 'a', 2)).toHaveLength(2)
  })
})
