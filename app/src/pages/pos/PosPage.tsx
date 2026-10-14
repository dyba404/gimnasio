import { useEffect, useMemo, useState } from 'react'
import {
  Coins,
  Minus,
  Package,
  Plus,
  Receipt,
  ShoppingCart,
  Trash2,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cargarProductos, cargarSocios, cargarVentasHoy, registrarVenta } from '@/lib/datos'
import { formatoSoles } from '@/lib/format'
import { cn } from '@/lib/utils'
import { etiquetaMetodo, horaAhora, nuevoId } from '@/mocks/caja-data'
import type { MetodoPago } from '@/mocks/caja-data'
import { sociosMock } from '@/mocks/data'
import type { Socio } from '@/mocks/types'
import {
  agotarse,
  descontarStock,
  etiquetaCategoria,
  fechaHoyIso,
  hayStock,
  productosMock,
  resumenLineas,
  totalVenta,
  ventasMock,
} from '@/mocks/pos'
import type { LineaVenta, Producto, Venta } from '@/mocks/pos'

const VALOR_MOSTRADOR = 'mostrador'

const clasesMetodo: Record<MetodoPago, string> = {
  efectivo: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  yape: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  plin: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
}

const metodos: readonly MetodoPago[] = ['efectivo', 'yape', 'plin']

type KpiPos = {
  titulo: string
  valor: string
  icono: LucideIcon
}

type TarjetaProductoProps = {
  producto: Producto
  onAgregar: (producto: Producto) => void
}

function TarjetaProducto({ producto, onAgregar }: TarjetaProductoProps) {
  const sinStock = producto.stock === 0
  const bajo = agotarse(producto)
  return (
    <div className="flex flex-col justify-between gap-3 rounded-lg border p-4">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-sm font-medium leading-tight">
            {producto.nombre}
          </p>
          <Badge variant="secondary" className="shrink-0 text-[11px]">
            {etiquetaCategoria[producto.categoria]}
          </Badge>
        </div>
        <p className="text-base font-semibold tabular-nums">
          {formatoSoles(producto.precio)}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        {sinStock ? (
          <Badge className="bg-red-500/15 text-red-600 dark:text-red-400">
            Agotado
          </Badge>
        ) : bajo ? (
          <Badge className="bg-red-500/15 text-red-600 dark:text-red-400">
            Bajo stock · {producto.stock}
          </Badge>
        ) : (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            {producto.stock} en stock
          </Badge>
        )}
        <Button
          size="icon-sm"
          aria-label={`Añadir ${producto.nombre} al carrito`}
          disabled={sinStock}
          onClick={() => onAgregar(producto)}
        >
          <Plus />
        </Button>
      </div>
    </div>
  )
}

type CarritoVentaProps = {
  lineas: readonly LineaVenta[]
  productos: ReadonlyMap<string, Producto>
  socios: readonly Socio[]
  socioId: string
  metodo: MetodoPago
  exito: boolean
  error: boolean
  registrando: boolean
  onCantidad: (productoId: string, delta: number) => void
  onQuitar: (productoId: string) => void
  onSocioChange: (socioId: string) => void
  onMetodoChange: (metodo: MetodoPago) => void
  onCobrar: () => void
}

function CarritoVenta({
  lineas,
  productos,
  socios,
  socioId,
  metodo,
  exito,
  error,
  registrando,
  onCantidad,
  onQuitar,
  onSocioChange,
  onMetodoChange,
  onCobrar,
}: CarritoVentaProps) {
  const total = totalVenta(lineas)
  return (
    <div className="space-y-4">
      {lineas.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          Sin productos en el carrito
        </p>
      ) : (
        <ul className="space-y-3">
          {lineas.map((linea) => {
            const producto = productos.get(linea.productoId)
            return (
              <li
                key={linea.productoId}
                className="space-y-2 rounded-lg border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium">
                    {linea.nombre}
                  </p>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatoSoles(linea.cantidad * linea.precioUnitario)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-xs"
                      aria-label={`Quitar una unidad de ${linea.nombre}`}
                      disabled={linea.cantidad <= 1}
                      onClick={() => onCantidad(linea.productoId, -1)}
                    >
                      <Minus />
                    </Button>
                    <span className="w-7 text-center text-sm font-medium tabular-nums">
                      {linea.cantidad}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      aria-label={`Añadir una unidad de ${linea.nombre}`}
                      disabled={
                        !producto || !hayStock(producto, linea.cantidad + 1)
                      }
                      onClick={() => onCantidad(linea.productoId, 1)}
                    >
                      <Plus />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Quitar ${linea.nombre} del carrito`}
                    onClick={() => onQuitar(linea.productoId)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Select
        value={socioId}
        onValueChange={(valor) => onSocioChange(valor)}
      >
        <SelectTrigger className="w-full" aria-label="Asociar a socio">
          <SelectValue placeholder="Asociar a socio (opcional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={VALOR_MOSTRADOR}>
            Cliente mostrador (walk-in)
          </SelectItem>
          {socios.map((socio) => (
            <SelectItem key={socio.id} value={socio.id}>
              {socio.nombre} · {socio.codigo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="space-y-2">
        <p className="text-sm font-medium">Método de pago</p>
        <div className="flex flex-wrap gap-2">
          {metodos.map((valor) => (
            <button
              key={valor}
              type="button"
              aria-pressed={metodo === valor}
              onClick={() => onMetodoChange(valor)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                metodo === valor
                  ? cn('border-transparent', clasesMetodo[valor])
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {etiquetaMetodo[valor]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-2xl font-semibold tabular-nums">
          {formatoSoles(total)}
        </span>
      </div>

      <Button
        className="h-12 w-full text-base"
        disabled={lineas.length === 0 || registrando}
        onClick={onCobrar}
      >
        <ShoppingCart />
        {registrando ? 'Cobrando…' : 'Cobrar venta'}
      </Button>
      {exito && (
        <p className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Venta registrada ✓
        </p>
      )}
      {error && (
        <p role="alert" className="text-center text-sm font-medium text-red-600 dark:text-red-400">
          No se pudo registrar la venta. Intenta de nuevo.
        </p>
      )}
    </div>
  )
}

type PosPageProps = {
  productosIniciales?: readonly Producto[]
  ventasIniciales?: readonly Venta[]
  carritoInicial?: readonly LineaVenta[]
}

export default function PosPage({
  productosIniciales = productosMock,
  ventasIniciales = ventasMock,
  carritoInicial = [],
}: PosPageProps) {
  const [productos, setProductos] =
    useState<readonly Producto[]>(productosIniciales)
  const [ventas, setVentas] = useState<readonly Venta[]>(ventasIniciales)
  const [socios, setSocios] = useState<readonly Socio[]>(sociosMock)
  const [backendActivo, setBackendActivo] = useState(false)
  const [carrito, setCarrito] = useState<ReadonlyMap<string, number>>(
    () => new Map(carritoInicial.map((linea) => [linea.productoId, linea.cantidad])),
  )
  const [socioId, setSocioId] = useState(VALOR_MOSTRADOR)
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo')
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState(false)
  const [registrando, setRegistrando] = useState(false)

  useEffect(() => {
    let cancelado = false
    void cargarProductos().then((remotos) => {
      if (cancelado || remotos === null) return
      setProductos(remotos)
      setBackendActivo(true)
    })
    void cargarVentasHoy().then((remotos) => {
      if (!cancelado && remotos !== null) setVentas(remotos)
    })
    void cargarSocios().then((remotos) => {
      if (!cancelado && remotos !== null) setSocios(remotos)
    })
    return () => {
      cancelado = true
    }
  }, [])

  const productoPorId = useMemo(
    () => new Map(productos.map((producto): [string, Producto] => [producto.id, producto])),
    [productos],
  )

  const lineas = useMemo<readonly LineaVenta[]>(
    () =>
      [...carrito.entries()].flatMap(([productoId, cantidad]) => {
        const producto = productoPorId.get(productoId)
        if (!producto) return []
        return [
          {
            productoId,
            nombre: producto.nombre,
            cantidad,
            precioUnitario: producto.precio,
          },
        ]
      }),
    [carrito, productoPorId],
  )

  const unidades = lineas.reduce((suma, linea) => suma + linea.cantidad, 0)
  const hoy = fechaHoyIso()

  const ventasHoy = ventas.filter((venta) => venta.fecha === hoy)
  const totalHoy = ventasHoy.reduce((suma, venta) => suma + venta.total, 0)
  const bajoStock = productos.filter(agotarse).length
  const valorInventario = productos.reduce(
    (suma, producto) => suma + producto.precio * producto.stock,
    0,
  )

  const kpis: readonly KpiPos[] = [
    { titulo: 'Ventas hoy', valor: formatoSoles(totalHoy), icono: Wallet },
    { titulo: 'Transacciones hoy', valor: String(ventasHoy.length), icono: Receipt },
    { titulo: 'Productos bajo stock', valor: String(bajoStock), icono: Package },
    { titulo: 'Valor inventario', valor: formatoSoles(valorInventario), icono: Coins },
  ]

  const cambiarCantidad = (productoId: string, delta: number) => {
    setExito(false)
    setError(false)
    setCarrito((previo) => {
      const producto = productoPorId.get(productoId)
      if (!producto) return previo
      const cantidad = previo.get(productoId) ?? 0
      const siguiente = Math.min(
        Math.max(cantidad + delta, 0),
        producto.stock,
      )
      const nuevo = new Map(previo)
      if (siguiente <= 0) {
        nuevo.delete(productoId)
      } else {
        nuevo.set(productoId, siguiente)
      }
      return nuevo
    })
  }

  const quitar = (productoId: string) => {
    setExito(false)
    setError(false)
    setCarrito((previo) => {
      const nuevo = new Map(previo)
      nuevo.delete(productoId)
      return nuevo
    })
  }

  const limpiarCarrito = () => {
    setCarrito(new Map())
    setSocioId(VALOR_MOSTRADOR)
    setMetodo('efectivo')
  }

  const cobrar = () => {
    if (lineas.length === 0 || registrando) return
    const venta: Venta = {
      id: nuevoId(),
      fecha: fechaHoyIso(),
      hora: horaAhora(),
      socioId: socioId === VALOR_MOSTRADOR ? undefined : socioId,
      lineas,
      total: totalVenta(lineas),
      metodo,
    }
    if (!backendActivo) {
      setVentas((previas) => [venta, ...previas])
      setProductos((previos) => descontarStock(previos, venta))
      limpiarCarrito()
      return
    }
    setRegistrando(true)
    setError(false)
    void registrarVenta({
      socioId: venta.socioId ?? null,
      lineas: lineas.map((linea) => ({ ...linea })),
      total: venta.total,
      metodo,
      hora: venta.hora,
      stockUpdates: lineas.map((linea) => ({
        id: linea.productoId,
        stock: (productoPorId.get(linea.productoId)?.stock ?? 0) - linea.cantidad,
      })),
    })
      .then((ok) => {
        setRegistrando(false)
        if (!ok) {
          setError(true)
          return
        }
        setVentas((previas) => [venta, ...previas])
        setProductos((previos) => descontarStock(previos, venta))
        limpiarCarrito()
        setExito(true)
      })
  }

  const carritoProps: CarritoVentaProps = {
    lineas,
    productos: productoPorId,
    socios,
    socioId,
    metodo,
    exito,
    error,
    registrando,
    onCantidad: cambiarCantidad,
    onQuitar: quitar,
    onSocioChange: (valor) => {
      setSocioId(valor)
      setExito(false)
      setError(false)
    },
    onMetodoChange: (valor) => {
      setMetodo(valor)
      setExito(false)
      setError(false)
    },
    onCobrar: cobrar,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Tienda</h2>
        <p className="text-sm text-muted-foreground">
          Punto de venta y control de stock
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.titulo}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                {kpi.titulo}
                <kpi.icono className="size-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{kpi.valor}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Catálogo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {productos.map((producto) => (
                <TarjetaProducto
                  key={producto.id}
                  producto={producto}
                  onAgregar={(elegido) => cambiarCantidad(elegido.id, 1)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="hidden lg:block">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Carrito
              {unidades > 0 ? (
                <Badge variant="secondary">{unidades}</Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CarritoVenta {...carritoProps} />
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Últimas ventas</CardTitle>
        </CardHeader>
        <CardContent>
          {ventas.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
              Aún no hay ventas registradas hoy
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="h-10 px-1 font-medium md:px-3">Hora</th>
                  <th className="h-10 px-1 font-medium md:px-3">Productos</th>
                  <th className="hidden h-10 px-1 font-medium md:table-cell md:px-3">
                    Método
                  </th>
                  <th className="h-10 px-1 text-right font-medium md:px-3">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => (
                  <tr key={venta.id} className="border-b last:border-0">
                    <td className="px-1 py-3 whitespace-nowrap text-muted-foreground tabular-nums md:px-3">
                      {venta.hora}
                    </td>
                    <td className="max-w-36 truncate px-1 py-3 md:max-w-none md:px-3">
                      {resumenLineas(venta.lineas)}
                    </td>
                    <td className="hidden px-1 py-3 md:table-cell md:px-3">
                      <Badge
                        variant="secondary"
                        className={cn('text-[11px]', clasesMetodo[venta.metodo])}
                      >
                        {etiquetaMetodo[venta.metodo]}
                      </Badge>
                    </td>
                    <td className="px-1 py-3 text-right font-medium whitespace-nowrap tabular-nums md:px-3">
                      {formatoSoles(venta.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="fixed right-4 bottom-4 z-50 lg:hidden">
        <Button
          size="icon-lg"
          className="size-14 rounded-full shadow-lg"
          aria-label={`Abrir carrito, ${unidades} ${unidades === 1 ? 'unidad' : 'unidades'}`}
          onClick={() => setCarritoAbierto(true)}
        >
          <ShoppingCart className="size-5" />
        </Button>
        {unidades > 0 ? (
          <Badge className="absolute -top-1 -right-1 bg-emerald-500 text-emerald-50">
            {unidades}
          </Badge>
        ) : null}
      </div>

      <Sheet open={carritoAbierto} onOpenChange={setCarritoAbierto}>
        <SheetContent side="right" className="w-full gap-0 sm:max-w-sm">
          <SheetHeader className="pb-0">
            <SheetTitle>Carrito</SheetTitle>
            <SheetDescription>
              Revisa el pedido y cobra la venta
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <CarritoVenta {...carritoProps} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
