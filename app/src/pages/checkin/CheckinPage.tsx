import { useEffect, useState } from 'react'
import { ScanLine } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { BuscadorSocio } from '@/components/checkin/BuscadorSocio'
import { EscanerQr } from '@/components/checkin/EscanerQr'
import { FichaSocio } from '@/components/checkin/FichaSocio'
import { FeedIngresos } from '@/components/checkin/FeedIngresos'
import { membresiaMasReciente } from '@/components/checkin/membresia-ui'
import {
  actualizarSocio,
  cargarIngresosDeHoy,
  cargarMembresias,
  cargarPlanes,
  cargarSocios,
  registrarAsistencia,
  registrarGestion,
  registrarPagoDeSocio,
  renovarMembresia,
} from '@/lib/datos'
import { supabaseDisponible } from '@/lib/supabase'
import { calcularEstado, planesMock, sumarDiasIso } from '@/mocks/data'
import { hoyIso } from '@/components/memberships/congelamiento'
import type { Plan } from '@/mocks/types'
import {
  horaAhora,
  ingresosIniciales,
  nuevoId,
  sociosMock,
} from '@/mocks/caja-data'
import type { Ingreso, ResultadoIngreso, Socio } from '@/mocks/caja-data'
import type { ResultadoCarnet } from '@/lib/validar-carnet'
import type { Membresia } from '@/mocks/types'

const PATRON_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function esIdBackend(id: string): boolean {
  return PATRON_UUID.test(id)
}

export default function CheckinPage() {
  const [seleccionado, setSeleccionado] = useState<Socio | null>(null)
  const [ingresos, setIngresos] = useState<readonly Ingreso[]>(
    supabaseDisponible() ? [] : ingresosIniciales,
  )
  const [sociosBackend, setSociosBackend] = useState<Socio[] | null>(null)
  const [membresiasBackend, setMembresiasBackend] = useState<Membresia[] | null>(
    null,
  )
  const [planesBackend, setPlanesBackend] = useState<Plan[] | null>(null)
  const backendActivo = supabaseDisponible()

  useEffect(() => {
    let cancelado = false
    if (!backendActivo) return
    void cargarSocios().then((remotos) => {
      if (!cancelado && remotos !== null) setSociosBackend(remotos)
    })
    void cargarMembresias().then((remotas) => {
      if (!cancelado && remotas !== null) setMembresiasBackend(remotas)
    })
    void cargarPlanes().then((remotas) => {
      if (!cancelado && remotas !== null) setPlanesBackend(remotas)
    })
    void cargarIngresosDeHoy().then((remotos) => {
      if (!cancelado && remotos !== null) setIngresos(remotos)
    })
    return () => {
      cancelado = true
    }
  }, [backendActivo])

  const socios = sociosBackend ?? sociosMock
  const membresias = membresiasBackend
  const planes = planesBackend ?? planesMock

  function agregarIngreso(
    socio: Socio,
    resultado: ResultadoIngreso,
    motivo?: string,
  ) {
    setIngresos((previos) => [
      {
        id: nuevoId(),
        hora: horaAhora(),
        socioNombre: socio.nombre,
        socioCodigo: socio.codigo,
        resultado,
        motivo,
      },
      ...previos,
    ])
  }

  function registrar(socio: Socio, resultado: ResultadoIngreso, motivo?: string) {
    if (backendActivo && esIdBackend(socio.id)) {
      if (resultado === 'denegado') {
        void registrarGestion({
          socioId: socio.id,
          tipo: 'recordatorio',
          nota: 'Ingreso denegado — membresía vencida',
          resultado: 'pendiente',
        })
      } else {
        void registrarAsistencia({ socioId: socio.id, hora: horaAhora() })
      }
    }
    agregarIngreso(socio, resultado, motivo)
    setSeleccionado(null)
  }

  async function cobrarYRegistrar(
    socio: Socio,
    membresia: Membresia | undefined,
    planPrecio: number,
    planDuracionDias: number,
  ) {
    if (backendActivo && esIdBackend(socio.id) && membresia !== undefined) {
      const ok = await registrarPagoDeSocio({
        socioId: socio.id,
        planId: membresia.planId,
        monto: planPrecio,
        metodo: 'efectivo',
        concepto: 'membresia',
        socioNombre: socio.nombre,
        hora: horaAhora(),
      })
      if (ok) {
        void renovarMembresia({
          membresiaId: membresia.id,
          fechaFin: sumarDiasIso(hoyIso(), planDuracionDias),
          estado: 'vigente',
        })
        if (socio.estado === 'moroso') {
          void actualizarSocio(socio.id, { estado: 'activo' })
        }
        void registrarAsistencia({ socioId: socio.id, hora: horaAhora() })
      }
    }
    agregarIngreso(socio, 'cobrado')
    setSeleccionado(null)
  }

  function registrarResultadoQr(resultado: ResultadoCarnet) {
    if (resultado.tipo === 'moroso' && resultado.socio) {
      setSeleccionado(resultado.socio)
      return
    }
    if (resultado.tipo === 'aceptado' && resultado.socio) {
      registrar(
        resultado.socio,
        resultado.viaLegado ? 'legado' : 'aceptado',
        resultado.viaLegado ? resultado.motivo : undefined,
      )
      return
    }
    setIngresos((previos) => [
      {
        id: nuevoId(),
        hora: horaAhora(),
        socioNombre: resultado.socio?.nombre ?? 'Socio no registrado',
        socioCodigo: resultado.codigoLeido ?? '—',
        resultado: 'denegado',
        motivo: resultado.motivo,
      },
      ...previos,
    ])
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Check-in</h2>
        <p className="text-sm text-muted-foreground">
          Control de acceso en recepción
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <EscanerQr
            activo={!seleccionado}
            onResultado={registrarResultadoQr}
            socios={socios}
            membresias={membresias ?? undefined}
          />
          <BuscadorSocio
            socios={socios}
            placeholder="Buscar socio por nombre, DNI o código..."
            onSelect={setSeleccionado}
            membresias={membresiasBackend ?? undefined}
            planes={planesBackend ?? planes}
          />
          {seleccionado ? (
            (() => {
              const membresia =
                membresias !== null
                  ? membresiaMasReciente(membresias, seleccionado.id)
                  : undefined
              const plan =
                membresia !== undefined
                  ? planes.find((candidato) => candidato.id === membresia.planId)
                  : undefined
              return (
                <FichaSocio
                  socio={seleccionado}
                  estado={membresia !== undefined ? calcularEstado(membresia.fechaFin) : undefined}
                  membresia={membresia}
                  plan={plan}
                  onCheckin={(socio) => registrar(socio, 'aceptado')}
                  onDenegar={(socio) => registrar(socio, 'denegado')}
                  onCobrar={(socio) => {
                    const membresia =
                      membresias !== null
                        ? membresiaMasReciente(membresias, socio.id)
                        : undefined
                    const plan =
                      membresia !== undefined
                        ? planes.find((candidato) => candidato.id === membresia.planId)
                        : undefined
                    void cobrarYRegistrar(
                      socio,
                      membresia,
                      plan?.precio ?? 0,
                      plan?.duracionDias ?? 30,
                    )
                  }}
                  onCancelar={() => setSeleccionado(null)}
                />
              )
            })()
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 px-8 py-16 text-center">
                <ScanLine className="size-16 text-muted-foreground/40" />
                <p className="text-xl font-semibold">
                  Escanea o busca un socio para empezar
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Apunta la cámara al QR del carné o escribe el nombre, DNI o
                  código del socio en el buscador para registrar el ingreso.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        <FeedIngresos ingresos={ingresos} />
      </div>
    </div>
  )
}
