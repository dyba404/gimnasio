import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const GIMNASIO_INICIAL = {
  nombre: 'Marsmode Fitness',
  ruc: '10467821365',
  direccion: 'Av. Arequipa 2450, Lince — Lima',
  telefono: '987 654 321',
}

export function GimnasioForm() {
  const [datos, setDatos] = useState(GIMNASIO_INICIAL)
  const [guardado, setGuardado] = useState(false)

  const actualizar = (campo: keyof typeof GIMNASIO_INICIAL, valor: string) => {
    setGuardado(false)
    setDatos((previos) => ({ ...previos, [campo]: valor }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos del gimnasio</CardTitle>
        <CardDescription>
          Información que aparece en carnés, recibos y reportes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(evento) => {
            evento.preventDefault()
            setGuardado(true)
          }}
        >
          <div className="flex items-end gap-4">
            <div
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-semibold text-primary-foreground"
            >
              {datos.nombre.trim().charAt(0).toUpperCase() || 'G'}
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="gym-nombre">Nombre del gimnasio</Label>
              <Input
                id="gym-nombre"
                value={datos.nombre}
                onChange={(evento) => actualizar('nombre', evento.target.value)}
                placeholder="Ej. Marsmode Fitness"
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="gym-ruc">RUC</Label>
              <Input
                id="gym-ruc"
                value={datos.ruc}
                onChange={(evento) => actualizar('ruc', evento.target.value)}
                placeholder="11 dígitos"
                inputMode="numeric"
                maxLength={11}
                pattern="\d{11}"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gym-telefono">Teléfono</Label>
              <Input
                id="gym-telefono"
                value={datos.telefono}
                onChange={(evento) => actualizar('telefono', evento.target.value)}
                placeholder="9XX XXX XXX"
                inputMode="tel"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gym-direccion">Dirección</Label>
            <Input
              id="gym-direccion"
              value={datos.direccion}
              onChange={(evento) => actualizar('direccion', evento.target.value)}
              placeholder="Calle, número, distrito"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit">Guardar cambios</Button>
            {guardado ? (
              <p
                role="status"
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400"
              >
                <Check className="size-4" /> Cambios guardados
              </p>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
