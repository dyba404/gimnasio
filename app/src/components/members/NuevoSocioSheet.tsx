import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { planesMock } from '@/mocks/data'
import type { GestionCobranza } from '@/mocks/bitacora'
import type { Plan, Socio } from '@/mocks/types'
import { FamiliaCard } from './FamiliaCard'
import { HistorialAsistencia } from './HistorialAsistencia'
import { BitacoraCobranza } from './BitacoraCobranza'
import { LogrosSocio } from './LogrosSocio'
import { ProgresoCorporal } from './ProgresoCorporal'

export type BorradorSocio = {
  nombre: string
  dni: string
  telefono: string
  planId: string
}

type NuevoSocioSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  socio: Socio | null
  planes?: readonly Plan[]
  onGuardar?: (borrador: BorradorSocio, socioId: string | null) => Promise<boolean>
  onGuardado?: () => void
  fechasAsistencias?: readonly string[]
  ultimaAsistencia?: string | null
  gestiones?: readonly GestionCobranza[]
  onRegistrarGestion?: (input: {
    socioId: string
    tipo: string
    nota: string
    resultado: string
  }) => Promise<boolean>
}

const selectClases =
  'h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none md:text-sm focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30'

export function NuevoSocioSheet({
  open,
  onOpenChange,
  socio,
  planes = planesMock,
  onGuardar,
  onGuardado,
  fechasAsistencias,
  ultimaAsistencia,
  gestiones,
  onRegistrarGestion,
}: NuevoSocioSheetProps) {
  const [nombre, setNombre] = useState('')
  const [dni, setDni] = useState('')
  const [telefono, setTelefono] = useState('')
  const [planId, setPlanId] = useState<string>(planesMock[0].id)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (open) {
      setNombre(socio?.nombre ?? '')
      setDni(socio?.dni ?? '')
      setTelefono(socio?.telefono ?? '')
      setPlanId(socio?.planId ?? planes[0]?.id ?? planesMock[0].id)
      setGuardando(false)
      setError(false)
    }
  }, [open, socio, planes])

  const guardar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    if (guardando) return
    if (onGuardar === undefined) {
      onGuardado?.()
      onOpenChange(false)
      return
    }
    setGuardando(true)
    setError(false)
    const ok = await onGuardar(
      { nombre: nombre.trim(), dni: dni.trim(), telefono: telefono.trim(), planId },
      socio?.id ?? null,
    )
    setGuardando(false)
    if (!ok) {
      setError(true)
      return
    }
    onGuardado?.()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0">
        <SheetHeader className="pb-4">
          <SheetTitle>{socio ? 'Editar socio' : 'Nuevo socio'}</SheetTitle>
          <SheetDescription>
            {socio
              ? 'Actualiza los datos del socio y guarda los cambios.'
              : 'Registra los datos del nuevo miembro de tu gimnasio.'}
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
          onSubmit={(evento) => {
            void guardar(evento)
          }}
        >
          <div className="space-y-2">
            <label htmlFor="socio-nombre" className="text-sm font-medium">
              Nombre completo
            </label>
            <Input
              id="socio-nombre"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Ej. Rosa Ñahui Quispe"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="socio-dni" className="text-sm font-medium">
              DNI
            </label>
            <Input
              id="socio-dni"
              value={dni}
              onChange={(evento) => setDni(evento.target.value)}
              placeholder="8 dígitos"
              inputMode="numeric"
              maxLength={8}
              pattern="\d{8}"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="socio-telefono" className="text-sm font-medium">
              Teléfono
            </label>
            <Input
              id="socio-telefono"
              value={telefono}
              onChange={(evento) => setTelefono(evento.target.value)}
              placeholder="9XX XXX XXX"
              inputMode="tel"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="socio-plan" className="text-sm font-medium">
              Plan
            </label>
            <select
              id="socio-plan"
              value={planId}
              onChange={(evento) => setPlanId(evento.target.value)}
              className={selectClases}
            >
              {planes.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.nombre} — S/ {plan.precio}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
              No se pudo guardar. Revisa los datos e intenta de nuevo.
            </p>
          )}
          {socio && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">Asistencia</p>
                <HistorialAsistencia
                  socioId={socio.id}
                  fechas={fechasAsistencias}
                  ultimaFecha={ultimaAsistencia}
                />
              </div>
              <Separator />
              <ProgresoCorporal socioId={socio.id} />
              <Separator />
              <LogrosSocio socioId={socio.id} />
              <Separator />
              <BitacoraCobranza
                socioId={socio.id}
                compacto
                gestiones={gestiones}
                onRegistrar={onRegistrarGestion}
              />
              <FamiliaCard socioId={socio.id} />
            </>
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
