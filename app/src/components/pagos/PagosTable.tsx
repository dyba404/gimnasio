import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table'
import { Check, Filter } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ColumnHeader, DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { iniciales, formatoSoles } from '@/lib/format'
import { cn } from '@/lib/utils'
import { formatoFecha } from '@/mocks/data'
import { etiquetaEstadoPago } from '@/mocks/pagos'
import type { EstadoPago, MetodoPago, Pago } from '@/mocks/pagos'
import { etiquetaMetodo } from '@/mocks/caja-data'

const clasesMetodo: Record<MetodoPago, string> = {
  efectivo: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  yape: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  plin: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
}

const clasesEstado: Record<EstadoPago, string> = {
  completado: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  pendiente: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  anulado: 'bg-red-500/15 text-red-600 dark:text-red-400',
}

const estados: readonly EstadoPago[] = ['completado', 'pendiente', 'anulado']

type PagosTableProps = {
  pagos: readonly Pago[]
  busqueda: string
  onBusquedaChange: (valor: string) => void
}

export function PagosTable({ pagos, busqueda, onBusquedaChange }: PagosTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const data = useMemo(() => [...pagos], [pagos])

  const columns = useMemo<ColumnDef<Pago>[]>(
    () => [
      {
        accessorKey: 'fecha',
        meta: { className: 'hidden md:table-cell' },
        header: ({ column }) => <ColumnHeader column={column} title="Fecha" />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground tabular-nums">
            {formatoFecha(row.original.fecha)}
          </span>
        ),
      },
      {
        accessorKey: 'nombre',
        enableSorting: false,
        header: () => (
          <span className="text-sm font-medium text-muted-foreground">Socio</span>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 md:gap-3">
            <Avatar className="hidden size-9 shrink-0 md:flex">
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                {iniciales(row.original.nombre)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="max-w-32 truncate font-medium leading-tight md:max-w-none">
                {row.original.nombre}
              </p>
              <p className="hidden text-xs text-muted-foreground tabular-nums md:block">
                {row.original.codigo}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'planNombre',
        enableSorting: false,
        meta: { className: 'hidden md:table-cell' },
        header: () => (
          <span className="text-sm font-medium text-muted-foreground">Plan</span>
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.original.planNombre}</span>
        ),
      },
      {
        accessorKey: 'metodo',
        enableSorting: false,
        filterFn: 'arrIncludesSome',
        meta: { className: 'hidden md:table-cell' },
        header: () => (
          <span className="text-sm font-medium text-muted-foreground">Método</span>
        ),
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={cn('text-[11px]', clasesMetodo[row.original.metodo])}
          >
            {etiquetaMetodo[row.original.metodo]}
          </Badge>
        ),
      },
      {
        accessorKey: 'monto',
        header: ({ column }) => <ColumnHeader column={column} title="Monto" />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-medium tabular-nums">
            {formatoSoles(row.original.monto)}
          </span>
        ),
      },
      {
        accessorKey: 'estado',
        enableSorting: false,
        filterFn: 'arrIncludesSome',
        header: () => (
          <span className="text-sm font-medium text-muted-foreground">Estado</span>
        ),
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={cn('text-[11px]', clasesEstado[row.original.estado])}
          >
            {etiquetaEstadoPago[row.original.estado]}
          </Badge>
        ),
      },
    ],
    [],
  )

  const table = useReactTable<Pago>({
    data,
    columns,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const filtrosActivos = (id: string): ReadonlySet<string> =>
    new Set(
      (table.getColumn(id)?.getFilterValue() as readonly string[] | undefined) ?? [],
    )

  const seleccionMetodo = filtrosActivos('metodo')
  const seleccionEstado = filtrosActivos('estado')

  const toggleFiltro = (id: 'metodo' | 'estado', valor: string) => {
    const columna = table.getColumn(id)
    if (!columna) return
    const seleccion = id === 'metodo' ? seleccionMetodo : seleccionEstado
    const siguientes = new Set(seleccion)
    if (siguientes.has(valor)) {
      siguientes.delete(valor)
    } else {
      siguientes.add(valor)
    }
    columna.setFilterValue(siguientes.size > 0 ? [...siguientes] : undefined)
  }

  const renderFaceta = (
    id: 'metodo' | 'estado',
    etiqueta: string,
    valores: readonly { valor: string; etiqueta: string }[],
    seleccion: ReadonlySet<string>,
  ) => {
    const conteos = table.getColumn(id)?.getFacetedUniqueValues()
    const activo = seleccion.size > 0
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="text-muted-foreground">
            <Filter />
            {etiqueta}
            {activo ? <span className="tabular-nums">({seleccion.size})</span> : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuLabel>Filtrar por {etiqueta.toLowerCase()}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {valores.map(({ valor, etiqueta: texto }) => (
            <DropdownMenuCheckboxItem
              key={valor}
              checked={seleccion.has(valor)}
              onSelect={(evento) => {
                evento.preventDefault()
                toggleFiltro(id, valor)
              }}
            >
              <span className="flex flex-1 items-center justify-between gap-2">
                {texto}
                <span className="text-xs text-muted-foreground tabular-nums">
                  {conteos?.get(valor) ?? 0}
                </span>
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const hayFiltros = seleccionMetodo.size > 0 || seleccionEstado.size > 0
  const filas = table.getRowModel().rows

  return (
    <div className="space-y-4">
      <DataTableToolbar
        busqueda={busqueda}
        onBusquedaChange={onBusquedaChange}
        placeholder="Buscar por socio…"
      >
        {renderFaceta(
          'metodo',
          'Método',
          (Object.keys(etiquetaMetodo) as MetodoPago[]).map((metodo) => ({
            valor: metodo,
            etiqueta: etiquetaMetodo[metodo],
          })),
          seleccionMetodo,
        )}
        {renderFaceta(
          'estado',
          'Estado',
          estados.map((estado) => ({
            valor: estado,
            etiqueta: etiquetaEstadoPago[estado],
          })),
          seleccionEstado,
        )}
        {hayFiltros ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setColumnFilters([])}
          >
            <Check />
            Limpiar filtros
          </Button>
        ) : null}
      </DataTableToolbar>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((grupo) => (
              <tr key={grupo.id} className="border-b bg-muted/50">
                {grupo.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      'px-1.5 py-3 text-left font-medium text-muted-foreground md:px-4',
                      header.column.columnDef.meta?.className,
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No hay pagos con los filtros aplicados.
                </td>
              </tr>
            ) : (
              filas.map((fila) => (
                <tr
                  key={fila.id}
                  className="border-b last:border-0 transition-colors hover:bg-muted/30"
                >
                  {fila.getVisibleCells().map((celda) => (
                    <td
                      key={celda.id}
                      className={cn(
                        'px-1.5 py-3 md:px-4',
                        celda.column.columnDef.meta?.className,
                      )}
                    >
                      {flexRender(celda.column.columnDef.cell, celda.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DataTablePagination table={table} total={table.getFilteredRowModel().rows.length} />
    </div>
  )
}
