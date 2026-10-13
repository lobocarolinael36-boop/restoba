import { z } from 'zod'
import type { Rol } from './staff.js'

/**
 * Los pedidos que toma el personal del salón (Fase B, parte operativa).
 * El comensal no pide desde la app en esta etapa: el mozo carga el pedido,
 * la cocina avanza cada plato y el mozo cobra.
 */

export const ESTADOS_PEDIDO = ['abierto', 'cerrado', 'anulado'] as const
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number]

export const NOMBRE_ESTADO_PEDIDO: Record<EstadoPedido, string> = {
  abierto: 'Abierto',
  cerrado: 'Cerrado',
  anulado: 'Anulado',
}

/**
 * El avance de cada plato por la cocina. No se confunde con el estado del
 * pedido: ese dice si la mesa sigue operando o ya se cobró; este dice en
 * qué punto de la cocina está CADA plato, que pueden estar todos en
 * momentos distintos.
 */
export const ESTADOS_ITEM = ['pendiente', 'en_preparacion', 'listo', 'entregado', 'anulado'] as const
export type EstadoItem = (typeof ESTADOS_ITEM)[number]

export const NOMBRE_ESTADO_ITEM: Record<EstadoItem, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
  anulado: 'Anulado',
}

export const METODOS_PAGO = ['efectivo', 'transferencia', 'tarjeta'] as const
export type MetodoPago = (typeof METODOS_PAGO)[number]

export const NOMBRE_METODO_PAGO: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
}

/**
 * Quién puede mover un ítem de un estado a otro.
 *
 * La cocina avanza el plato hasta "listo"; de ahí el mozo lo entrega.
 * Anular un pendiente lo puede hacer el mozo (se pidió de más, se bajó en
 * la mesa); anular algo que ya está en preparación o listo lo autoriza
 * solo el administrador, porque ahí ya se gastó stock o trabajo de cocina.
 * Cualquier otro par (de, a) se rechaza.
 */
export const TRANSICIONES_ITEM: readonly {
  de: EstadoItem
  a: EstadoItem
  roles: readonly Rol[]
}[] = [
  { de: 'pendiente', a: 'en_preparacion', roles: ['cocina', 'admin'] },
  { de: 'en_preparacion', a: 'listo', roles: ['cocina', 'admin'] },
  { de: 'listo', a: 'entregado', roles: ['mozo', 'admin'] },
  { de: 'pendiente', a: 'anulado', roles: ['mozo', 'admin'] },
  { de: 'en_preparacion', a: 'anulado', roles: ['admin'] },
  { de: 'listo', a: 'anulado', roles: ['admin'] },
]

export function transicionPermitida(de: EstadoItem, a: EstadoItem, rol: Rol): boolean {
  return TRANSICIONES_ITEM.some((t) => t.de === de && t.a === a && t.roles.includes(rol))
}

// ── Lo que devuelve la API ───────────────────────────────────

export type ItemPedido = {
  id: number
  productoId: number
  producto: string
  cantidad: number
  precioUnitario: number
  nota: string | null
  estado: EstadoItem
  creadoEn: string
}

export type Pedido = {
  id: number
  mesaId: number
  estado: EstadoPedido
  creadoEn: string
  items: ItemPedido[]
}

export type MesaConPedido = {
  id: number
  numero: string
  capacidad: number
  estado: string
  pedido: Pedido | null
}

/** Lo que ve el tablero de cocina: sin precios, con la mesa y la antigüedad. */
export type ItemCocina = {
  id: number
  pedidoId: number
  mesaNumero: string
  producto: string
  cantidad: number
  nota: string | null
  estado: EstadoItem
  creadoEn: string
}

/** La carta reducida a lo que hace falta para armar un pedido: sin recetas ni stock. */
export type ProductoParaPedido = {
  id: number
  nombre: string
  precio: number
  categoria: string
}

export type ResultadoCobro = {
  ventaId: number
  pedidoId: number
  metodoPago: MetodoPago
  descuento: number
  total: number
}

// ── Lo que manda el panel ───────────────────────────────────

export const abrirPedidoSchema = z.object({
  mesaId: z.coerce.number().int().positive(),
})

export const agregarItemsSchema = z.object({
  items: z
    .array(
      z.object({
        productoId: z.coerce.number().int().positive(),
        cantidad: z.coerce.number().int().min(1, 'Al menos un plato').max(50),
        nota: z.string().trim().max(200).optional(),
      }),
    )
    .min(1, 'Agregá al menos un plato')
    .max(40, 'Un pedido de más de 40 líneas seguro es un error'),
})

export const cambiarEstadoItemSchema = z.object({
  estado: z.enum(ESTADOS_ITEM),
})

export const cobrarPedidoSchema = z.object({
  metodoPago: z.enum(METODOS_PAGO),
  descuento: z.coerce.number().min(0, 'No puede ser negativo').max(99_999_999).optional(),
})
