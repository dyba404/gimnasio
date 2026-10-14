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
  type RowData,
  type SortingState,
} from '@tanstack/react-table'
import { Check, Filter, MoreHorizontal, Pencil, Eye, QrCode, Snowflake } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ColumnHeader } from '@/components/data-table'
import { DataTablePagination } from '@/components/data-table'
import { DataTableToolbar } from '@/components/data-table'
import { CarnetSocio } from '@/components/members/CarnetSocio'
import { SocioEstadoBadge } from '@/components/members/SocioEstadoBadge'
import { VencimientoBadge } from '@/components/members/VencimientoBadge'
import { iniciales } from '@/lib/format'
import { cn } from '@/lib/utils'
import { formatoFecha } from '@/mocks/data'
import type { EstadoSocio, Membresia, Plan, Socio } from '@/mocks/types'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string
  }
}

const estadosSocio: readonly EstadoSocio[] = ['activo', 'moroso', 'congelado']

const etiquetasEstado: Record<EstadoSocio, string> = {
  activo: 'Activo',
  moroso: 'Moroso',
  congelado: 'Congelado',
}

type SociosTableProps = {
  socios: readonly Socio[]
  planes: ReadonlyMap<string, Plan>
  membresiasPorSocio: ReadonlyMap<string, Membresia>
  busqueda: string
  onBusquedaChange: (valor: string) => void
  onVer: (socio: Socio) => void
  onEditar: (socio: Socio) => void
  onCongelar: (socioId: string) => void
}

export function SociosTable({
  socios,
  planes,
  membresiasPorSocio,
  busqueda,
  onBusquedaChange,
  onVer,
  onEditar,
  onCongelar,
}: SociosTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [carnetAbierto, setCarnetAbierto] = useState(false)
  const [socioCarnet, setSocioCarnet] = useState<Socio | null>(null)

  const abrirCarnet = (socio: Socio) => {
    setSocioCarnet(socio)
    setCarnetAbierto(true)
  }

  const data = useMemo(() => [...socios], [socios])

  const columns = useMemo<ColumnDef<Socio>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: ({ column }) => <ColumnHeader column={column} title="Socio" />,
        cell: ({ row }) => {
          const membresia = membresiasPorSocio.get(row.original.id)
          return (
            <div className="flex items-center gap-3">
              <Avatar className="hidden size-9 md:flex">
                <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                  {iniciales(row.original.nombre)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium leading-tight">{row.original.nombre}</p>
                <p className="hidden text-xs text-muted-foreground tabular-nums md:block">
                  {row.original.dni}
                </p>
                {membresia ? (
                  <p className="text-xs text-muted-foreground tabular-nums md:hidden">
                    Vence {formatoFecha(membresia.fechaFin)}
                  </p>
                ) : null}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'telefono',
        enableSorting: false,
        meta: { className: 'hidden md:table-cell' },
        header: () => (
          <span className="text-sm font-medium text-muted-foreground">Teléfono</span>
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground tabular-nums">
            {row.original.telefono}
          </span>
        ),
      },
      {
        id: 'plan',
        accessorFn: (socio) => planes.get(socio.planId)?.nombre ?? '—',
        enableSorting: false,
        meta: { className: 'hidden md:table-cell' },
        header: () => <span className="text-sm font-medium text-muted-foreground">Plan</span>,
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.getValue<string>('plan')}</span>
        ),
      },
      {
        accessorKey: 'estado',
        enableSorting: false,
        filterFn: 'arrIncludesSome',
        header: () => (
          <span className="text-sm font-medium text-muted-foreground">Estado</span>
        ),
        cell: ({ row }) => <SocioEstadoBadge estado={row.original.estado} />,
      },
      {
        id: 'vence',
        accessorFn: (socio) => membresiasPorSocio.get(socio.id)?.fechaFin ?? '',
        meta: { className: 'hidden md:table-cell' },
        header: ({ column }) => <ColumnHeader column={column} title="Vence" />,
        cell: ({ row }) => {
          const membresia = membresiasPorSocio.get(row.original.id)
          if (!membresia) {
            return <span className="text-muted-foreground">—</span>
          }
          return (
            <div className="flex flex-col items-start gap-1">
              <span className="tabular-nums">{formatoFecha(membresia.fechaFin)}</span>
              <VencimientoBadge fechaFin={membresia.fechaFin} />
            </div>
          )
        },
      },
      {
        id: 'acciones',
        enableSorting: false,
        header: () => (
          <span className="text-sm font-medium text-muted-foreground">Acciones</span>
        ),
        cell: ({ row }) => {
          const socio = row.original
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Acciones para ${socio.nombre}`}
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onVer(socio)}>
                    <Eye /> Ver
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onEditar(socio)}>
                    <Pencil /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => abrirCarnet(socio)}>
                    <QrCode /> Ver carné
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onCongelar(socio.id)}>
                    <Snowflake />
                    {socio.estado === 'congelado' ? 'Descongelar' : 'Congelar'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [planes, membresiasPorSocio, onVer, onEditar, abrirCarnet, onCongelar],
  )

  const table = useReactTable<Socio>({
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

  const columnaEstado = table.getColumn('estado')
  const seleccionados = new Set(
    (columnaEstado?.getFilterValue() as readonly string[] | undefined) ?? [],
  )
  const conteos = columnaEstado?.getFacetedUniqueValues()
  const hayFiltros = seleccionados.size > 0

  const toggleEstado = (estado: EstadoSocio) => {
    if (!columnaEstado) return
    const siguientes = new Set(seleccionados)
    if (siguientes.has(estado)) {
      siguientes.delete(estado)
    } else {
      siguientes.add(estado)
    }
    columnaEstado.setFilterValue(siguientes.size > 0 ? [...siguientes] : undefined)
  }

  const filas = table.getRowModel().rows

  return (
    <div className="space-y-4">
      <DataTableToolbar
        busqueda={busqueda}
        onBusquedaChange={onBusquedaChange}
        placeholder="Buscar por nombre o DNI…"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-muted-foreground">
              <Filter />
              Estado
              {hayFiltros ? (
                <span className="tabular-nums">({seleccionados.size})</span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {estadosSocio.map((estado) => (
              <DropdownMenuCheckboxItem
                key={estado}
                checked={seleccionados.has(estado)}
                onSelect={(evento) => {
                  evento.preventDefault()
                  toggleEstado(estado)
                }}
              >
                <span className="flex flex-1 items-center justify-between gap-2">
                  {etiquetasEstado[estado]}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {conteos?.get(estado) ?? 0}
                  </span>
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {hayFiltros ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => columnaEstado?.setFilterValue(undefined)}
          >
            <Check />
            Limpiar filtro
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
                  No hay socios con los filtros aplicados.
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

      <CarnetSocio
        open={carnetAbierto}
        onOpenChange={setCarnetAbierto}
        socio={socioCarnet}
      />
    </div>
  )
}
