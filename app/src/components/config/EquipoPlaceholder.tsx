import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function EquipoPlaceholder() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Gestiona los accesos de tu equipo — disponible al activar tu cuenta.
      </p>
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle>Recepcionistas y entrenadores</CardTitle>
          <CardDescription>
            Invita a tu equipo y define qué módulos puede ver cada uno.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled>
            <UserPlus /> Invitar colaborador
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
