import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function valorEnv(clave: string): string {
  const entorno = import.meta.env as Record<string, unknown> | undefined
  const valor = entorno?.[clave]
  return typeof valor === 'string' ? valor.trim() : ''
}

export function detectarSupabase(
  url: string | undefined,
  anonKey: string | undefined,
): boolean {
  return (
    typeof url === 'string' &&
    url.trim() !== '' &&
    typeof anonKey === 'string' &&
    anonKey.trim() !== ''
  )
}

let cliente: SupabaseClient | null = null

export function supabaseDisponible(): boolean {
  const entorno = import.meta.env as Record<string, unknown> | undefined
  const demoExplicito =
    typeof entorno?.VITE_DEMO_MODE === 'string' &&
    entorno.VITE_DEMO_MODE.trim() !== ''
  if (demoExplicito) return false
  return detectarSupabase(
    valorEnv('VITE_SUPABASE_URL'),
    valorEnv('VITE_SUPABASE_ANON_KEY'),
  )
}

export function clienteSupabase(): SupabaseClient | null {
  if (!supabaseDisponible()) return null
  cliente ??= createClient(
    valorEnv('VITE_SUPABASE_URL'),
    valorEnv('VITE_SUPABASE_ANON_KEY'),
  )
  return cliente
}
