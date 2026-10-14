import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { TEXTO_APP_SIN_CONFIGURAR, produccionSinBackend } from './config'
import { clienteSupabase } from '@/lib/supabase'

type RutaProtegidaProps = {
  children: ReactNode
}

function PantallaSinConfigurar() {
  return (
    <div className="grid min-h-svh place-items-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>App sin configurar</CardTitle>
          <CardDescription>{TEXTO_APP_SIN_CONFIGURAR}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Contacta al soporte de Marsmode para conectar tu gimnasio antes de
          usar la aplicación.
        </CardContent>
      </Card>
    </div>
  )
}

export function RutaProtegida({ children }: RutaProtegidaProps) {
  const [estado, setEstado] = useState<'verificando' | 'permitido' | 'denegado'>(
    'verificando',
  )

  useEffect(() => {
    if (produccionSinBackend()) {
      return
    }
    const cliente = clienteSupabase()
    if (!cliente) {
      setEstado('permitido')
      return
    }
    void cliente.auth.getSession().then(({ data }) => {
      setEstado(data.session ? 'permitido' : 'denegado')
    })
  }, [])

  if (produccionSinBackend()) {
    return <PantallaSinConfigurar />
  }
  if (estado === 'verificando') {
    return <div className="min-h-svh bg-background" />
  }
  if (estado === 'denegado') {
    return <Navigate to="/login" replace />
  }
  return children
}
