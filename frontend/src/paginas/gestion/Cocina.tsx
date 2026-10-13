/* ════════════════════════════════════════════════════════════════════
   PARA LA EXPOSICIÓN

   El tablero de cocina: tres columnas, Pendiente / En preparación /
   Listo, pensadas para una pantalla grande en la cocina, no para un
   celular.

   Por qué no hay precios acá: la cocina no cobra ni necesita saber
   cuánto cuesta un plato para cocinarlo. Lo único que le importa es
   qué mesa, qué plato, con qué nota y hace cuánto está esperando — y
   eso es exactamente lo que devuelve GET /api/gestion/cocina.

   El tablero se actualiza solo cada 4 segundos (mismo mecanismo que
   Mesas.tsx) y se frena si la pestaña queda en segundo plano. No hay
   Socket.IO en esta etapa: queda para un paso aparte.

   Avanzar un plato de Pendiente a En preparación es el momento en que
   el servidor descuenta el stock de la receta (eso vive en el backend,
   en pedidos.ts); acá solo se dispara el cambio de estado y se muestra
   el aviso si algún ingrediente no alcanzó.

   Responde a: Fase B — cocina.
   ════════════════════════════════════════════════════════════════════ */

import { type EstadoItem, type ItemCocina } from '@restoba/compartido'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ErrorApi } from '../../lib/cliente'
import * as api from '../../lib/gestion'

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

const COLUMNAS: { estado: EstadoItem; titulo: string; siguiente: EstadoItem; accion: string }[] = [
  { estado: 'pendiente', titulo: 'Pendiente', siguiente: 'en_preparacion', accion: 'Arrancar' },
  { estado: 'en_preparacion', titulo: 'En preparación', siguiente: 'listo', accion: 'Marcar listo' },
  { estado: 'listo', titulo: 'Listo', siguiente: 'listo', accion: '' },
]

export function Cocina() {
  const [items, setItems] = useState<ItemCocina[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [moviendo, setMoviendo] = useState<number | null>(null)

  const recargar = useCallback(async (senal?: AbortSignal) => {
    const lista = await api.verTableroCocina(senal)
    setItems(lista)
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    recargar(ctrl.signal)
      .catch(() => {
        if (!ctrl.signal.aborted) setError('No pudimos leer el tablero.')
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setCargando(false)
      })
    return () => ctrl.abort()
  }, [recargar])

  useRefrescoPeriodico(() => {
    recargar().catch(() => undefined)
  }, 4000)

  async function avanzar(item: ItemCocina, estado: EstadoItem) {
    setError(null)
    setAviso(null)
    setMoviendo(item.id)
    try {
      const { avisosStock } = await api.cambiarEstadoItem(item.id, estado)
      if (avisosStock.length > 0) setAviso(avisosStock.join(' '))
      await recargar()
    } catch (e) {
      setError(
        e instanceof ErrorApi ? (e.detalle ?? 'No pudimos mover el plato.') : 'No pudimos mover el plato.',
      )
    } finally {
      setMoviendo(null)
    }
  }

  return (
    <div>
      <div className="mb-5">
        <p className="volanta mb-1 text-vino">Cocina</p>
        <h1 className="text-[28px] leading-tight">Tablero</h1>
      </div>

      {error && (
        <p className="mb-4 rounded-r-[10px] border-l-[3px] border-vino bg-vino-suave px-4 py-3 text-[13.5px] text-tinta-2">
          {error}
        </p>
      )}
      {aviso && (
        <p className="mb-4 rounded-r-[10px] border-l-[3px] border-ambar bg-ambar-suave px-4 py-3 text-[13px] leading-snug text-tinta-2">
          {aviso}
        </p>
      )}

      {cargando ? (
        <p className="py-16 text-center font-mono text-[13px] text-tinta-3">Leyendo el tablero…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNAS.map((col) => {
            const deLaColumna = items.filter((i) => i.estado === col.estado)
            return (
              <section key={col.estado} className="panel flex flex-col gap-3 px-4 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[15px] font-semibold text-tinta">{col.titulo}</h2>
                  <span className="font-mono text-[12px] text-tinta-3">{deLaColumna.length}</span>
                </div>

                {deLaColumna.length === 0 ? (
                  <p className="py-6 text-center text-[12.5px] text-tinta-3">Nada por acá.</p>
                ) : (
                  <ul className="flex flex-col gap-2.5">
                    {deLaColumna.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-[12px] border border-regla bg-superficie px-3.5 py-3"
                      >
                        <div className="mb-1 flex items-baseline justify-between gap-2">
                          <span className="font-display text-[16px] font-semibold text-tinta">
                            Mesa {item.mesaNumero}
                          </span>
                          <Antiguedad desde={item.creadoEn} />
                        </div>

                        <p className="mb-1 text-[14px] text-tinta">
                          <span className="font-mono text-[12px] text-tinta-3">{item.cantidad}×</span>{' '}
                          {item.producto}
                        </p>

                        {item.nota && (
                          <p className="mb-2 text-[12.5px] leading-snug text-tinta-2">{item.nota}</p>
                        )}

                        {col.accion && (
                          <button
                            type="button"
                            className="boton boton-vino boton-chico w-full"
                            disabled={moviendo === item.id}
                            onClick={() => avanzar(item, col.siguiente)}
                          >
                            {moviendo === item.id ? 'Moviendo…' : col.accion}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Hace cuánto está esperando el plato. Se recalcula sola, sin pedirle nada al servidor. */
function Antiguedad({ desde }: { desde: string }) {
  const [minutos, setMinutos] = useState(() => minutosDesde(desde))

  useEffect(() => {
    const id = setInterval(() => setMinutos(minutosDesde(desde)), 15_000)
    return () => clearInterval(id)
  }, [desde])

  return (
    <span className={['font-mono text-[11px] whitespace-nowrap', minutos >= 15 ? 'text-vino' : 'text-tinta-3'].join(' ')}>
      {minutos < 1 ? 'recién' : `${minutos} min`}
    </span>
  )
}

function minutosDesde(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000))
}
