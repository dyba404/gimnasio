import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatoSoles } from '@/lib/format'
import type { ResumenPlan } from '@/components/pagos/logica-pagos'

type TopPlanesTablaProps = {
  datos: readonly ResumenPlan[]
}

export function TopPlanesTabla({ datos }: TopPlanesTablaProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Top planes por recaudo</CardTitle>
      </CardHeader>
      <CardContent>
        {datos.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            Sin recaudo por plan en este periodo
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="h-9 pb-2 font-medium">#</th>
                <th className="h-9 pb-2 font-medium">Plan</th>
                <th className="h-9 pb-2 text-right font-medium">Pagos</th>
                <th className="h-9 pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((plan, indice) => (
                <tr key={plan.planId} className="border-t">
                  <td className="py-2.5 tabular-nums text-muted-foreground">{indice + 1}</td>
                  <td className="py-2.5 font-medium">{plan.planNombre}</td>
                  <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                    {plan.cantidad}
                  </td>
                  <td className="py-2.5 text-right font-medium tabular-nums">
                    {formatoSoles(plan.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
