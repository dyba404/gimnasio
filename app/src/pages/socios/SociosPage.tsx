import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CircleAlert, Plus, UserCheck, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NuevoSocioSheet } from '@/components/members/NuevoSocioSheet'
import type { BorradorSocio } from '@/components/members/NuevoSocioSheet'
import { SociosEmpty } from '@/components/members/SociosEmpty'
import { SociosTable } from '@/components/members/SociosTable'
import { DataTableToolbar } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buscarSocios } from '@/lib/search'
import {
  actualizarSocio,
  cargarFechasAsistenciasDeSocio,
  cargarGestionesDeSocio,
  cargarMembresias,
  cargarPlanes,
  cargarSocios,
  cargarUltimaAsistencia,
  congelarSocio,
  crearSocio,
  registrarGestion,
  siguienteCodigoSocio,
} from '@/lib/datos'
import type { GestionCobranza } from '@/mocks/bitacora'
import { membresiasMock, planesMock, sociosMock } from '@/mocks/data'
import type { Membresia, Plan, Socio } from '@/mocks/types'

type Kpi = {
  title: string
  value: number
  icon: LucideIcon
}

export default function SociosPage() {
  const [searchParams] = useSearchParams()
  const buscarParam = searchParams.get('buscar')
  const [congeladosIds, setCongeladosIds] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        sociosMock.filter((socio) => socio.estado === 'congelado').map((socio) => socio.id),
      ),
  )
  const [busqueda, setBusqueda] = useState(() => buscarParam ?? '')
  const [paramAnterior, setParamAnterior] = useState(buscarParam)
  if (buscarParam !== paramAnterior) {
    setParamAnterior(buscarParam)
    setBusqueda(buscarParam ?? '')
  }
  const [sheetOpen, setSheetOpen] = useState(false)
  const [socioEnEdicion, setSocioEnEdicion] = useState<Socio | null>(null)
  const [sociosBackend, setSociosBackend] = useState<Socio[] | null>(null)
  const [membresiasBackend, setMembresiasBackend] = useState<Membresia[] | null>(null)
  const [planesBackend, setPlanesBackend] = useState<Plan[] | null>(null)
  const [errorPersistencia, setErrorPersistencia] = useState<string | null>(null)
  const [fechasAsistencias, setFechasAsistencias] = useState<readonly string[]>([])
  const [ultimaAsistencia, setUltimaAsistencia] = useState<string | null>(null)
  const [gestiones, setGestiones] = useState<readonly GestionCobranza[]>([])

  useEffect(() => {
    let cancelado = false
    if (!sheetOpen || socioEnEdicion === null) return
    void cargarFechasAsistenciasDeSocio(socioEnEdicion.id).then((fechas) => {
      if (!cancelado && fechas !== null) setFechasAsistencias(fechas)
    })
    void cargarUltimaAsistencia(socioEnEdicion.id).then((ultima) => {
      if (!cancelado && ultima !== null) setUltimaAsistencia(ultima)
    })
    void cargarGestionesDeSocio(socioEnEdicion.id).then((cargadas) => {
      if (!cancelado && cargadas !== null) setGestiones(cargadas)
    })
    return () => {
      cancelado = true
    }
  }, [sheetOpen, socioEnEdicion])

  useEffect(() => {
    let cancelado = false
    void cargarSocios().then((remotos) => {
      if (cancelado || remotos === null) return
      setSociosBackend(remotos)
      setCongeladosIds(
        new Set(remotos.filter((socio) => socio.estado === 'congelado').map((socio) => socio.id)),
      )
    })
    void cargarMembresias().then((remotos) => {
      if (!cancelado && remotos !== null) setMembresiasBackend(remotos)
    })
    void cargarPlanes().then((remotos) => {
      if (!cancelado && remotos !== null) setPlanesBackend(remotos)
    })
    return () => {
      cancelado = true
    }
  }, [])

  const planes = planesBackend ?? planesMock

  const planesMap = useMemo(
    () => new Map<string, Plan>(planes.map((plan) => [plan.id, plan])),
    [planes],
  )

  const membresias = membresiasBackend ?? membresiasMock

  const membresiasPorSocio = useMemo(() => {
    const mapa = new Map<string, Membresia>()
    for (const membresia of membresias) {
      const previa = mapa.get(membresia.socioId)
      if (previa === undefined || membresia.fechaFin > previa.fechaFin) {
        mapa.set(membresia.socioId, membresia)
      }
    }
    return mapa
  }, [membresias])

  const sociosBase = sociosBackend ?? sociosMock

  const socios = useMemo<Socio[]>(
    () =>
      sociosBase.map((socio) => ({
        ...socio,
        estado: congeladosIds.has(socio.id)
          ? 'congelado'
          : membresiasPorSocio.get(socio.id)?.estado === 'vencida'
            ? 'moroso'
            : 'activo',
      })),
    [sociosBase, congeladosIds, membresiasPorSocio],
  )

  const sociosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return socios
    return buscarSocios(socios, busqueda, socios.length)
  }, [socios, busqueda])

  const kpis: readonly Kpi[] = [
    { title: 'Total socios', value: socios.length, icon: Users },
    { title: 'Activos', value: socios.filter((s) => s.estado === 'activo').length, icon: UserCheck },
    { title: 'Morosos', value: socios.filter((s) => s.estado === 'moroso').length, icon: CircleAlert },
  ]

  const abrirNuevo = () => {
    setSocioEnEdicion(null)
    setSheetOpen(true)
  }

  const abrirEdicion = (socio: Socio) => {
    setFechasAsistencias([])
    setUltimaAsistencia(null)
    setGestiones([])
    setSocioEnEdicion(socio)
    setSheetOpen(true)
  }

  const guardarSocio = async (
    borrador: BorradorSocio,
    socioId: string | null,
  ): Promise<boolean> => {
    setErrorPersistencia(null)
    if (socioId !== null) {
      if (sociosBackend === null) return true
      const ok = await actualizarSocio(socioId, borrador)
      if (!ok) {
        setErrorPersistencia('No se pudo guardar. Revisa los datos e intenta de nuevo.')
        return false
      }
    } else {
      if (sociosBackend === null) return true
      const codigo = siguienteCodigoSocio(sociosBackend.map((socio) => socio.codigo))
      const creado = await crearSocio({
        codigo,
        nombre: borrador.nombre,
        dni: borrador.dni,
        telefono: borrador.telefono,
        planId: borrador.planId,
        estado: 'activo',
      })
      if (creado === null) {
        setErrorPersistencia('No se pudo guardar. Revisa los datos e intenta de nuevo.')
        return false
      }
    }
    const recargados = await cargarSocios()
    if (recargados !== null) setSociosBackend(recargados)
    return true
  }

  const congelar = (socioId: string) => {
    const congelarAhora = !congeladosIds.has(socioId)
    setCongeladosIds((previos) => {
      const siguientes = new Set(previos)
      if (congelarAhora) {
        siguientes.add(socioId)
      } else {
        siguientes.delete(socioId)
      }
      return siguientes
    })
    if (sociosBackend !== null) {
      void congelarSocio(socioId, congelarAhora).then((ok) => {
        if (!ok) {
          setErrorPersistencia('No se pudo actualizar el estado del socio en el servidor.')
        }
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Socios</h2>
          <p className="text-sm text-muted-foreground">
            Administra los miembros de tu gimnasio
          </p>
        </div>
        <Button onClick={abrirNuevo}>
          <Plus /> Nuevo socio
        </Button>
      </div>

      {errorPersistencia !== null && (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {errorPersistencia}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                {kpi.title}
                <kpi.icon className="size-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {socios.length === 0 ? (
        <SociosEmpty variante="vacio" onNuevo={abrirNuevo} />
      ) : sociosFiltrados.length === 0 ? (
        /* El input de búsqueda debe sobrevivir al empty state: si no, el
           usuario queda atrapado sin poder editar su término. */
        <div className="space-y-4">
          <DataTableToolbar
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            placeholder="Buscar por nombre o DNI…"
          />
          <SociosEmpty variante="sin-resultados" busqueda={busqueda.trim()} />
        </div>
      ) : (
        <SociosTable
          socios={sociosFiltrados}
          planes={planesMap}
          membresiasPorSocio={membresiasPorSocio}
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          onVer={abrirEdicion}
          onEditar={abrirEdicion}
          onCongelar={congelar}
        />
      )}

      <NuevoSocioSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        socio={socioEnEdicion}
        planes={planes}
        onGuardar={guardarSocio}
        fechasAsistencias={fechasAsistencias}
        ultimaAsistencia={ultimaAsistencia}
        gestiones={gestiones}
        onRegistrarGestion={(input) => registrarGestion(input)}
      />
    </div>
  )
}
