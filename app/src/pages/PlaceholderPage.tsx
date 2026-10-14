import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type PlaceholderPageProps = {
  title?: string
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {title ?? 'Página no encontrada'}
        </h2>
        <p className="text-sm text-muted-foreground">
          La dirección que buscas no existe o fue movida.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>404</CardTitle>
          <CardDescription>
            Revisa la dirección en la barra del navegador o vuelve al panel
            principal para seguir gestionando tu gimnasio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/">Volver al panel</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
