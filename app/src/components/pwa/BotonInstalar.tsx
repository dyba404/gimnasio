import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import type { InstallStatus } from '@/hooks/use-install-prompt'

type BotonInstalarProps = {
  status?: InstallStatus
}

export function BotonInstalar({ status }: BotonInstalarProps) {
  const { status: statusDelEntorno, promptInstall } = useInstallPrompt()
  const estado = status ?? statusDelEntorno

  if (estado === 'available') {
    return (
      <Button
        variant="outline"
        className="w-full print:hidden"
        onClick={() => void promptInstall()}
      >
        <Download /> Instalar app
      </Button>
    )
  }
  if (estado === 'ios-instructions') {
    return (
      <p className="text-center text-xs text-muted-foreground print:hidden">
        En iPhone: Compartir → Añadir a pantalla de inicio
      </p>
    )
  }
  return null
}
