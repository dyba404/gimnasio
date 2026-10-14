import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { etiquetaTipoNota, tiposNota } from '@/mocks/prospectos'
import type { Prospecto, TipoNotaProspecto } from '@/mocks/prospectos'

const clasesTextarea =
  'flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30'

type DialogGestionProps = {
  open: boolean
  onOpenChange: (abierto: boolean) => void
  prospecto: Prospecto | null
  onConfirmar: (prospectoId: string, tipo: TipoNotaProspecto, nota: string) => void
}

export function DialogGestion({
  open,
  onOpenChange,
  prospecto,
  onConfirmar,
}: DialogGestionProps) {
  const [tipo, setTipo] = useState<TipoNotaProspecto>('whatsapp')
  const [nota, setNota] = useState('')

  const cerrar = () => {
    setNota('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar gestión</DialogTitle>
          <DialogDescription>
            Anota el contacto con {prospecto?.nombre ?? 'el prospecto'} para dar
            seguimiento.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gestion-tipo">Tipo de contacto</Label>
            <Select value={tipo} onValueChange={(valor) => setTipo(valor as TipoNotaProspecto)}>
              <SelectTrigger id="gestion-tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiposNota.map((opcion) => (
                  <SelectItem key={opcion} value={opcion}>
                    {etiquetaTipoNota[opcion]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gestion-nota">Nota</Label>
            <textarea
              id="gestion-nota"
              className={clasesTextarea}
              value={nota}
              onChange={(evento) => setNota(evento.target.value)}
              placeholder="Ej. Contestó, pide información del plan trimestral"
              maxLength={200}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={cerrar}>
            Cancelar
          </Button>
          <Button
            disabled={nota.trim() === ''}
            onClick={() => {
              if (!prospecto || nota.trim() === '') return
              onConfirmar(prospecto.id, tipo, nota.trim())
              cerrar()
            }}
          >
            Guardar gestión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type DialogGanadoProps = {
  open: boolean
  onOpenChange: (abierto: boolean) => void
  prospecto: Prospecto | null
  onConfirmar: (prospectoId: string) => void
}

export function DialogGanado({ open, onOpenChange, prospecto, onConfirmar }: DialogGanadoProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¡Felicitaciones, venta cerrada!</DialogTitle>
          <DialogDescription>
            {prospecto?.nombre ?? 'El prospecto'} se une con el plan fundador de S/ 99 al
            mes. Lo marcaremos como ganado; después puedes registrarlo como socio desde la
            pantalla Socios.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!prospecto) return
              onConfirmar(prospecto.id)
              onOpenChange(false)
            }}
          >
            Marcar ganado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type DialogPerdidoProps = {
  open: boolean
  onOpenChange: (abierto: boolean) => void
  prospecto: Prospecto | null
  onConfirmar: (prospectoId: string, motivo: string) => void
}

export function DialogPerdido({
  open,
  onOpenChange,
  prospecto,
  onConfirmar,
}: DialogPerdidoProps) {
  const [motivo, setMotivo] = useState('')

  const cerrar = () => {
    setMotivo('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar como perdido</DialogTitle>
          <DialogDescription>
            Registra el motivo por el que {prospecto?.nombre ?? 'el prospecto'} no cerró.
            Te servirá para mejorar la venta.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="perdido-motivo">Motivo</Label>
          <Input
            id="perdido-motivo"
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            placeholder="Ej. El precio quedó fuera de su presupuesto"
            maxLength={120}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={cerrar}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={motivo.trim() === ''}
            onClick={() => {
              if (!prospecto || motivo.trim() === '') return
              onConfirmar(prospecto.id, motivo.trim())
              cerrar()
            }}
          >
            Marcar perdido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
