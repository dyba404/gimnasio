import { useState } from 'react'
import { Bell } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

type AvisoId = 'recordatorio' | 'morosos' | 'resumen'

type Aviso = {
  id: AvisoId
  titulo: string
  descripcion: string
  activado: boolean
}

const AVISOS_INICIALES: readonly Aviso[] = [
  {
    id: 'recordatorio',
    titulo: 'Recordatorio de vencimiento',
    descripcion: 'Avisa al socio 3 días antes de que venza su membresía.',
    activado: false,
  },
  {
    id: 'morosos',
    titulo: 'Aviso a socios morosos',
    descripcion: 'Mensaje automático cuando la membresía vence.',
    activado: true,
  },
  {
    id: 'resumen',
    titulo: 'Resumen diario',
    descripcion: 'Correo con cobros, ingresos y morosidad del día.',
    activado: false,
  },
]

export function NotificacionesForm() {
  const [avisos, setAvisos] = useState(AVISOS_INICIALES)

  const alternar = (id: AvisoId) => {
    setAvisos((previos) =>
      previos.map((aviso) =>
        aviso.id === id ? { ...aviso, activado: !aviso.activado } : aviso,
      ),
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-4 text-muted-foreground" />
          Notificaciones automáticas
        </CardTitle>
        <CardDescription>
          Los mensajes se enviarán por WhatsApp cuando actives tu cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            className="flex items-center justify-between gap-4 rounded-lg border p-4"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{aviso.titulo}</p>
              <p className="text-sm text-muted-foreground">{aviso.descripcion}</p>
            </div>
            <Switch
              checked={aviso.activado}
              onCheckedChange={() => alternar(aviso.id)}
              aria-label={`Activar ${aviso.titulo}`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
