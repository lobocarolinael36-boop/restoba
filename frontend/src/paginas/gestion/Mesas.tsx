/* ════════════════════════════════════════════════════════════════════
   PARA LA EXPOSICIÓN

   La pantalla del mozo: el mapa de mesas, el pedido de cada una y el
   cobro final. Pensada para el celular, que es lo que lleva el mozo en
   la mano en el salón.

   Dos ideas para contar frente a la pantalla:

   1. No hay "tiempo real" con sockets en esta etapa: la pantalla
      vuelve a pedir las mesas cada 4 segundos (`useRefrescoPeriodico`,
      ahí abajo) y se frena sola si la pestaña pasa a segundo plano, para
      no gastar batería ni pedidos de más mientras nadie la mira.

   2. El botón de cada plato depende de en qué estado está: un pendiente
      se puede anular (se pidió de más), uno listo se marca entregado.
      Lo que está en preparación no tiene botón para el mozo: ya lo está
      cocinando alguien y anularlo a esa altura lo decide el admin, no
      el salón. La regla real vive en `compartido/pedidos.ts`
      (`transicionPermitida`); esto solo le sigue el juego para no
      ofrecer un botón que el servidor va a rechazar.

   Responde a: Fase B — mozo.
   ════════════════════════════════════════════════════════════════════ */

import {
  METODOS_PAGO,
  NOMBRE_ESTADO_ITEM,
  NOMBRE_METODO_PAGO,
  type EstadoItem,
  type MesaConPedido,
  type MetodoPago,
  type ProductoParaPedido,
  type ResultadoCobro,
} from '@restoba/compartido'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ErrorApi } from '../../lib/cliente'
import * as api from '../../lib/gestion'
import { useGestion } from '../../lib/SesionGestion'

/** Repite `tarea` cada `ms`, y se pausa mientras la pestaña está oculta. */
function useRefrescoPeriodico(tarea: () => void, ms: number) {
  const ref = useRef(tarea)
  ref.current = tarea

  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) ref.current()
    }, ms)
    return () => clearInterval(id)
  }, [ms])
}

export function Mesas() {
  const { usuario } = useGestion()
  const puedeOperar = usuario?.suscripcion === 'activa'

  const [mesas, setMesas] = useState<MesaConPedido[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mesaId, setMesaId] = useState<number | null>(null)

  const recargar = useCallback(async (senal?: AbortSignal) => {
    const lista = await api.verMesas(senal)
    setMesas(lista)
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    recargar(ctrl.signal)
      .catch(() => {
        if (!ctrl.signal.aborted) setError('No pudimos leer las mesas.')
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setCargando(false)
      })
    return () => ctrl.abort()
  }, [recargar])

  useRefrescoPeriodico(() => {
    recargar().catch(() => undefined)
  }, 4000)

  const seleccionada = mesas.find((m) => m.id === mesaId) ?? null

  async function abrir(id: number) {
    try {
      await api.abrirPedido(id)
      setMesaId(id)
      await recargar()
    } catch (e) {
      setError(e instanceof ErrorApi ? (e.detalle ?? 'No pudimos abrir el pedido.') : 'No pudimos abrir el pedido.')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="min-w-0">
        <div className="mb-5">
          <p className="volanta mb-1 text-vino">Salón</p>
          <h1 className="text-[28px] leading-tight">Mesas</h1>
        </div>

        {error && (
          <p className="mb-4 rounded-r-[10px] border-l-[3px] border-vino bg-vino-suave px-4 py-3 text-[13.5px] text-tinta-2">
            {error}
          </p>
        )}

        {cargando ? (
          <p className="py-10 text-center font-mono text-[12.5px] text-tinta-3">Leyendo las mesas…</p>
        ) : mesas.length === 0 ? (
          <p className="rounded-panel border border-dashed border-regla-2 bg-superficie-2 px-6 py-8 text-center text-sm text-tinta-3">
            Todavía no hay mesas cargadas para este local.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {mesas.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMesaId(m.id)}
                className={[
                  'panel flex flex-col items-start gap-1.5 px-4 py-3.5 text-left transition-colors',
                  mesaId === m.id ? 'border-vino' : 'hover:border-regla-2',
                ].join(' ')}
              >
                <span className="font-display text-[19px] leading-none font-semibold text-tinta">
                  Mesa {m.numero}
                </span>
                <span className="font-mono text-[11px] text-tinta-3">{m.capacidad} personas</span>
                {m.pedido ? (
                  <span className="chip chip-vino">{m.pedido.items.length} platos</span>
                ) : (
                  <span className={m.estado === 'libre' ? 'chip chip-verde' : 'chip'}>{m.estado}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <aside className="lg:sticky lg:top-[132px] lg:self-start">
        {!seleccionada && (
          <div className="panel px-5 py-6 text-center">
            <p className="text-[13.5px] leading-relaxed text-tinta-2">
              Elegí una mesa para ver o cargar su pedido.
            </p>
          </div>
        )}

        {seleccionada && !seleccionada.pedido && (
          <div className="panel px-5 py-5">
            <p className="volanta mb-1 text-tinta-3">Mesa {seleccionada.numero}</p>
            <h2 className="mb-4 text-[19px] leading-tight">Sin pedido abierto</h2>
            <button
              type="button"
              className="boton boton-vino w-full"
              disabled={!puedeOperar}
              onClick={() => abrir(seleccionada.id)}
            >
              Abrir pedido
            </button>
          </div>
        )}

        {seleccionada?.pedido && (
          <PanelPedido
            mesaNumero={seleccionada.numero}
            pedido={seleccionada.pedido}
            puedeOperar={puedeOperar}
            rolAdmin={usuario?.rol === 'admin'}
            onCambio={recargar}
            onCobrado={() => setMesaId(null)}
          />
        )}
      </aside>
    </div>
  )
}

// ── El pedido de la mesa elegida ─────────────────────────────

function PanelPedido({
  mesaNumero,
  pedido,
  puedeOperar,
  rolAdmin,
  onCambio,
  onCobrado,
}: {
  mesaNumero: string
  pedido: MesaConPedido['pedido'] & object
  puedeOperar: boolean
  rolAdmin: boolean
  onCambio: () => Promise<void>
  onCobrado: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [actualizando, setActualizando] = useState<number | null>(null)

  async function cambiarEstado(itemId: number, estado: EstadoItem) {
    setError(null)
    setAviso(null)
    setActualizando(itemId)
    try {
      const { avisosStock } = await api.cambiarEstadoItem(itemId, estado)
      if (avisosStock.length > 0) setAviso(avisosStock.join(' '))
      await onCambio()
    } catch (e) {
      setError(
        e instanceof ErrorApi ? (e.detalle ?? 'No pudimos actualizar el plato.') : 'No pudimos actualizar el plato.',
      )
    } finally {
      setActualizando(null)
    }
  }

  const todosListosParaCobrar =
    pedido.items.length > 0 &&
    pedido.items.every((i) => i.estado === 'entregado' || i.estado === 'anulado')

  return (
    <div className="panel px-5 py-5">
      <p className="volanta mb-1 text-tinta-3">Mesa {mesaNumero}</p>
      <h2 className="mb-4 text-[19px] leading-tight">Pedido #{pedido.id}</h2>

      {error && (
        <p className="mb-3 rounded-r-[10px] border-l-[3px] border-vino bg-vino-suave px-3.5 py-2.5 text-[13px] text-tinta-2">
          {error}
        </p>
      )}
      {aviso && (
        <p className="mb-3 rounded-r-[10px] border-l-[3px] border-ambar bg-ambar-suave px-3.5 py-2.5 text-[12.5px] leading-snug text-tinta-2">
          {aviso}
        </p>
      )}

      {pedido.items.length === 0 ? (
        <p className="mb-4 text-[13px] text-tinta-3">Todavía no cargaste ningún plato.</p>
      ) : (
        <ul className="mb-4 flex flex-col gap-2">
          {pedido.items.map((item) => {
            const puedeAnular =
              puedeOperar &&
              (item.estado === 'pendiente' ||
                (rolAdmin && (item.estado === 'en_preparacion' || item.estado === 'listo')))
            const puedeEntregar = puedeOperar && item.estado === 'listo'

            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-2 rounded-[10px] border border-regla bg-superficie px-3 py-2.5"
              >
                <span className="font-mono text-[12.5px] text-tinta-3">{item.cantidad}×</span>
                <span className="min-w-0 flex-1 text-[13.5px] font-medium text-tinta">
                  {item.producto}
                  {item.nota && <span className="block text-[11.5px] text-tinta-3">{item.nota}</span>}
                </span>
                <span
                  className={
                    item.estado === 'entregado'
                      ? 'chip chip-verde'
                      : item.estado === 'anulado'
                        ? 'chip'
                        : item.estado === 'listo'
                          ? 'chip chip-ambar'
                          : 'chip'
                  }
                >
                  {NOMBRE_ESTADO_ITEM[item.estado]}
                </span>

                {puedeEntregar && (
                  <button
                    type="button"
                    className="boton boton-vino boton-chico"
                    disabled={actualizando === item.id}
                    onClick={() => cambiarEstado(item.id, 'entregado')}
                  >
                    Entregar
                  </button>
                )}
                {puedeAnular && (
                  <button
                    type="button"
                    className="boton boton-fantasma boton-chico"
                    disabled={actualizando === item.id}
                    onClick={() => cambiarEstado(item.id, 'anulado')}
                  >
                    Anular
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {puedeOperar && <FormaAgregarItem pedidoId={pedido.id} onAgregado={onCambio} />}

      <div className="mt-5 border-t border-regla pt-4">
        <FormaCobro
          pedidoId={pedido.id}
          puedeCobrar={puedeOperar && todosListosParaCobrar}
          onCobrado={onCobrado}
        />
        {puedeOperar && !todosListosParaCobrar && pedido.items.length > 0 && (
          <p className="mt-2 text-[11.5px] leading-snug text-tinta-3">
            Para cobrar, todos los platos tienen que estar entregados o anulados.
          </p>
        )}
      </div>
    </div>
  )
}

function FormaAgregarItem({
  pedidoId,
  onAgregado,
}: {
  pedidoId: number
  onAgregado: () => Promise<void>
}) {
  const [abierto, setAbierto] = useState(false)
  const [carta, setCarta] = useState<ProductoParaPedido[]>([])
  const [productoId, setProductoId] = useState<number | ''>('')
  const [cantidad, setCantidad] = useState('1')
  const [nota, setNota] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    const ctrl = new AbortController()
    api
      .verCartaParaPedidos(ctrl.signal)
      .then((lista) => {
        setCarta(lista)
        if (lista[0]) setProductoId(lista[0].id)
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setError('No pudimos leer la carta.')
      })
    return () => ctrl.abort()
  }, [abierto])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (productoId === '') return
    setError(null)
    setEnviando(true)
    try {
      await api.agregarItemsPedido(pedidoId, [
        {
          productoId,
          cantidad: Number(cantidad || 1),
          ...(nota.trim() === '' ? {} : { nota: nota.trim() }),
        },
      ])
      setCantidad('1')
      setNota('')
      await onAgregado()
    } catch (e) {
      setError(
        e instanceof ErrorApi ? (e.detalle ?? 'No pudimos agregar el plato.') : 'No pudimos agregar el plato.',
      )
    } finally {
      setEnviando(false)
    }
  }

  if (!abierto) {
    return (
      <button type="button" className="boton boton-fantasma w-full" onClick={() => setAbierto(true)}>
        Agregar plato
      </button>
    )
  }

  return (
    <form onSubmit={enviar} className="rounded-[10px] border border-regla-2 p-3.5">
      <label className="mb-2.5 block">
        <span className="volanta mb-1.5 block text-tinta-3">Plato</span>
        <select
          value={productoId}
          onChange={(e) => setProductoId(Number(e.target.value))}
          className="w-full rounded-[10px] border border-regla-2 bg-superficie px-3 py-2 text-[14px] text-tinta outline-none focus:border-vino"
        >
          {carta.length === 0 && <option value="">Cargando la carta…</option>}
          {carta.map((p) => (
            <option key={p.id} value={p.id}>
              {p.categoria} · {p.nombre}
            </option>
          ))}
        </select>
      </label>

      <div className="mb-2.5 grid grid-cols-[80px_1fr] gap-2.5">
        <label className="block">
          <span className="volanta mb-1.5 block text-tinta-3">Cant.</span>
          <input
            type="number"
            min="1"
            max="50"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className="w-full rounded-[10px] border border-regla-2 bg-superficie px-3 py-2 text-[14px] text-tinta outline-none focus:border-vino"
          />
        </label>
        <label className="block">
          <span className="volanta mb-1.5 block text-tinta-3">Nota</span>
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Sin sal, para llevar…"
            className="w-full rounded-[10px] border border-regla-2 bg-superficie px-3 py-2 text-[14px] text-tinta outline-none placeholder:text-tinta-3 focus:border-vino"
          />
        </label>
      </div>

      {error && <p className="mb-2.5 text-[12.5px] text-vino">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          className="boton boton-fantasma boton-chico flex-1"
          onClick={() => setAbierto(false)}
        >
          Cancelar
        </button>
        <button type="submit" className="boton boton-vino boton-chico flex-1" disabled={enviando || !productoId}>
          {enviando ? 'Agregando…' : 'Agregar'}
        </button>
      </div>
    </form>
  )
}

function FormaCobro({
  pedidoId,
  puedeCobrar,
  onCobrado,
}: {
  pedidoId: number
  puedeCobrar: boolean
  onCobrado: () => void
}) {
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo')
  const [descuento, setDescuento] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoCobro | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function cobrar() {
    setError(null)
    setEnviando(true)
    try {
      const venta = await api.cobrarPedido(pedidoId, {
        metodoPago: metodo,
        ...(descuento.trim() === '' ? {} : { descuento: Number(descuento) }),
      })
      setResultado(venta)
    } catch (e) {
      setError(e instanceof ErrorApi ? (e.detalle ?? 'No pudimos cobrar.') : 'No pudimos cobrar.')
    } finally {
      setEnviando(false)
    }
  }

  if (resultado) {
    return (
      <div className="rounded-[10px] border border-verde/40 bg-verde-suave px-3.5 py-3 text-center">
        <p className="mb-1 text-[13px] text-verde">Cobrado</p>
        <p className="font-display text-[22px] font-semibold text-tinta">
          $ {resultado.total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
        </p>
        <button type="button" className="boton boton-fantasma boton-chico mt-3" onClick={onCobrado}>
          Volver a las mesas
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-2.5 flex gap-1.5">
        {METODOS_PAGO.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMetodo(m)}
            disabled={!puedeCobrar}
            className={['pastilla flex-1 justify-center', metodo === m ? 'pastilla-activa' : ''].join(' ')}
          >
            {NOMBRE_METODO_PAGO[m]}
          </button>
        ))}
      </div>

      <label className="mb-2.5 block">
        <span className="volanta mb-1.5 block text-tinta-3">Descuento (opcional)</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={descuento}
          onChange={(e) => setDescuento(e.target.value)}
          disabled={!puedeCobrar}
          placeholder="0"
          className="w-full rounded-[10px] border border-regla-2 bg-superficie px-3 py-2 text-[14px] text-tinta outline-none placeholder:text-tinta-3 focus:border-vino"
        />
      </label>

      {error && <p className="mb-2.5 text-[12.5px] text-vino">{error}</p>}

      <button
        type="button"
        className="boton boton-vino w-full"
        disabled={!puedeCobrar || enviando}
        onClick={cobrar}
      >
        {enviando ? 'Cobrando…' : 'Cobrar'}
      </button>
    </div>
  )
}
