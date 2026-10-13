/* ════════════════════════════════════════════════════════════════════
   PARA LA EXPOSICIÓN

   Las consultas de la parte operativa de la Fase B: el pedido que toma
   el mozo, el avance de cada plato en cocina y el cobro final.

   Tres ideas que conviene explicar:

   1. El restaurante nunca es una columna de estas tablas. Se llega a él
      por el camino pedido → mesa → restaurante_id, con un JOIN a `mesa`
      en cada consulta. Es la misma idea que ya usa `reserva`: evita una
      dependencia transitiva y hace que un id de otro local devuelva
      "no encontrado" en vez de filtrarse por error.

   2. El descuento de stock al arrancar un plato (`cambiarEstadoItem`,
      cuando pasa a 'en_preparacion') corre DENTRO de la misma transacción
      que el cambio de estado del ítem, reusando `registrarMovimiento` de
      `inventario.ts` con el cliente de esta transacción. Si una de las
      dos partes falla, no queda ni el ítem a medio mover ni el stock
      descontado de un plato que después no se preparó.

   3. Si el stock no alcanza para algún ingrediente, la cocina NO se
      bloquea: el ítem avanza igual y la respuesta lleva un aviso. Frenar
      al cocinero porque falta medio kilo de algo sería peor que dejar
      que el depósito quede en números rojos por un momento; el admin lo
      ve en el libro de movimientos.

   Responde a: Fase B — mozo y cocina. RF-12.
   ════════════════════════════════════════════════════════════════════ */

import type {
  EstadoItem,
  EstadoPedido,
  ItemCocina,
  ItemPedido,
  MetodoPago,
  Pedido,
  MesaConPedido,
  ProductoParaPedido,
  ResultadoCobro,
  Rol,
} from '@restoba/compartido'
import { transicionPermitida } from '@restoba/compartido'
import { consultar, consultarUna, enTransaccion } from './pool.js'
import { registrarMovimiento } from './inventario.js'

// ── Lectura de ítems (compartida por varias consultas) ───────

type FilaItem = {
  id: number
  pedido_id: number
  producto_id: number
  producto: string
  cantidad: number
  precio_unitario: string
  nota: string | null
  estado: EstadoItem
  creado_en: Date
}

function aItem(f: FilaItem): ItemPedido {
  return {
    id: f.id,
    productoId: f.producto_id,
    producto: f.producto,
    cantidad: f.cantidad,
    precioUnitario: Number(f.precio_unitario),
    nota: f.nota,
    estado: f.estado,
    creadoEn: f.creado_en.toISOString(),
  }
}

function itemsDePedidos(pedidoIds: number[]): Promise<FilaItem[]> {
  return consultar<FilaItem>(
    `SELECT ip.id, ip.pedido_id, ip.producto_id, pr.nombre AS producto,
            ip.cantidad, ip.precio_unitario, ip.nota, ip.estado, ip.creado_en
     FROM   item_pedido ip
     JOIN   producto pr ON pr.id = ip.producto_id
     WHERE  ip.pedido_id = ANY($1::int[])
     ORDER BY ip.creado_en`,
    [pedidoIds],
  )
}

async function obtenerPedido(pedidoId: number, restauranteId: number): Promise<Pedido | null> {
  const fila = await consultarUna<{
    id: number
    mesa_id: number
    estado: EstadoPedido
    creado_en: Date
  }>(
    `SELECT p.id, p.mesa_id, p.estado, p.creado_en
     FROM   pedido p
     JOIN   mesa m ON m.id = p.mesa_id
     WHERE  p.id = $1 AND m.restaurante_id = $2`,
    [pedidoId, restauranteId],
  )
  if (!fila) return null

  const filasItems = await itemsDePedidos([pedidoId])
  return {
    id: fila.id,
    mesaId: fila.mesa_id,
    estado: fila.estado,
    creadoEn: fila.creado_en.toISOString(),
    items: filasItems.map(aItem),
  }
}

async function obtenerItem(itemId: number, restauranteId: number): Promise<ItemPedido | null> {
  const fila = await consultarUna<FilaItem>(
    `SELECT ip.id, ip.pedido_id, ip.producto_id, pr.nombre AS producto,
            ip.cantidad, ip.precio_unitario, ip.nota, ip.estado, ip.creado_en
     FROM   item_pedido ip
     JOIN   producto pr ON pr.id = ip.producto_id
     JOIN   pedido p ON p.id = ip.pedido_id
     JOIN   mesa m ON m.id = p.mesa_id
     WHERE  ip.id = $1 AND m.restaurante_id = $2`,
    [itemId, restauranteId],
  )
  return fila ? aItem(fila) : null
}

// ── Mesas, del lado del mozo ──────────────────────────────────

export async function mesasConPedido(restauranteId: number): Promise<MesaConPedido[]> {
  const mesas = await consultar<{ id: number; numero: string; capacidad: number; estado: string }>(
    `SELECT id, numero, capacidad, estado
     FROM   mesa
     WHERE  restaurante_id = $1
     ORDER BY numero`,
    [restauranteId],
  )

  const pedidosAbiertos = await consultar<{
    id: number
    mesa_id: number
    estado: EstadoPedido
    creado_en: Date
  }>(
    `SELECT p.id, p.mesa_id, p.estado, p.creado_en
     FROM   pedido p
     JOIN   mesa m ON m.id = p.mesa_id
     WHERE  m.restaurante_id = $1 AND p.estado = 'abierto'`,
    [restauranteId],
  )

  const filasItems = pedidosAbiertos.length
    ? await itemsDePedidos(pedidosAbiertos.map((p) => p.id))
    : []

  const itemsPorPedido = new Map<number, ItemPedido[]>()
  for (const f of filasItems) {
    const lista = itemsPorPedido.get(f.pedido_id) ?? []
    lista.push(aItem(f))
    itemsPorPedido.set(f.pedido_id, lista)
  }

  const pedidoPorMesa = new Map(pedidosAbiertos.map((p) => [p.mesa_id, p]))

  return mesas.map((m) => {
    const p = pedidoPorMesa.get(m.id)
    return {
      id: m.id,
      numero: m.numero,
      capacidad: m.capacidad,
      estado: m.estado,
      pedido: p
        ? {
            id: p.id,
            mesaId: p.mesa_id,
            estado: p.estado,
            creadoEn: p.creado_en.toISOString(),
            items: itemsPorPedido.get(p.id) ?? [],
          }
        : null,
    }
  })
}

/** La carta reducida a lo que hace falta para armar un pedido: sin recetas ni stock. */
export async function productosParaPedido(restauranteId: number): Promise<ProductoParaPedido[]> {
  const filas = await consultar<{ id: number; nombre: string; precio: string; categoria: string }>(
    `SELECT p.id, p.nombre, p.precio, c.nombre AS categoria
     FROM   producto p
     JOIN   categoria c ON c.id = p.categoria_id
     WHERE  p.restaurante_id = $1 AND p.activo = true
     ORDER BY c.orden, p.orden`,
    [restauranteId],
  )
  return filas.map((f) => ({ id: f.id, nombre: f.nombre, precio: Number(f.precio), categoria: f.categoria }))
}

// ── Abrir el pedido ────────────────────────────────────────────

export type ResultadoAbrirPedido =
  | { ok: true; pedido: Pedido }
  | { ok: false; motivo: 'mesa_no_encontrada' | 'mesa_ocupada' }

export async function abrirPedido(datos: {
  mesaId: number
  restauranteId: number
  usuarioId: number
}): Promise<ResultadoAbrirPedido> {
  let pedidoId: number

  try {
    pedidoId = await enTransaccion(async (cliente) => {
      const { rows } = await cliente.query<{ id: number }>(
        `SELECT id FROM mesa WHERE id = $1 AND restaurante_id = $2 FOR UPDATE`,
        [datos.mesaId, datos.restauranteId],
      )
      if (rows.length === 0) throw new Error('mesa_no_encontrada')

      // El índice único parcial (mesa_id) WHERE estado = 'abierto' es lo que
      // de verdad impide dos pedidos abiertos en la misma mesa; esto solo
      // traduce esa violación a un error legible.
      const { rows: insertado } = await cliente.query<{ id: number }>(
        `INSERT INTO pedido (mesa_id, usuario_id) VALUES ($1, $2) RETURNING id`,
        [datos.mesaId, datos.usuarioId],
      )
      await cliente.query(`UPDATE mesa SET estado = 'ocupada' WHERE id = $1`, [datos.mesaId])
      return insertado[0]!.id
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'mesa_no_encontrada') {
      return { ok: false, motivo: 'mesa_no_encontrada' }
    }
    if ((error as { code?: string })?.code === '23505') {
      return { ok: false, motivo: 'mesa_ocupada' }
    }
    throw error
  }

  const pedido = await obtenerPedido(pedidoId, datos.restauranteId)
  if (!pedido) return { ok: false, motivo: 'mesa_no_encontrada' }
  return { ok: true, pedido }
}

// ── Agregar ítems ──────────────────────────────────────────────
// No hay estado "borrador": el pedido se manda a cocina en cuanto se
// cargan los ítems, con estado 'pendiente' por defecto.

export type ResultadoAgregarItems =
  | { ok: true; pedido: Pedido }
  | { ok: false; motivo: 'pedido_no_encontrado' }
  | { ok: false; motivo: 'pedido_no_abierto' }
  | { ok: false; motivo: 'producto_invalido'; productosInvalidos: number[] }

export async function agregarItems(datos: {
  pedidoId: number
  restauranteId: number
  items: { productoId: number; cantidad: number; nota?: string }[]
}): Promise<ResultadoAgregarItems> {
  try {
    await enTransaccion(async (cliente) => {
      const { rows: pedidos } = await cliente.query<{ id: number; estado: EstadoPedido }>(
        `SELECT p.id, p.estado
         FROM   pedido p
         JOIN   mesa m ON m.id = p.mesa_id
         WHERE  p.id = $1 AND m.restaurante_id = $2
         FOR UPDATE OF p`,
        [datos.pedidoId, datos.restauranteId],
      )
      if (pedidos.length === 0) throw new Error('pedido_no_encontrado')
      if (pedidos[0]!.estado !== 'abierto') throw new Error('pedido_no_abierto')

      // Toma el precio vigente AHORA: es el que queda congelado en el ítem.
      const idsBuscados = [...new Set(datos.items.map((i) => i.productoId))]
      const { rows: productos } = await cliente.query<{ id: number; precio: string }>(
        `SELECT id, precio FROM producto
         WHERE restaurante_id = $1 AND activo = true AND id = ANY($2::int[])`,
        [datos.restauranteId, idsBuscados],
      )
      const precios = new Map(productos.map((p) => [p.id, Number(p.precio)]))

      const invalidos = idsBuscados.filter((id) => !precios.has(id))
      if (invalidos.length > 0) {
        const error = new Error('producto_invalido') as Error & { productosInvalidos: number[] }
        error.productosInvalidos = invalidos
        throw error
      }

      for (const item of datos.items) {
        await cliente.query(
          `INSERT INTO item_pedido (pedido_id, producto_id, cantidad, precio_unitario, nota)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            datos.pedidoId,
            item.productoId,
            item.cantidad,
            precios.get(item.productoId),
            item.nota ?? null,
          ],
        )
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'pedido_no_encontrado') {
      return { ok: false, motivo: 'pedido_no_encontrado' }
    }
    if (error instanceof Error && error.message === 'pedido_no_abierto') {
      return { ok: false, motivo: 'pedido_no_abierto' }
    }
    if (error instanceof Error && error.message === 'producto_invalido') {
      const productosInvalidos = (error as Error & { productosInvalidos: number[] }).productosInvalidos
      return { ok: false, motivo: 'producto_invalido', productosInvalidos }
    }
    throw error
  }

  const pedido = await obtenerPedido(datos.pedidoId, datos.restauranteId)
  if (!pedido) return { ok: false, motivo: 'pedido_no_encontrado' }
  return { ok: true, pedido }
}

// ── Cambiar el estado de un ítem (acá vive el descuento de stock) ──

export type ResultadoCambiarEstadoItem =
  | { ok: true; item: ItemPedido; avisosStock: string[] }
  | { ok: false; motivo: 'item_no_encontrado' | 'transicion_invalida' }

export async function cambiarEstadoItem(datos: {
  itemId: number
  restauranteId: number
  estado: EstadoItem
  rol: Rol
  usuarioId: number
}): Promise<ResultadoCambiarEstadoItem> {
  const avisosStock: string[] = []

  try {
    await enTransaccion(async (cliente) => {
      const { rows } = await cliente.query<{
        id: number
        pedido_id: number
        producto_id: number
        cantidad: number
        estado: EstadoItem
      }>(
        `SELECT ip.id, ip.pedido_id, ip.producto_id, ip.cantidad, ip.estado
         FROM   item_pedido ip
         JOIN   pedido p ON p.id = ip.pedido_id
         JOIN   mesa m ON m.id = p.mesa_id
         WHERE  ip.id = $1 AND m.restaurante_id = $2
         FOR UPDATE OF ip`,
        [datos.itemId, datos.restauranteId],
      )
      if (rows.length === 0) throw new Error('item_no_encontrado')

      const actual = rows[0]!
      if (!transicionPermitida(actual.estado, datos.estado, datos.rol)) {
        throw new Error('transicion_invalida')
      }

      // Al entrar a preparación es cuando se gasta el ingrediente. No antes
      // (todavía puede anularse sin costo) ni después (ya se gastó).
      if (datos.estado === 'en_preparacion') {
        const { rows: receta } = await cliente.query<{
          ingrediente_id: number
          cantidad: string
          nombre: string
        }>(
          `SELECT pi.ingrediente_id, pi.cantidad, i.nombre
           FROM   producto_ingrediente pi
           JOIN   ingrediente i ON i.id = pi.ingrediente_id
           WHERE  pi.producto_id = $1 AND i.restaurante_id = $2`,
          [actual.producto_id, datos.restauranteId],
        )

        for (const r of receta) {
          const resultado = await registrarMovimiento(
            {
              ingredienteId: r.ingrediente_id,
              restauranteId: datos.restauranteId,
              usuarioId: datos.usuarioId,
              cantidad: Number(r.cantidad) * actual.cantidad,
              motivo: 'consumo',
              nota: `Pedido #${actual.pedido_id}, ítem #${actual.id}`,
            },
            cliente,
          )

          // No se bloquea a la cocina por falta de stock: se avisa y se sigue.
          if (!resultado.ok) {
            avisosStock.push(
              resultado.motivo === 'stock_insuficiente'
                ? `${r.nombre}: no alcanza el stock (quedan ${resultado.disponible}).`
                : `${r.nombre}: no se pudo descontar del stock.`,
            )
          }
        }
      }

      await cliente.query(`UPDATE item_pedido SET estado = $2 WHERE id = $1`, [datos.itemId, datos.estado])
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'item_no_encontrado') {
      return { ok: false, motivo: 'item_no_encontrado' }
    }
    if (error instanceof Error && error.message === 'transicion_invalida') {
      return { ok: false, motivo: 'transicion_invalida' }
    }
    throw error
  }

  const item = await obtenerItem(datos.itemId, datos.restauranteId)
  if (!item) return { ok: false, motivo: 'item_no_encontrado' }
  return { ok: true, item, avisosStock }
}

// ── El tablero de cocina ──────────────────────────────────────

export async function tableroCocina(restauranteId: number): Promise<ItemCocina[]> {
  const filas = await consultar<{
    id: number
    pedido_id: number
    mesa_numero: string
    producto: string
    cantidad: number
    nota: string | null
    estado: EstadoItem
    creado_en: Date
  }>(
    `SELECT ip.id, ip.pedido_id, m.numero AS mesa_numero, pr.nombre AS producto,
            ip.cantidad, ip.nota, ip.estado, ip.creado_en
     FROM   item_pedido ip
     JOIN   pedido p ON p.id = ip.pedido_id
     JOIN   mesa m ON m.id = p.mesa_id
     JOIN   producto pr ON pr.id = ip.producto_id
     WHERE  m.restaurante_id = $1
       AND  p.estado = 'abierto'
       AND  ip.estado IN ('pendiente', 'en_preparacion', 'listo')
     ORDER BY ip.creado_en`,
    [restauranteId],
  )

  return filas.map((f) => ({
    id: f.id,
    pedidoId: f.pedido_id,
    mesaNumero: f.mesa_numero,
    producto: f.producto,
    cantidad: f.cantidad,
    nota: f.nota,
    estado: f.estado,
    creadoEn: f.creado_en.toISOString(),
  }))
}

// ── Cobrar ──────────────────────────────────────────────────────

export type ResultadoCobrar =
  | { ok: true; resultado: ResultadoCobro }
  | { ok: false; motivo: 'pedido_no_encontrado' | 'pedido_no_abierto' | 'items_pendientes' }

export async function cobrar(datos: {
  pedidoId: number
  restauranteId: number
  usuarioId: number
  metodoPago: MetodoPago
  descuento?: number
}): Promise<ResultadoCobrar> {
  let ventaId: number

  try {
    ventaId = await enTransaccion(async (cliente) => {
      const { rows } = await cliente.query<{ id: number; mesa_id: number; estado: EstadoPedido }>(
        `SELECT p.id, p.mesa_id, p.estado
         FROM   pedido p
         JOIN   mesa m ON m.id = p.mesa_id
         WHERE  p.id = $1 AND m.restaurante_id = $2
         FOR UPDATE OF p`,
        [datos.pedidoId, datos.restauranteId],
      )
      if (rows.length === 0) throw new Error('pedido_no_encontrado')
      if (rows[0]!.estado !== 'abierto') throw new Error('pedido_no_abierto')
      const mesaId = rows[0]!.mesa_id

      // Se puede cobrar cuando ya no queda nada "en curso": todo entregado
      // o anulado. Lo que anda a medio camino no se cobra ni se ignora.
      const { rows: pendientes } = await cliente.query<{ id: number }>(
        `SELECT id FROM item_pedido
         WHERE pedido_id = $1 AND estado NOT IN ('entregado', 'anulado')`,
        [datos.pedidoId],
      )
      if (pendientes.length > 0) throw new Error('items_pendientes')

      const { rows: venta } = await cliente.query<{ id: number }>(
        `INSERT INTO venta (pedido_id, usuario_id, metodo_pago, descuento)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [datos.pedidoId, datos.usuarioId, datos.metodoPago, datos.descuento ?? 0],
      )

      await cliente.query(`UPDATE pedido SET estado = 'cerrado' WHERE id = $1`, [datos.pedidoId])
      await cliente.query(`UPDATE mesa SET estado = 'libre' WHERE id = $1`, [mesaId])

      return venta[0]!.id
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'pedido_no_encontrado') {
      return { ok: false, motivo: 'pedido_no_encontrado' }
    }
    if (error instanceof Error && error.message === 'pedido_no_abierto') {
      return { ok: false, motivo: 'pedido_no_abierto' }
    }
    if (error instanceof Error && error.message === 'items_pendientes') {
      return { ok: false, motivo: 'items_pendientes' }
    }
    throw error
  }

  // El total nunca se guardó: se lee de la vista, que lo calcula sobre los
  // ítems que de verdad se cobran (los anulados no suman).
  const fila = await consultarUna<{ metodo_pago: MetodoPago; descuento: string; total: string }>(
    `SELECT v.metodo_pago, v.descuento, t.total
     FROM   venta v
     JOIN   v_venta_total t ON t.venta_id = v.id
     WHERE  v.id = $1`,
    [ventaId],
  )

  return {
    ok: true,
    resultado: {
      ventaId,
      pedidoId: datos.pedidoId,
      metodoPago: fila!.metodo_pago,
      descuento: Number(fila!.descuento),
      total: Number(fila!.total),
    },
  }
}
