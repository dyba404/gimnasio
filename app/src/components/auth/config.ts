import { supabaseDisponible } from '@/lib/supabase'

export const TEXTO_APP_SIN_CONFIGURAR =
  'App sin configurar: faltan las credenciales del servidor (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).'

/**
 * En producción el build sin backend debe quedar CERRADO (login bloqueado y
 * rutas protegidas selladas). En desarrollo se mantiene el flujo demo.
 */
export function produccionSinBackend(): boolean {
  return import.meta.env.MODE === 'production' && !supabaseDisponible()
}
