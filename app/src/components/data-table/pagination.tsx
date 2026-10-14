import type { Table } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const tamaniosPagina = [10, 20, 50] as const

type DataTablePaginationProps<TData> = {
  table: Table<TData>
  total: number
}

export function DataTablePagination<TData>({
  table,
  total,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination
  const paginas = table.getPageCount()

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Total:{' '}
        <span className="font-medium tabular-nums text-foreground">{total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-muted-foreground">
              {pageSize} / página
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {tamaniosPagina.map((tamanio) => (
              <DropdownMenuItem
                key={tamanio}
                disabled={tamanio === pageSize}
                onSelect={() => table.setPageSize(tamanio)}
              >
                {tamanio} filas
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Página anterior"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Página siguiente"
          >
            <ChevronRight />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          Página {paginas === 0 ? 0 : pageIndex + 1} de {paginas}
        </p>
      </div>
    </div>
  )
}
