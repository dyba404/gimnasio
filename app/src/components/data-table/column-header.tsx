import type { Column } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ColumnHeaderProps<TData> = {
  column: Column<TData, unknown>
  title: string
  className?: string
}

export function ColumnHeader<TData>({
  column,
  title,
  className,
}: ColumnHeaderProps<TData>) {
  const orden = column.getIsSorted()
  const ordenable = column.getCanSort()

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('-ml-3 h-8 text-muted-foreground hover:text-foreground', className)}
      onClick={() => column.toggleSorting(orden === 'asc')}
      disabled={!ordenable}
      aria-label={`Ordenar por ${title}`}
    >
      <span>{title}</span>
      {orden === 'asc' ? (
        <ArrowUp />
      ) : orden === 'desc' ? (
        <ArrowDown />
      ) : ordenable ? (
        <ChevronsUpDown className="opacity-50" />
      ) : null}
    </Button>
  )
}
