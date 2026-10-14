import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ClipboardList, Clock, Hourglass, User, Users, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { membresiaMasReciente } from '@/components/checkin/membresia-ui'
import {
  cancelarReserva as cancelarReservaBackend,
  cargarClases,
  cargarMembresias,
  cargarReservas,
  cargarSocios,
  confirmarReserva,
  registrarReservaCompleta,
} from '@/lib/datos'
import { supabaseDisponible } from '@/lib/supabase'
import { membresiasMock, sociosMock, sumarDiasIso } from '@/mocks/data'
import {
  SOCIO_ACTIVO_ID,
  clasesDelDia,
  clasesMock,
  cuposLibres,
  cuposLibresDelDia,
  esperasDe,
  fechaHoyIso,
  motivoBloqueo,
  nombreReservado,
  reservasDeClase,
  reservasDelDia,
  reservasMock,
} from '@/mocks/clases'
import { cancelarReserva, confirmadasEn, crearReserva, reservaActivaDe } from '@/mocks/clases'
import type { Clase, Reserva } from '@/mocks/clases'
import type { Membresia, Socio } from '@/mocks/types'

const PATRON_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function esIdBackend(id: string): boolean {
  return PATRON_UUID.test(id)
}

type ClasesPageProps = {
  claseInicial?: string
  socioInicial?: string
}

type Kpi = {
  titulo: string
  valor: number
  detalle: string
  icono: LucideIcon
}

type EstadoCupo = { texto: string; badge: string; barra: string }

function estadoCupo(libres: number): EstadoCupo {
  if (libres === 0) {
    return {
      texto: 'Lleno',
      badge: 'bg-red-500/15 text-red-700 dark:text-red-400',
      barra: 'bg-red-500',
    }
  }
  if (libres <= 2) {
    return {
      texto: 'Últimos cupos',
      badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
      barra: 'bg-amber-500',
    }
  }
  return {
    texto: `${libres} libres`,
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    barra: 'bg-emerald-500',
  }
}

function etiquetaDia(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.split('-').map(Number)
  const fecha = new Date(anio, (mes ?? 1) - 1, dia ?? 1)
  const texto = fecha.toLocaleDateString('es-PE', { weekday: 'short' })
  return `${texto.replace('.', '')} ${dia ?? ''}`
}

export default function ClasesPage({ claseInicial, socioInicial }: ClasesPageProps) {
  const [reservas, setReservas] = useState<readonly Reserva[]>(reservasMock)
  const [clasesBackend, setClasesBackend] = useState<Clase[] | null>(null)
  const [sociosBackend, setSociosBackend] = useState<Socio[] | null>(null)
  const [membresiasBackend, setMembresiasBackend] = useState<Membresia[] | null>(
    null,
  )
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>(fechaHoyIso())
  const [claseSeleccionadaId, setClaseSeleccionadaId] = useState<string | null>(
    claseInicial ?? null,
  )
  const [socioActivoId, setSocioActivoId] = useState<string>(socioInicial ?? SOCIO_ACTIVO_ID)
  const backendActivo = supabaseDisponible()

  useEffect(() => {
    let cancelado = false
    if (!backendActivo) return
    void cargarClases().then((remotas) => {
      if (!cancelado && remotas !== null) setClasesBackend(remotas)
    })
    void cargarReservas().then((remotas) => {
      if (!cancelado && remotas !== null) setReservas(remotas)
    })
    void cargarSocios().then((remotos) => {
      if (!cancelado && remotos !== null) setSociosBackend(remotos)
    })
    void cargarMembresias().then((remotas) => {
      if (!cancelado && remotas !== null) setMembresiasBackend(remotas)
    })
    return () => {
      cancelado = true
    }
  }, [backendActivo])

  const clases = clasesBackend ?? clasesMock
  const socios = sociosBackend ?? sociosMock
  const membresias = membresiasBackend ?? membresiasMock

  const sociosPorId = useMemo(
    () => new Map(socios.map((socio) => [socio.id, socio])),
    [socios],
  )

  const socioIdValido =
    sociosBackend === null || sociosPorId.has(socioActivoId)
  const socioActivoIdEfectivo = socioIdValido
    ? socioActivoId
    : (socios.find((socio) => socio.estado === 'activo')?.id ?? socioActivoId)

  const hoyIso = fechaHoyIso()

  const dias = useMemo(
    () => Array.from({ length: 7 }, (_, indice) => sumarDiasIso(hoyIso, indice)),
    [hoyIso],
  )

  const kpis = useMemo<readonly Kpi[]>(() => {
    const reservasHoy = reservasDelDia(reservas, hoyIso)
    return [
      {
        titulo: 'Clases hoy',
        valor: clasesDelDia(clases, hoyIso).length,
        detalle: 'Sesiones programadas',
        icono: CalendarDays,
      },
      {
        titulo: 'Reservas hoy',
        valor: reservasHoy.length,
        detalle: 'Confirmadas y en espera',
        icono: ClipboardList,
      },
      {
        titulo: 'Cupos libres hoy',
        valor: cuposLibresDelDia(clases, reservas, hoyIso),
        detalle: 'Entre todas las clases',
        icono: Users,
      },
      {
        titulo: 'En lista de espera',
        valor: reservasHoy.filter((reserva) => reserva.estado === 'espera').length,
        detalle: 'Sin cupo confirmado',
        icono: Hourglass,
      },
    ]
  }, [clases, reservas, hoyIso])

  const clasesDia = useMemo(
    () => clasesDelDia(clases, diaSeleccionado),
    [clases, diaSeleccionado],
  )

  const nombreDe = (socioId: string): string =>
    sociosPorId.get(socioId)?.nombre ?? nombreReservado(socioId)

  const socioActivo = sociosPorId.get(socioActivoIdEfectivo)
  const claseSeleccionada =
    clasesDia.find((clase) => clase.id === claseSeleccionadaId) ??
    clases.find((clase) => clase.id === claseSeleccionadaId) ??
    null

  const reservar = (clase: Clase) => {
    if (socioActivo === undefined) return
    const borrador = crearReserva(clase, socioActivo, diaSeleccionado, reservas)
    setReservas((previas) => [...previas, borrador])
    if (!backendActivo || !esIdBackend(clase.id)) return
    void registrarReservaCompleta({
      claseId: clase.id,
      socioId: socioActivo.id,
      fecha: diaSeleccionado,
      estado: borrador.estado,
      esPrueba: borrador.esPrueba === true,
    }).then((persistida) => {
      if (persistida === null) return
      setReservas((previas) =>
        previas.map((reserva) => (reserva.id === borrador.id ? persistida : reserva)),
      )
    })
  }

  const cancelar = (clase: Clase) => {
    const activa = reservaActivaDe(reservas, clase.id, diaSeleccionado, socioActivoIdEfectivo)
    if (activa === undefined) return
    const previas = reservas
    const siguientes = cancelarReserva(activa.id, previas)
    setReservas(siguientes)
    if (!backendActivo || !esIdBackend(activa.id)) return
    void cancelarReservaBackend({ reservaId: activa.id })
    const promovida = siguientes.find(
      (reserva) =>
        reserva.estado === 'confirmada' &&
        previas.find((previa) => previa.id === reserva.id)?.estado === 'espera',
    )
    if (promovida !== undefined && esIdBackend(promovida.id)) {
      void confirmarReserva({ reservaId: promovida.id })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Clases</h2>
        <p className="text-sm text-muted-foreground">
          Reserva y control de cupos por sesión
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.titulo} className="gap-3 py-4 sm:gap-6 sm:py-6">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                {kpi.titulo}
                <kpi.icono className="size-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 px-4 sm:px-6">
              <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{kpi.valor}</p>
              <p className="text-xs text-muted-foreground">{kpi.detalle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {dias.map((dia) => {
          const activo = dia === diaSeleccionado
          return (
            <Button
              key={dia}
              type="button"
              variant={activo ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDiaSeleccionado(dia)}
            >
              {etiquetaDia(dia)}
            </Button>
          )
        })}
      </div>

      <div>
        <h3 className="text-lg font-semibold tracking-tight">
          {diaSeleccionado === hoyIso
            ? 'Clases de hoy'
            : `Clases del ${etiquetaDia(diaSeleccionado)}`}
        </h3>
        <p className="text-sm text-muted-foreground">
          {clasesDia.length}{' '}
          {clasesDia.length === 1 ? 'clase programada' : 'clases programadas'}
        </p>
      </div>

      {clasesDia.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <CalendarDays className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Sin clases este día</p>
            <p className="text-xs text-muted-foreground">
              No hay clases programadas. Elige otro día en el calendario.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clasesDia.map((clase) => {
            const confirmadas = confirmadasEn(reservas, clase.id, diaSeleccionado)
            const libres = cuposLibres(clase, reservas, diaSeleccionado)
            const esperas = esperasDe(reservas, clase.id, diaSeleccionado)
            const estado = estadoCupo(libres)
            const ocupacion = Math.min(100, Math.round((confirmadas / clase.cupo) * 100))
            const seleccionada = clase.id === claseSeleccionadaId
            return (
              <Card
                key={clase.id}
                role="button"
                tabIndex={0}
                className={cn(
                  'cursor-pointer gap-3 py-4 transition-shadow hover:shadow-md sm:py-6',
                  seleccionada && 'ring-2 ring-primary',
                )}
                onClick={() =>
                  setClaseSeleccionadaId((previa) => (previa === clase.id ? null : clase.id))
                }
                onKeyDown={(evento) => {
                  if (evento.key === 'Enter' || evento.key === ' ') {
                    evento.preventDefault()
                    setClaseSeleccionadaId((previa) =>
                      previa === clase.id ? null : clase.id,
                    )
                  }
                }}
              >
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                    <span>{clase.nombre}</span>
                    {clase.esPrueba === true ? (
                      <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-400">
                        Clase de prueba
                      </Badge>
                    ) : (
                      <Badge className={estado.badge}>{estado.texto}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5">
                      <User className="size-3.5" />
                      {clase.instructor}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      {clase.horaInicio} · {clase.duracionMin} min
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 px-4 sm:px-6">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {confirmadas}/{clase.cupo} reservados
                    </span>
                    {clase.esPrueba !== true && <span className={cn('font-medium')}>{estado.texto}</span>}
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full transition-all', estado.barra)}
                      style={{ width: `${ocupacion}%` }}
                    />
                  </div>
                  {esperas.length > 0 && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                      <Hourglass className="size-3" />
                      {esperas.length} en lista de espera
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {claseSeleccionada !== null && (
        <DetalleClase
          clase={claseSeleccionada}
          reservas={reservas}
          fecha={diaSeleccionado}
          socios={socios}
          membresias={membresias}
          nombreDe={nombreDe}
          socioActivoId={socioActivoIdEfectivo}
          onSocioChange={setSocioActivoId}
          onReservar={reservar}
          onCancelar={cancelar}
          onCerrar={() => setClaseSeleccionadaId(null)}
        />
      )}
    </div>
  )
}

type DetalleClaseProps = {
  clase: Clase
  reservas: readonly Reserva[]
  fecha: string
  socios: readonly Socio[]
  membresias: readonly Membresia[]
  nombreDe: (socioId: string) => string
  socioActivoId: string
  onSocioChange: (socioId: string) => void
  onReservar: (clase: Clase) => void
  onCancelar: (clase: Clase) => void
  onCerrar: () => void
}

function DetalleClase({
  clase,
  reservas,
  fecha,
  socios,
  membresias,
  nombreDe,
  socioActivoId,
  onSocioChange,
  onReservar,
  onCancelar,
  onCerrar,
}: DetalleClaseProps) {
  const socio = socios.find((candidato) => candidato.id === socioActivoId)
  const membresia = membresiaMasReciente(membresias, socioActivoId)
  const confirmadas = reservasDeClase(reservas, clase.id, fecha)
  const esperas = esperasDe(reservas, clase.id, fecha)
  const libres = cuposLibres(clase, reservas, fecha)
  const reservaActiva =
    socio === undefined
      ? undefined
      : reservaActivaDe(reservas, clase.id, fecha, socio.id)
  const motivo =
    socio === undefined
      ? null
      : motivoBloqueo(socio, membresia, clase, reservas)

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex flex-wrap items-center gap-2">
            {clase.nombre}
            {clase.esPrueba === true && (
              <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-400">
                Clase de prueba
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {clase.instructor} · {clase.horaInicio} · {clase.duracionMin} min ·{' '}
            {libres > 0 ? `${libres} cupos libres` : 'sin cupos libres'}
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onCerrar} aria-label="Cerrar detalle">
          <X />
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <section className="space-y-2">
            <h4 className="text-sm font-medium">Reservados ({confirmadas.length})</h4>
            {confirmadas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún sin reservas</p>
            ) : (
              <ul className="space-y-2">
                {confirmadas.map((reserva) => (
                  <li
                    key={reserva.id}
                    className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm"
                  >
                    <span className="truncate">{nombreDe(reserva.socioId)}</span>
                    {reserva.esPrueba === true ? (
                      <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-400">Prueba</Badge>
                    ) : (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        Confirmada
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="space-y-2">
            <h4 className="text-sm font-medium">Lista de espera ({esperas.length})</h4>
            {esperas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin lista de espera</p>
            ) : (
              <ul className="space-y-2">
                {esperas.map((reserva, posicion) => (
                  <li
                    key={reserva.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-dashed p-2 text-sm"
                  >
                    <span className="truncate">
                      <span className="font-medium tabular-nums">#{posicion + 1}</span>{' '}
                      {nombreDe(reserva.socioId)}
                    </span>
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                      Espera
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center">
          <Select value={socioActivoId} onValueChange={onSocioChange}>
            <SelectTrigger className="w-full sm:w-[240px]" aria-label="Socio">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {socios.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {reservaActiva !== undefined ? (
            <Button variant="outline" onClick={() => onCancelar(clase)}>
              Cancelar reserva
            </Button>
          ) : (
            <Button disabled={motivo !== null} onClick={() => onReservar(clase)}>
              {libres > 0 ? 'Reservar' : 'Unirme a la lista de espera'}
            </Button>
          )}
          {reservaActiva !== undefined && (
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              {reservaActiva.estado === 'espera' ? 'En espera' : 'Reservado'}
            </Badge>
          )}
          {motivo !== null && reservaActiva === undefined && (
            <p className="text-sm text-destructive">{motivo}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
