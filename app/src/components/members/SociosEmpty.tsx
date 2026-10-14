import { SearchX, UserRoundPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type SociosEmptyProps = {
  variante: 'vacio' | 'sin-resultados'
  busqueda?: string
  onNuevo?: () => void
}

export function SociosEmpty({ variante, busqueda, onNuevo }: SociosEmptyProps) {
  const esVacio = variante === 'vacio'
  return (
    <Card className="py-12">
      <CardContent className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          {esVacio ? (
            <UserRoundPlus className="size-6 text-muted-foreground" />
          ) : (
            <SearchX className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1">
          <p className="font-medium">
            {esVacio ? 'Aún no hay socios' : 'Sin resultados para tu búsqueda'}
          </p>
          <p className="text-sm text-muted-foreground">
            {esVacio
              ? 'Registra tu primer miembro para empezar a gestionar membresías.'
              : busqueda
                ? `No encontramos socios que coincidan con "${busqueda}".`
                : 'Prueba con otro nombre o DNI.'}
          </p>
        </div>
        {esVacio && onNuevo ? (
          <Button onClick={onNuevo}>
            <UserRoundPlus /> Nuevo socio
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
