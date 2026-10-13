/* ════════════════════════════════════════════════════════════════════
   PARA LA EXPOSICIÓN

   El puente con la API, pero del lado del restaurante.

   Por qué es un archivo aparte de cliente.ts y no unas funciones más
   dentro de él: son dos aplicaciones distintas que comparten el mismo
   servidor. El comensal busca restaurantes; el personal del local
   administra el suyo. No comparten sesión, no comparten pantallas y no
   deberían compartir el token. Separarlos también acá hace que el
   límite entre los dos mundos se vea en la estructura de carpetas, no
   solo en la cabeza de quien lo programó.

   Todas las llamadas de acá van con mundo: 'gestion', que es lo que
   hace que salga el token del panel y no el del comensal.

   Responde a: RF-08, RF-12.
   ════════════════════════════════════════════════════════════════════ */

import type {
  CategoriaGestion,
  EstadoItem,
  Ingrediente,
  ItemCocina,
  ItemPedido,
  MesaConPedido,
  MetodoPago,
  MovimientoStock,
  Pedido,
  ProductoGestion,
  ProductoParaPedido,
  RecetaProducto,
  ResultadoCobro,
  RespuestaSesionStaff,
} from '@restoba/compartido'
import { guardarTokenGestion, pedir } from './cliente'

/** Igual que en el lado del comensal: el token vive en memoria, no en el disco. */
export { guardarTokenGestion }

const G = { conToken: true, mundo: 'gestion' } as const

// ── Sesión del personal ─────────────────────────────────────

export function ingresarGestion(datos: {
  email: string
  password: string
}): Promise<RespuestaSesionStaff> {
  return pedir('/gestion/login', { metodo: 'POST', cuerpo: datos })
}

/** Recupera la sesión del panel con su cookie httpOnly, al recargar la página. */
export function renovarGestion(senal?: AbortSignal): Promise<RespuestaSesionStaff> {
  return pedir('/gestion/refresh', { metodo: 'POST', senal })
}

export function salirGestion(): Promise<{ ok: boolean }> {
  return pedir('/gestion/logout', { metodo: 'POST' })
}

// ── Inventario ──────────────────────────────────────────────

export type EstadoInventario = { ingredientes: Ingrediente[]; bajoMinimo: number }

export function verInventario(senal?: AbortSignal): Promise<EstadoInventario> {
  return pedir('/gestion/inventario', { ...G, senal })
}

export function crearIngrediente(datos: {
  nombre: string
  unidad: string
  stockInicial: number
  stockMinimo: number
  costoUnitario?: number
}): Promise<{ ingrediente: Ingrediente }> {
  return pedir('/gestion/inventario', { ...G, metodo: 'POST', cuerpo: datos })
}

export function editarIngrediente(
  id: number,
  datos: { nombre?: string; stockMinimo?: number; costoUnitario?: number | null; activo?: boolean },
): Promise<{ ingrediente: Ingrediente }> {
  return pedir(`/gestion/inventario/${id}`, { ...G, metodo: 'PUT', cuerpo: datos })
}

export function registrarMovimiento(
  id: number,
  datos: { cantidad: number; motivo: 'compra' | 'ajuste' | 'merma'; nota?: string },
): Promise<{ ingrediente: Ingrediente }> {
  return pedir(`/gestion/inventario/${id}/movimiento`, { ...G, metodo: 'POST', cuerpo: datos })
}

export async function verMovimientos(senal?: AbortSignal): Promise<MovimientoStock[]> {
  const { movimientos } = await pedir<{ movimientos: MovimientoStock[] }>(
    '/gestion/inventario/movimientos',
    { ...G, senal },
  )
  return movimientos
}

// ── Recetas ─────────────────────────────────────────────────

export type PlatoConReceta = {
  id: number
  nombre: string
  categoria: string
  activo: boolean
  ingredientes: number
}

export async function verPlatos(senal?: AbortSignal): Promise<PlatoConReceta[]> {
  const { platos } = await pedir<{ platos: PlatoConReceta[] }>('/gestion/recetas', { ...G, senal })
  return platos
}

export async function verReceta(id: number, senal?: AbortSignal): Promise<RecetaProducto> {
  const { receta } = await pedir<{ receta: RecetaProducto }>(`/gestion/recetas/${id}`, {
    ...G,
    senal,
  })
  return receta
}

export async function guardarReceta(
  id: number,
  items: { ingredienteId: number; cantidad: number }[],
): Promise<RecetaProducto> {
  const { receta } = await pedir<{ receta: RecetaProducto }>(`/gestion/recetas/${id}`, {
    ...G,
    metodo: 'PUT',
    cuerpo: { items },
  })
  return receta
}

// ── La carta ────────────────────────────────────────────────

export async function verCarta(senal?: AbortSignal): Promise<CategoriaGestion[]> {
  const { carta } = await pedir<{ carta: CategoriaGestion[] }>('/gestion/carta', { ...G, senal })
  return carta
}

export async function crearSeccion(nombre: string): Promise<CategoriaGestion> {
  const { categoria } = await pedir<{ categoria: CategoriaGestion }>('/gestion/carta/secciones', {
    ...G,
    metodo: 'POST',
    cuerpo: { nombre },
  })
  return categoria
}

export function renombrarSeccion(id: number, nombre: string): Promise<unknown> {
  return pedir(`/gestion/carta/secciones/${id}`, { ...G, metodo: 'PUT', cuerpo: { nombre } })
}

export function borrarSeccion(id: number): Promise<unknown> {
  return pedir(`/gestion/carta/secciones/${id}`, { ...G, metodo: 'DELETE' })
}

export type DatosPlato = {
  categoriaId?: number
  nombre?: string
  descripcion?: string | null
  precio?: number
  activo?: boolean
  vegetariano?: boolean
  sinTacc?: boolean
  destacado?: boolean
}

export async function crearPlato(datos: DatosPlato & { categoriaId: number }): Promise<ProductoGestion> {
  const { producto } = await pedir<{ producto: ProductoGestion }>('/gestion/carta/platos', {
    ...G,
    metodo: 'POST',
    cuerpo: datos,
  })
  return producto
}

export async function editarPlato(id: number, datos: DatosPlato): Promise<ProductoGestion> {
  const { producto } = await pedir<{ producto: ProductoGestion }>(`/gestion/carta/platos/${id}`, {
    ...G,
    metodo: 'PUT',
    cuerpo: datos,
  })
  return producto
}

export function borrarPlato(id: number): Promise<unknown> {
  return pedir(`/gestion/carta/platos/${id}`, { ...G, metodo: 'DELETE' })
}

// ── Pedidos (salón y cocina) ────────────────────────────────

export async function verMesas(senal?: AbortSignal): Promise<MesaConPedido[]> {
  const { mesas } = await pedir<{ mesas: MesaConPedido[] }>('/gestion/mesas', { ...G, senal })
  return mesas
}

/** La carta reducida a lo que hace falta para armar un pedido (el mozo no
    entra a /gestion/carta, que es solo del administrador). */
export async function verCartaParaPedidos(senal?: AbortSignal): Promise<ProductoParaPedido[]> {
  const { productos } = await pedir<{ productos: ProductoParaPedido[] }>('/gestion/pedidos/carta', {
    ...G,
    senal,
  })
  return productos
}

export async function abrirPedido(mesaId: number): Promise<Pedido> {
  const { pedido } = await pedir<{ pedido: Pedido }>('/gestion/pedidos', {
    ...G,
    metodo: 'POST',
    cuerpo: { mesaId },
  })
  return pedido
}

export async function agregarItemsPedido(
  pedidoId: number,
  items: { productoId: number; cantidad: number; nota?: string }[],
): Promise<Pedido> {
  const { pedido } = await pedir<{ pedido: Pedido }>(`/gestion/pedidos/${pedidoId}/items`, {
    ...G,
    metodo: 'POST',
    cuerpo: { items },
  })
  return pedido
}

export function cambiarEstadoItem(
  itemId: number,
  estado: EstadoItem,
): Promise<{ item: ItemPedido; avisosStock: string[] }> {
  return pedir(`/gestion/pedidos/items/${itemId}/estado`, {
    ...G,
    metodo: 'PUT',
    cuerpo: { estado },
  })
}

export async function verTableroCocina(senal?: AbortSignal): Promise<ItemCocina[]> {
  const { items } = await pedir<{ items: ItemCocina[] }>('/gestion/cocina', { ...G, senal })
  return items
}

export async function cobrarPedido(
  pedidoId: number,
  datos: { metodoPago: MetodoPago; descuento?: number },
): Promise<ResultadoCobro> {
  const { venta } = await pedir<{ venta: ResultadoCobro }>(`/gestion/pedidos/${pedidoId}/cobro`, {
    ...G,
    metodo: 'POST',
    cuerpo: datos,
  })
  return venta
}
