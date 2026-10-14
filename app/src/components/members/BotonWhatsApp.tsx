import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { enlaceWhatsApp, telefonoValido } from '@/lib/whatsapp'

type BotonWhatsAppProps = {
  telefono: string
  mensaje: string
  tamano?: 'sm' | 'default'
  texto?: string
  className?: string
  onClick?: () => void
}

export function BotonWhatsApp({
  telefono,
  mensaje,
  tamano = 'default',
  texto = 'Cobrar por WhatsApp',
  className,
  onClick,
}: BotonWhatsAppProps) {
  const valido = telefonoValido(telefono)
  return (
    <Button
      asChild
      variant="outline"
      size={tamano}
      className={cn(className, !valido && 'pointer-events-none opacity-50')}
    >
      <a
        href={valido ? enlaceWhatsApp(telefono, mensaje) : undefined}
        target={valido ? '_blank' : undefined}
        rel={valido ? 'noopener noreferrer' : undefined}
        aria-disabled={!valido}
        aria-label={
          valido
            ? `${texto} — abre chat de WhatsApp con el socio`
            : `${texto} — teléfono del socio inválido o incompleto`
        }
        onClick={onClick}
      >
        <MessageCircle className="text-emerald-600" />
        {texto}
      </a>
    </Button>
  )
}
