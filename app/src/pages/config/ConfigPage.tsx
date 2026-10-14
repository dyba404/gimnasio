import { GimnasioForm } from '@/components/config/GimnasioForm'
import { MetodosPago } from '@/components/config/MetodosPago'
import { NotificacionesForm } from '@/components/config/NotificacionesForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Configuración</h2>
        <p className="text-sm text-muted-foreground">
          Ajusta los datos de tu gimnasio y cómo funciona Marsmode
        </p>
      </div>
      <Tabs defaultValue="gimnasio">
        <TabsList>
          <TabsTrigger value="gimnasio">Gimnasio</TabsTrigger>
          <TabsTrigger value="cobros">Cobros</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
        </TabsList>
        <TabsContent value="gimnasio" className="mt-4">
          <GimnasioForm />
        </TabsContent>
        <TabsContent value="cobros" className="mt-4">
          <MetodosPago />
        </TabsContent>
        <TabsContent value="notificaciones" className="mt-4">
          <NotificacionesForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
