/* ════════════════════════════════════════════════════════════════════
   PARA LA EXPOSICIÓN

   Los endpoints del salón y la cocina: el mozo abre la mesa, carga los
   platos y cobra; la cocina los ve en su tablero y cambia su estado.

   El comensal no pide desde la app en esta etapa: estas rutas son del
   personal, no del público. Por eso todas llevan `requiereStaff` y, para
   escribir, además `requiereSuscripcion` (igual que carta.ts e
   inventario.ts): un local impago puede seguir viendo sus mesas y su
   cocina, pero no sigue operando hasta regularizar.

   No hay un middleware de "permiso" por nombre ('mesas', 'cocina'...):
   el control real es `requiereRol(...)` con los roles que, en los
   hechos, tienen ese permiso según PERMISOS_ROL (compartido/staff.ts).
   El admin entra a todo, igual que en el resto del panel.

   El restaurante sale siempre de req.usuario, nunca del cuerpo ni de la
   URL (RF-12): todas las consultas de pedidos.ts filtran por él vía
   JOIN a `mesa`. Un id de otro local responde 404, no 403.

   Responde a: Fase B — mozo y cocina. RF-12.
   ════════════════════════════════════════════════════════════════════ */

import {
  abrirPedidoSchema,
  agregarItemsSchema,
  cambiarEstadoItemSchema,
  cobrarPedidoSchema,
} from '@restoba/compartido'
import { Router } from 'express'
import { z } from 'zod'
import {
  abrirPedido,
  agregarItems,
  cambiarEstadoItem,
  cobrar,
  mesasConPedido,
  productosParaPedido,
  tableroCocina,
} from '../db/pedidos.js'
import { requiereRol, requiereStaff, requiereSuscripcion } from '../middleware/staff.js'

export const rutasPedidos = Router()

const idSchema = z.coerce.number().int().positive()

/** Los que manejan el salón: toman pedidos, cargan platos y cobran. */
const mozoOAdmin = [requiereStaff, requiereRol('admin', 'mozo')] as const
const mozoOAdminAlDia = [requiereStaff, requiereRol('admin', 'mozo'), requiereSuscripcion] as const

/** Los que manejan la cocina: ven el tablero y avanzan los platos. */
const cocinaOAdmin = [requiereStaff, requiereRol('admin', 'cocina')] as const

/** Cambiar el estado de un ítem lo puede pedir el salón o la cocina; la tabla
    de transiciones (compartido/pedidos.ts) decide después quién puede cuál. */
const operacionAlDia = [requiereStaff, requiereRol('admin', 'mozo', 'cocina'), requiereSuscripcion] as const

function invalido(res: Parameters<Parameters<typeof rutasPedidos.get>[1]>[1], error: z.ZodError) {
  res.status(400).json({
    error: 'datos_invalidos',
    detalle: error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
  })
}

// ── Mesas, del lado del mozo ──────────────────────────────────

rutasPedidos.get('/gestion/mesas', ...mozoOAdmin, async (req, res) => {
  try {
    res.json({ mesas: await mesasConPedido(req.usuario!.restaurante_id) })
  } catch (error) {
    console.error('Error listando las mesas:', error)
    res.status(500).json({ error: 'error_interno' })
  }
})

/** La carta reducida a lo que hace falta para armar un pedido: el mozo no
    tiene acceso a /gestion/carta (es solo-admin), pero sí necesita elegir
    qué platos agregar. */
rutasPedidos.get('/gestion/pedidos/carta', ...mozoOAdmin, async (req, res) => {
  try {
    res.json({ productos: await productosParaPedido(req.usuario!.restaurante_id) })
  } catch (error) {
    console.error('Error listando la carta para pedidos:', error)
    res.status(500).json({ error: 'error_interno' })
  }
})

// ── Abrir el pedido ────────────────────────────────────────────

rutasPedidos.post('/gestion/pedidos', ...mozoOAdminAlDia, async (req, res) => {
  const parseo = abrirPedidoSchema.safeParse(req.body)
  if (!parseo.success) return invalido(res, parseo.error)

  try {
    const resultado = await abrirPedido({
      mesaId: parseo.data.mesaId,
      restauranteId: req.usuario!.restaurante_id,
      usuarioId: req.usuario!.id,
    })

    if (!resultado.ok) {
      if (resultado.motivo === 'mesa_no_encontrada') {
        res.status(404).json({ error: 'mesa_no_encontrada' })
        return
      }
      res.status(409).json({
        error: 'mesa_ocupada',
        mensaje: 'Esa mesa ya tiene un pedido abierto.',
      })
      return
    }

    res.status(201).json({ pedido: resultado.pedido })
  } catch (error) {
    console.error('Error abriendo el pedido:', error)
    res.status(500).json({ error: 'error_interno' })
  }
})

// ── Agregar ítems ──────────────────────────────────────────────

rutasPedidos.post('/gestion/pedidos/:id/items', ...mozoOAdminAlDia, async (req, res) => {
  const id = idSchema.safeParse(req.params.id)
  const parseo = agregarItemsSchema.safeParse(req.body)
  if (!id.success) {
    res.status(400).json({ error: 'id_invalido' })
    return
  }
  if (!parseo.success) return invalido(res, parseo.error)

  try {
    const resultado = await agregarItems({
      pedidoId: id.data,
      restauranteId: req.usuario!.restaurante_id,
      items: parseo.data.items,
    })

    if (!resultado.ok) {
      if (resultado.motivo === 'pedido_no_encontrado') {
        res.status(404).json({ error: 'pedido_no_encontrado' })
        return
      }
      if (resultado.motivo === 'pedido_no_abierto') {
        res.status(409).json({
          error: 'pedido_no_abierto',
          mensaje: 'Este pedido ya se cerró o se anuló.',
        })
        return
      }
      res.status(400).json({
        error: 'producto_invalido',
        mensaje: 'Alguno de esos platos no existe, es de otro local o hoy no está disponible.',
        productosInvalidos: resultado.productosInvalidos,
      })
      return
    }

    res.status(201).json({ pedido: resultado.pedido })
  } catch (error) {
    console.error('Error agregando ítems al pedido:', error)
    res.status(500).json({ error: 'error_interno' })
  }
})

// ── Cambiar el estado de un ítem ───────────────────────────────

rutasPedidos.put('/gestion/pedidos/items/:id/estado', ...operacionAlDia, async (req, res) => {
  const id = idSchema.safeParse(req.params.id)
  const parseo = cambiarEstadoItemSchema.safeParse(req.body)
  if (!id.success) {
    res.status(400).json({ error: 'id_invalido' })
    return
  }
  if (!parseo.success) return invalido(res, parseo.error)

  try {
    const resultado = await cambiarEstadoItem({
      itemId: id.data,
      restauranteId: req.usuario!.restaurante_id,
      estado: parseo.data.estado,
      rol: req.usuario!.rol,
      usuarioId: req.usuario!.id,
    })

    if (!resultado.ok) {
      if (resultado.motivo === 'item_no_encontrado') {
        res.status(404).json({ error: 'item_no_encontrado' })
        return
      }
      res.status(409).json({
        error: 'transicion_invalida',
        mensaje: 'Ese cambio de estado no está permitido desde donde está el plato.',
      })
      return
    }

    res.json({ item: resultado.item, avisosStock: resultado.avisosStock })
  } catch (error) {
    console.error('Error cambiando el estado del ítem:', error)
    res.status(500).json({ error: 'error_interno' })
  }
})

// ── El tablero de cocina ──────────────────────────────────────

rutasPedidos.get('/gestion/cocina', ...cocinaOAdmin, async (req, res) => {
  try {
    res.json({ items: await tableroCocina(req.usuario!.restaurante_id) })
  } catch (error) {
    console.error('Error leyendo el tablero de cocina:', error)
    res.status(500).json({ error: 'error_interno' })
  }
})

// ── Cobrar ──────────────────────────────────────────────────────

rutasPedidos.post('/gestion/pedidos/:id/cobro', ...mozoOAdminAlDia, async (req, res) => {
  const id = idSchema.safeParse(req.params.id)
  const parseo = cobrarPedidoSchema.safeParse(req.body)
  if (!id.success) {
    res.status(400).json({ error: 'id_invalido' })
    return
  }
  if (!parseo.success) return invalido(res, parseo.error)

  try {
    const resultado = await cobrar({
      pedidoId: id.data,
      restauranteId: req.usuario!.restaurante_id,
      usuarioId: req.usuario!.id,
      metodoPago: parseo.data.metodoPago,
      descuento: parseo.data.descuento,
    })

    if (!resultado.ok) {
      if (resultado.motivo === 'pedido_no_encontrado') {
        res.status(404).json({ error: 'pedido_no_encontrado' })
        return
      }
      if (resultado.motivo === 'pedido_no_abierto') {
        res.status(409).json({ error: 'pedido_no_abierto', mensaje: 'Este pedido ya se cerró.' })
        return
      }
      res.status(409).json({
        error: 'items_pendientes',
        mensaje: 'Todavía hay platos sin entregar o sin anular.',
      })
      return
    }

    res.status(201).json({ venta: resultado.resultado })
  } catch (error) {
    console.error('Error cobrando el pedido:', error)
    res.status(500).json({ error: 'error_interno' })
  }
})
