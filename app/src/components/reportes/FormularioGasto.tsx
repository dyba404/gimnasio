import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CATEGORIAS_GASTO, etiquetaCategoria } from '@/mocks/gastos'
import type { CategoriaGasto, Gasto } from '@/mocks/gastos'

type FormularioGastoProps = {
  onRegistrar: (gasto: Gasto) => boolean | Promise<boolean>
}

function hoyIso(): string {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}

export function FormularioGasto({ onRegistrar }: FormularioGastoProps) {
  const [categoria, setCategoria] = useState<CategoriaGasto>('otros')
  const [descripcion, setDescripcion] = useState('')
  const [proveedor, setProveedor] = useState('')
  const [montoTexto, setMontoTexto] = useState('')
  const [registrando, setRegistrando] = useState(false)
  const [error, setError] = useState(false)

  const monto = Number(montoTexto)
  const montoValido = montoTexto !== '' && Number.isFinite(monto) && monto > 0
  const valido = descripcion.trim() !== '' && montoValido && !registrando

  const limpiar = () => {
    setCategoria('otros')
    setDescripcion('')
    setProveedor('')
    setMontoTexto('')
    setError(false)
  }

  const guardar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    if (!valido || registrando) return
    setRegistrando(true)
    setError(false)
    const ok = await onRegistrar({
      id: `gasto-local-${Date.now()}`,
      categoria,
      descripcion: descripcion.trim(),
      proveedor: proveedor.trim() !== '' ? proveedor.trim() : 'Varios',
      monto,
      fecha: hoyIso(),
    })
    setRegistrando(false)
    if (ok === false) {
      setError(true)
      return
    }
    limpiar()
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Registrar gasto</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(evento) => {
            void guardar(evento)
          }}
        >
          <div className="space-y-2">
            <label htmlFor="gasto-categoria" className="text-sm font-medium">
              Categoría
            </label>
            <Select
              value={categoria}
              onValueChange={(valor) => setCategoria(valor as CategoriaGasto)}
            >
              <SelectTrigger id="gasto-categoria" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_GASTO.map((opcion) => (
                  <SelectItem key={opcion} value={opcion}>
                    {etiquetaCategoria[opcion]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="gasto-descripcion" className="text-sm font-medium">
              Descripción
            </label>
            <Input
              id="gasto-descripcion"
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
              placeholder="Ej. Reparación de aire acondicionado"
              maxLength={80}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="gasto-proveedor" className="text-sm font-medium">
                Proveedor
              </label>
              <Input
                id="gasto-proveedor"
                value={proveedor}
                onChange={(evento) => setProveedor(evento.target.value)}
                placeholder="Varios"
                maxLength={60}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="gasto-monto" className="text-sm font-medium">
                Monto (S/)
              </label>
              <Input
                id="gasto-monto"
                type="number"
                min="0.01"
                step="0.01"
                value={montoTexto}
                onChange={(evento) => setMontoTexto(evento.target.value)}
                placeholder="0.00"
                aria-invalid={montoTexto !== '' && !montoValido}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={!valido}>
            <Plus className="size-4" />
            {registrando ? 'Registrando…' : 'Registrar'}
          </Button>
          {error && (
            <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
              No se pudo registrar el gasto. Intenta de nuevo.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
