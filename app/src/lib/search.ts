export type SocioBuscable = {
  nombre: string
  dni: string
  codigo: string
}

export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function buscarSocios<T extends SocioBuscable>(
  socios: readonly T[],
  query: string,
  limite = 8,
): T[] {
  const consulta = normalizar(query.trim())
  if (consulta.length === 0) return []
  return socios
    .filter(
      (socio) =>
        normalizar(socio.nombre).includes(consulta) ||
        socio.dni.includes(consulta) ||
        normalizar(socio.codigo).includes(consulta),
    )
    .slice(0, limite)
}
