import { SearchX, UserRoundPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type ProspectosEmptyProps = {
  variante: 'vacio' | 'sin-resultados'
  busqueda?: string
  onLimpiar?: () => void
}

export function ProspectosEmpty({ variante, busqueda, onLimpiar }: ProspectosEmptyProps) {
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
            {esVacio ? 'Aún no hay prospectos' : 'Sin resultados para tu búsqueda'}
          </p>
          <p className="text-sm text-muted-foreground">
            {esVacio
              ? 'Captura a tu primer interesado para hacer seguimiento hasta cerrar la venta.'
              : busqueda
                ? `No encontramos prospectos que coincidan con "${busqueda}".`
                : 'Prueba con otro nombre o cambia el filtro de estado.'}
          </p>
        </div>
        {!esVacio && onLimpiar ? (
          <Button variant="outline" onClick={onLimpiar}>
            Limpiar filtros
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
