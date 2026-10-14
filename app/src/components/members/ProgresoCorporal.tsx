import { useState } from 'react'
import type { FormEvent } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Plus, Ruler } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fechaHoyIso } from '@/mocks/bitacora'
import {
  categoriaImc,
  delta,
  direccionDelta,
  imc,
  medicionesMock,
  progresoGrafico,
  serieMediciones,
} from '@/mocks/mediciones'
import type {
  CampoMedicion,
  CategoriaImc,
  DireccionDelta,
  Medicion,
} from '@/mocks/mediciones'
import { cn } from '@/lib/utils'

type ProgresoCorporalProps = {
  socioId: string
  mediciones?: readonly Medicion[]
}

const ETIQUETAS: Record<CampoMedicion, string> = {
  pesoKg: 'Peso',
  grasaPct: 'Grasa',
  alturaCm: 'Altura',
  cuelloCm: 'Cuello',
  pechoCm: 'Pecho',
  cinturaCm: 'Cintura',
  brazoCm: 'Brazo',
  musloCm: 'Muslo',
}

const UNIDADES: Record<CampoMedicion, string> = {
  pesoKg: 'kg',
  grasaPct: '%',
  alturaCm: 'cm',
  cuelloCm: 'cm',
  pechoCm: 'cm',
  cinturaCm: 'cm',
  brazoCm: 'cm',
  musloCm: 'cm',
}

const SEGUIMIENTO: readonly CampoMedicion[] = [
  'pesoKg',
  'grasaPct',
  'cinturaCm',
  'brazoCm',
  'pechoCm',
  'musloCm',
]

const CAMPOS_FORM: readonly CampoMedicion[] = [
  'pesoKg',
  'grasaPct',
  'alturaCm',
  'cuelloCm',
  'pechoCm',
  'cinturaCm',
  'brazoCm',
  'musloCm',
]

const claseDireccion: Record<DireccionDelta, string> = {
  favorable: 'text-emerald-600 dark:text-emerald-400',
  desfavorable: 'text-red-600 dark:text-red-400',
  neutro: 'text-muted-foreground',
}

const claseImc: Record<CategoriaImc, string> = {
  bajo: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  normal: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  sobrepeso: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  obeso: 'bg-red-500/15 text-red-700 dark:text-red-400',
}

const etiquetaImc: Record<CategoriaImc, string> = {
  bajo: 'Bajo peso',
  normal: 'Normal',
  sobrepeso: 'Sobrepeso',
  obeso: 'Obesidad',
}

const valoresVacios = (): Record<CampoMedicion, string> => ({
  pesoKg: '',
  grasaPct: '',
  alturaCm: '',
  cuelloCm: '',
  pechoCm: '',
  cinturaCm: '',
  brazoCm: '',
  musloCm: '',
})

function formatearDelta(valor: number, campo: CampoMedicion): string {
  const redondeado = Number(valor.toFixed(1))
  const signo = redondeado > 0 ? '+' : ''
  return `${signo}${redondeado} ${UNIDADES[campo]}`
}

function fechaCorta(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
  })
}

export function ProgresoCorporal({ socioId, mediciones = medicionesMock }: ProgresoCorporalProps) {
  const [historial, setHistorial] = useState<readonly Medicion[]>(mediciones)
  const [socioIdPrevio, setSocioIdPrevio] = useState(socioId)
  const [formAbierto, setFormAbierto] = useState(false)
  const [fecha, setFecha] = useState(fechaHoyIso())
  const [valores, setValores] = useState<Record<CampoMedicion, string>>(valoresVacios)
  const [error, setError] = useState<string | null>(null)

  if (socioIdPrevio !== socioId) {
    setSocioIdPrevio(socioId)
    setHistorial(mediciones)
    setFormAbierto(false)
    setError(null)
  }

  const serie = serieMediciones(historial, socioId)
  const ultima = serie[serie.length - 1]
  const anterior = serie.length >= 2 ? serie[serie.length - 2] : undefined
  const deltas = ultima && anterior ? delta(anterior, ultima) : null
  const puntoImc = [...serie].reverse().find((medicion) => imc(medicion) !== null)
  const valorImc = puntoImc ? imc(puntoImc) : null
  const datosGrafico = progresoGrafico(historial, socioId)
  const tienePeso = datosGrafico.some((punto) => punto.peso !== undefined)
  const tieneGrasa = datosGrafico.some((punto) => punto.grasa !== undefined)

  const guardar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const nueva: Medicion = { socioId, fecha: fecha || fechaHoyIso() }
    let camposConValor = 0
    for (const campo of CAMPOS_FORM) {
      const texto = valores[campo].trim()
      if (!texto) continue
      const numero = Number(texto)
      if (!Number.isFinite(numero) || numero <= 0) {
        setError(`${ETIQUETAS[campo]} debe ser un número mayor a 0`)
        return
      }
      nueva[campo] = numero
      camposConValor += 1
    }
    if (camposConValor === 0) {
      setError('Ingresa al menos un valor')
      return
    }
    setError(null)
    setHistorial((previas) => [...previas, nueva])
    setValores(valoresVacios())
    setFecha(fechaHoyIso())
    setFormAbierto(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Ruler className="size-4 text-muted-foreground" />
          Progreso corporal
        </p>
        <Badge variant="outline" className="tabular-nums">
          {serie.length} {serie.length === 1 ? 'medición' : 'mediciones'}
        </Badge>
      </div>

      {serie.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Sin mediciones — registra la primera
        </p>
      ) : (
        <>
          {serie.length >= 2 && (tienePeso || tieneGrasa) && (
            <div className="h-40 text-muted-foreground">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...datosGrafico]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="fecha"
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(valor: string) => fechaCorta(valor)}
                  />
                  {tienePeso && (
                    <YAxis
                      yAxisId="peso"
                      tick={{ fill: 'currentColor', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                      domain={['dataMin - 2', 'dataMax + 2']}
                      tickFormatter={(valor: number) => `${Math.round(valor)}kg`}
                    />
                  )}
                  {tieneGrasa && (
                    <YAxis
                      yAxisId="grasa"
                      orientation="right"
                      tick={{ fill: 'currentColor', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                      domain={['dataMin - 2', 'dataMax + 2']}
                      tickFormatter={(valor: number) => `${Math.round(valor)}%`}
                    />
                  )}
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--card-foreground)',
                    }}
                    formatter={(valor, nombre) => {
                      const numero = Number(valor)
                      const sufijo = String(nombre) === 'Grasa' ? '%' : 'kg'
                      return [`${numero} ${sufijo}`, String(nombre)]
                    }}
                  />
                  {tienePeso && (
                    <Line
                      yAxisId="peso"
                      type="monotone"
                      dataKey="peso"
                      name="Peso"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  )}
                  {tieneGrasa && (
                    <Line
                      yAxisId="grasa"
                      type="monotone"
                      dataKey="grasa"
                      name="Grasa"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {valorImc !== null && (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">IMC</span>
              <span className="flex items-center gap-2">
                <span className="font-medium tabular-nums">{valorImc.toFixed(1)}</span>
                <Badge className={claseImc[categoriaImc(valorImc)]}>
                  {etiquetaImc[categoriaImc(valorImc)]}
                </Badge>
              </span>
            </div>
          )}

          {ultima && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              {SEGUIMIENTO.filter((campo) => typeof ultima[campo] === 'number').map((campo) => {
                const deltaValor = deltas?.[campo]
                const direccion = deltaValor === undefined ? null : direccionDelta(campo, deltaValor)
                return (
                  <div key={campo} className="flex items-center justify-between gap-2">
                    <dt className="text-xs text-muted-foreground">{ETIQUETAS[campo]}</dt>
                    <dd className="flex items-center gap-1.5 text-sm">
                      <span className="font-medium tabular-nums">
                        {ultima[campo]} {UNIDADES[campo]}
                      </span>
                      {deltaValor !== undefined && direccion && (
                        <span className={cn('text-xs tabular-nums', claseDireccion[direccion])}>
                          {deltaValor < 0 ? '▼' : deltaValor > 0 ? '▲' : '='}{' '}
                          {formatearDelta(deltaValor, campo)}
                        </span>
                      )}
                    </dd>
                  </div>
                )
              })}
              {typeof ultima.alturaCm === 'number' && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-xs text-muted-foreground">Altura</dt>
                  <dd className="text-sm font-medium tabular-nums">
                    {ultima.alturaCm} cm
                  </dd>
                </div>
              )}
            </dl>
          )}
        </>
      )}

      {formAbierto ? (
        <form className="space-y-2" onSubmit={guardar}>
          <Input
            aria-label="Fecha de la medición"
            type="date"
            value={fecha}
            onChange={(evento) => setFecha(evento.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            {CAMPOS_FORM.map((campo) => (
              <Input
                key={campo}
                aria-label={`${ETIQUETAS[campo]} (${UNIDADES[campo]})`}
                placeholder={`${ETIQUETAS[campo]} (${UNIDADES[campo]})`}
                type="number"
                inputMode="decimal"
                min="0.1"
                step="0.1"
                value={valores[campo]}
                onChange={(evento) =>
                  setValores((previos) => ({ ...previos, [campo]: evento.target.value }))
                }
              />
            ))}
          </div>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setFormAbierto(false)
                setError(null)
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="flex-1">
              Guardar
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setFormAbierto(true)}
        >
          <Plus />
          Registrar medición
        </Button>
      )}
    </div>
  )
}
