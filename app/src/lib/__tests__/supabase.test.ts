import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectarSupabase } from '../supabase'

describe('detectarSupabase', () => {
  it('false sin variables', () => {
    expect(detectarSupabase(undefined, undefined)).toBe(false)
  })

  it('false con solo una variable', () => {
    expect(detectarSupabase('https://demo.supabase.co', undefined)).toBe(false)
    expect(detectarSupabase(undefined, 'clave')).toBe(false)
  })

  it('false con strings vacíos o espacios', () => {
    expect(detectarSupabase('', '')).toBe(false)
    expect(detectarSupabase('   ', 'clave')).toBe(false)
    expect(detectarSupabase('https://demo.supabase.co', '   ')).toBe(false)
  })

  it('true con url y anon key', () => {
    expect(detectarSupabase('https://demo.supabase.co', 'clave')).toBe(true)
  })
})

describe('supabaseDisponible sin variables de entorno', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('false y clienteSupabase null (modo demo)', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    vi.resetModules()
    const mod = await import('../supabase')
    expect(mod.supabaseDisponible()).toBe(false)
    expect(mod.clienteSupabase()).toBeNull()
  })
})

describe('supabaseDisponible con variables stubeadas', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('true y cliente no nulo con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://demo.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'clave-anonima-demo')
    vi.stubEnv('VITE_DEMO_MODE', '')
    vi.resetModules()
    const mod = await import('../supabase')
    expect(mod.supabaseDisponible()).toBe(true)
    expect(mod.clienteSupabase()).not.toBeNull()
  })

  it('false con URL en blanco', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '   ')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'clave-anonima-demo')
    vi.stubEnv('VITE_DEMO_MODE', '')
    vi.resetModules()
    const mod = await import('../supabase')
    expect(mod.supabaseDisponible()).toBe(false)
    expect(mod.clienteSupabase()).toBeNull()
  })

  it('false con VITE_DEMO_MODE activo aunque haya URL y KEY (demo explícita gana)', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://demo.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'clave-anonima-demo')
    vi.stubEnv('VITE_DEMO_MODE', '1')
    vi.resetModules()
    const mod = await import('../supabase')
    expect(mod.supabaseDisponible()).toBe(false)
    expect(mod.clienteSupabase()).toBeNull()
  })
})
