import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { planesMock, sociosMock, sumarDiasIso } from '@/mocks/data'
import { hoyIso } from '@/components/memberships/congelamiento'
import type { Membresia, Plan, Socio } from '@/mocks/types'

export type BorradorMembresia = {
  socioId: string
  planId: string
  fechaInicio: string
  fechaFin: string
  monto: number
}

type NuevaMembresiaSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  socios?: readonly Socio[]
  planes?: readonly Plan[]
  onGuardar?: (borrador: BorradorMembresia) => Promise<boolean>
  onGuardado?: (membresia: Membresia) => void
}

const selectClases =
  'h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none md:text-sm focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30'

export function NuevaMembresiaSheet({
  open,
  onOpenChange,
  socios = sociosMock,
  planes = planesMock,
  onGuardar,
  onGuardado,
}: NuevaMembresiaSheetProps) {
  const [socioId, setSocioId] = useState<string>(socios[0]?.id ?? '')
  const [planId, setPlanId] = useState<string>(planes[0]?.id ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (open) {
      setSocioId(socios[0]?.id ?? '')
      setPlanId(planes[0]?.id ?? '')
      setGuardando(false)
      setError(false)
    }
  }, [open, socios, planes])

  const guardar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    if (guardando) return
    const plan = planes.find((candidato) => candidato.id === planId)
    if (plan === undefined) {
      setError(true)
      return
    }
    const fechaInicio = hoyIso()
    const fechaFin = sumarDiasIso(fechaInicio, plan.duracionDias)
    if (onGuardar === undefined) {
      onGuardado?.({
        id: `local-${Date.now()}`,
        socioId,
        planId,
        fechaInicio,
        fechaFin,
        monto: plan.precio,
        estado: 'vigente',
      })
      onOpenChange(false)
      return
    }
    setGuardando(true)
    setError(false)
    const ok = await onGuardar({ socioId, planId, fechaInicio, fechaFin, monto: plan.precio })
    setGuardando(false)
    if (!ok) {
      setError(true)
      return
    }
    onGuardado?.({
      id: `local-${Date.now()}`,
      socioId,
      planId,
      fechaInicio,
      fechaFin,
      monto: plan.precio,
      estado: 'vigente',
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0">
        <SheetHeader className="pb-4">
          <SheetTitle>Nueva membresía</SheetTitle>
          <SheetDescription>
            Asigna un plan a un socio para activar su membresía.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
          onSubmit={(evento) => {
            void guardar(evento)
          }}
        >
          <div className="space-y-2">
            <label htmlFor="membresia-socio" className="text-sm font-medium">
              Socio
            </label>
            <select
              id="membresia-socio"
              value={socioId}
              onChange={(evento) => setSocioId(evento.target.value)}
              className={selectClases}
            >
              {socios.map((socio) => (
                <option key={socio.id} value={socio.id}>
                  {socio.nombre} — {socio.dni}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="membresia-plan" className="text-sm font-medium">
              Plan
            </label>
            <select
              id="membresia-plan"
              value={planId}
              onChange={(evento) => setPlanId(evento.target.value)}
              className={selectClases}
            >
              {planes.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.nombre} — S/ {plan.precio} / {plan.duracionDias} días
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
              No se pudo guardar. Revisa los datos e intenta de nuevo.
            </p>
          )}
          <SheetFooter className="flex-row gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
