import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { clienteSupabase } from '@/lib/supabase'
import { TEXTO_APP_SIN_CONFIGURAR, produccionSinBackend } from './config'

const WHATSAPP_VENTAS = '51999999999'

const LINK_SOLICITAR_ACCESO = `https://wa.me/${WHATSAPP_VENTAS}?text=${encodeURIComponent('Hola, quiero acceso a Marsmode para mi gimnasio.')}`

type LoginPageProps = {
  onLogin?: (email: string) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const navegar = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [avisoDemo, setAvisoDemo] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function iniciarSesion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)
    setAvisoDemo(null)
    const correo = email.trim()
    if (correo === '' || password === '') {
      setError('Ingresa tu correo y contraseña.')
      return
    }
    if (produccionSinBackend()) {
      setError(TEXTO_APP_SIN_CONFIGURAR)
      return
    }
    const cliente = clienteSupabase()
    if (cliente) {
      setEnviando(true)
      const { error: errorAuth } = await cliente.auth.signInWithPassword({
        email: correo,
        password,
      })
      setEnviando(false)
      if (errorAuth) {
        setError(errorAuth.message)
        return
      }
      onLogin?.(correo)
      navegar('/')
      return
    }
    console.info(
      '[Marsmode] Modo demo: sin backend conectado (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY vacías). La credencial se acepta para navegar con mocks.',
    )
    setAvisoDemo('Modo demo — sin backend conectado. Cualquier credencial entra para navegar la app.')
    onLogin?.(correo)
    navegar('/')
  }

  return (
    <div className="grid min-h-svh place-items-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
            M
          </div>
          <CardTitle className="text-2xl">Marsmode</CardTitle>
          <CardDescription>Gestión de tu gimnasio</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={iniciarSesion} noValidate className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="dueno@migym.pe"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
              />
            </div>
            {error !== null && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {avisoDemo !== null && (
              <p className="text-sm text-muted-foreground" role="status">
                {avisoDemo}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <a
            href={LINK_SOLICITAR_ACCESO}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Solicitar acceso
          </a>
        </CardFooter>
      </Card>
    </div>
  )
}

export default LoginPage
