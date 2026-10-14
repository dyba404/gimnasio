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
import { ClipboardList, MoreHorizontal, Trophy, XCircle } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
import { ColumnHeader, DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { BotonWhatsApp } from '@/components/members/BotonWhatsApp'
import { ProspectoEstadoBadge } from '@/components/prospectos/ProspectoEstadoBadge'
import { iniciales, formatoSoles } from '@/lib/format'
import { cn } from '@/lib/utils'
import { formatoFecha } from '@/mocks/data'
import {
  construirMensajePrimerContacto,
  diasSinGestion,
  estaSinGestion,
  etiquetaEstado,
  etiquetaFuente,
  etiquetaInteres,
  estadosProspecto,
  fechaHoyIso,
  textoHaceDias,
} from '@/mocks/prospectos'
import type { EstadoProspecto, Prospecto } from '@/mocks/prospectos'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string
  }
}

type ProspectosTableProps = {
  prospectos: readonly Prospecto[]
  busqueda: string
  onBusquedaChange: (valor: string) => void
  filtroEstado: readonly EstadoProspecto[]
  onFiltroEstadoChange: (estados: readonly EstadoProspecto[]) => void
  onRegistrarGestion: (prospecto: Prospecto) => void
  onMarcarGanado: (prospecto: Prospecto) => void
  onMarcarPerdido: (prospecto: Prospecto) => void
}

export function ProspectosTable({
  prospectos,
  busqueda,
  onBusquedaChange,
  filtroEstado,
  onFiltroEstadoChange,
  onRegistrarGestion,
  onMarcarGanado,
  onMarcarPerdido,
}: ProspectosTableProps) {
  const hoyIso = fechaHoyIso()
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'ultimaGestion', desc: true },
  ])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const data = useMemo(() => [...prospectos], [prospectos])
  const columnFilters = useMemo(
    () => filtroEstadoToColumnFilters(filtroEstado),
    [filtroEstado],
  )

  const columns = useMemo<ColumnDef<Prospecto>[]>(
    () => [
      {
        accessorKey: 'nombre',
        enableSorting: false,
        header: () => (
          <span className="text-sm font-medium text-muted-foreground">Prospecto</span>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="hidden size-9 md:flex">
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                {iniciales(row.original.nombre)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="max-w-36 truncate font-medium leading-tight md:max-w-none">
                {row.original.nombre}
              </p>
              <p className="hidden text-xs text-muted-foreground tabular-nums md:block">
                {row.original.telefono}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'fuente',
        enableSorting: false,
        meta: { className: 'hidden md:table-cell' },
        header: () => (
          <span className="text-sm font-medium text-muted-foreground">Fuente</span>
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{etiquetaFuente[row.original.fuente]}</span>
        ),
      },
      {
        accessorKey: 'estado',
        enableSorting: false,
        filterFn: 'arrIncludesSome',
        header: () => (
          <span className="text-sm font-medium text-muted-foreground">Estado</span>
        ),
        cell: ({ row }) => <ProspectoEstadoBadge estado={row.original.estado} />,
      },
      {
        accessorKey: 'interes',
        enableSorting: false,
        meta: { className: 'hidden md:table-cell' },
        header: () => (
          <span className="text-sm font-medium text-muted-foreground">Interés</span>
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {row.original.interes ? etiquetaInteres[row.original.interes] : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'valorPotencialMensual',
        enableSorting: false,
        meta: { className: 'hidden md:table-cell' },
        header: ({ column }) => <ColumnHeader column={column} title="Valor potencial" />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-medium tabular-nums">
            {formatoSoles(row.original.valorPotencialMensual)}
          </span>
        ),
      },
      {
        id: 'ultimaGestion',
        accessorFn: (prospecto) => diasSinGestion(prospecto, hoyIso),
        meta: { className: 'hidden md:table-cell' },
        header: ({ column }) => <ColumnHeader column={column} title="Última gestión" />,
        cell: ({ row }) => {
          const dias = diasSinGestion(row.original, hoyIso)
          return (
            <div className="flex flex-col items-start gap-1">
              <span className="whitespace-nowrap tabular-nums">{textoHaceDias(dias)}</span>
              {estaSinGestion(row.original, hoyIso) ? (
                <Badge variant="secondary" className="bg-amber-500/15 text-[11px] text-amber-600 dark:text-amber-400">
                  Sin gestión 7+ días
                </Badge>
              ) : null}
            </div>
          )
        },
      },
      {
        id: 'proximaAccion',
        enableSorting: false,
        meta: { className: 'hidden md:table-cell' },
        header: () => (
          <span className="text-sm font-medium text-muted-foreground">Próxima acción</span>
        ),
        cell: ({ row }) => {
          const accion = row.original.proximaAccion
          if (!accion) {
            return <span className="text-muted-foreground">—</span>
          }
          return (
            <div className="flex max-w-44 flex-col">
              <span className="whitespace-nowrap tabular-nums">
                {formatoFecha(accion.fecha)}
              </span>
              <span className="truncate text-xs text-muted-foreground">{accion.detalle}</span>
            </div>
          )
        },
      },
      {
        id: 'whatsapp',
        enableSorting: false,
        meta: { className: 'hidden md:table-cell' },
        header: () => (
          <span className="text-sm font-medium text-muted-foreground">WhatsApp</span>
        ),
        cell: ({ row }) => (
          <BotonWhatsApp
            telefono={row.original.telefono}
            mensaje={construirMensajePrimerContacto(row.original.nombre)}
            tamano="sm"
            texto="WhatsApp"
          />
        ),
      },
      {
        id: 'acciones',
        enableSorting: false,
        header: () => (
          <span className="text-sm font-medium text-muted-foreground">Acciones</span>
        ),
        cell: ({ row }) => {
          const prospecto = row.original
          const cerrado = prospecto.estado === 'ganado' || prospecto.estado === 'perdido'
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Acciones para ${prospecto.nombre}`}
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onRegistrarGestion(prospecto)}>
                    <ClipboardList /> Registrar gestión
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={cerrado}
                    onSelect={() => onMarcarGanado(prospecto)}
                  >
                    <Trophy /> Ganado → crear socio
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={cerrado}
                    onSelect={() => onMarcarPerdido(prospecto)}
                  >
                    <XCircle /> Perdido
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [hoyIso, onMarcarGanado, onMarcarPerdido, onRegistrarGestion],
  )

  const table = useReactTable<Prospecto>({
    data,
    columns,
    state: { sorting, pagination, columnFilters },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const conteos = table.getColumn('estado')?.getFacetedUniqueValues()

  const toggleEstado = (estado: EstadoProspecto) => {
    const seleccion = new Set(filtroEstado)
    if (seleccion.has(estado)) {
      seleccion.delete(estado)
    } else {
      seleccion.add(estado)
    }
    onFiltroEstadoChange([...seleccion])
  }

  const filas = table.getRowModel().rows

  return (
    <div className="space-y-4">
      <DataTableToolbar
        busqueda={busqueda}
        onBusquedaChange={onBusquedaChange}
        placeholder="Buscar por nombre, teléfono o fuente…"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-muted-foreground">
              Estado
              {filtroEstado.length > 0 ? (
                <span className="tabular-nums">({filtroEstado.length})</span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {estadosProspecto.map((estado) => (
              <DropdownMenuCheckboxItem
                key={estado}
                checked={filtroEstado.includes(estado)}
                onSelect={(evento) => {
                  evento.preventDefault()
                  toggleEstado(estado)
                }}
              >
                <span className="flex flex-1 items-center justify-between gap-2">
                  {etiquetaEstado[estado]}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {conteos?.get(estado) ?? 0}
                  </span>
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
                  No hay prospectos con los filtros aplicados.
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

function filtroEstadoToColumnFilters(
  filtroEstado: readonly EstadoProspecto[],
): ColumnFiltersState {
  if (filtroEstado.length === 0) return []
  return [{ id: 'estado', value: [...filtroEstado] }]
}
