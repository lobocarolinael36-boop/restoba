-- ════════════════════════════════════════════════════════════════════
-- PARA LA EXPOSICIÓN
--
-- La parte operativa de la Fase B: el pedido que toma el mozo, lo que
-- la cocina va cambiando de estado y la venta con la que se cobra.
--
-- El comensal NO pide desde la app en esta etapa. El flujo es siempre
-- con personal del local de por medio:
--
--   mozo    abre el pedido en una mesa y carga los platos
--   cocina  avanza cada plato: pendiente → en preparación → listo
--   mozo    marca entregado y, al final, cobra
--
-- Tres tablas, en el mismo criterio de normalización que ya usa el
-- resto de la base:
--
--   pedido        la mesa y quién lo abrió. Un estado de tres valores
--                 (abierto / cerrado / anulado): si la mesa sigue
--                 operando o ya se cerró. Nada más.
--   item_pedido   cada plato del pedido, con SU PROPIO estado. El
--                 avance de la cocina vive acá, no en `pedido`, porque
--                 dos platos de la misma mesa pueden estar en puntos
--                 distintos (uno listo, otro recién pedido).
--   venta         el cobro. Un pedido tiene como máximo una venta
--                 (por eso pedido_id es UNIQUE): cobrar es lo que
--                 cierra el pedido, no un movimiento aparte.
--
-- Qué NO se guarda, y por qué (3FN):
--
--   · restaurante_id: NO está en ninguna de las tres tablas. Se llega
--     a él por pedido → mesa → restaurante. Repetirlo sería una
--     dependencia transitiva, y el filtro multiempresa se hace con un
--     JOIN a `mesa`, igual que hace `reserva`.
--   · Totales y subtotales: NO hay una columna "total". El total de una
--     venta es SUM(cantidad × precio_unitario) de sus ítems (sin los
--     anulados) menos el descuento. Es la vista `v_venta_total`, ahí
--     abajo. Guardarlo aparte es la misma trampa que ya evitamos con
--     el saldo de puntos: un número que puede desincronizarse del dato
--     que lo explica.
--   · La fecha de cierre del pedido: NO es una columna de `pedido`. Es
--     `venta.creada_en`: cuando se cobra es cuando se cierra.
--
-- La única desnormalización deliberada de esta migración es
-- `item_pedido.precio_unitario`. Parece redundante con `producto.precio`,
-- pero no lo es: es un HECHO HISTÓRICO (cuánto costaba este plato en el
-- momento en que se pidió), no un dato derivable. Si el restaurante
-- sube el precio de la milanesa al día siguiente, el pedido de ayer
-- tiene que seguir mostrando lo que se cobró, no lo que cuesta hoy.
--
-- Responde a: Fase B — mozo y cocina. RF-12 (aislamiento multiempresa).
-- ════════════════════════════════════════════════════════════════════

-- ── El pedido de una mesa ─────────────────────────────────────

CREATE TABLE pedido (
  id             SERIAL      PRIMARY KEY,

  -- Sin CASCADE a propósito: una mesa con pedidos en su historial no se
  -- puede borrar. Si un día hace falta dar de baja una mesa, se desactiva
  -- (columna `estado` de `mesa`), no se elimina la fila.
  mesa_id        INTEGER     NOT NULL REFERENCES mesa(id),

  -- El mozo que lo abrió. Si esa cuenta se da de baja, el pedido no
  -- desaparece: solo se pierde el dato de quién lo atendió.
  usuario_id     INTEGER     REFERENCES usuario(id) ON DELETE SET NULL,

  estado         VARCHAR(16) NOT NULL DEFAULT 'abierto',
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT pedido_estado_valido CHECK (estado IN ('abierto', 'cerrado', 'anulado'))
);

CREATE INDEX idx_pedido_mesa_estado ON pedido (mesa_id, estado);

-- La regla de negocio «una mesa no puede tener dos pedidos abiertos a la
-- vez» no se controla a mano: este índice único parcial la hace cumplir
-- la propia base, incluso si dos mozos tocan el botón al mismo tiempo.
CREATE UNIQUE INDEX idx_pedido_mesa_abierta ON pedido (mesa_id) WHERE estado = 'abierto';

-- ── Cada plato del pedido ─────────────────────────────────────

CREATE TABLE item_pedido (
  id              SERIAL         PRIMARY KEY,
  pedido_id       INTEGER        NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,

  -- Sin CASCADE: un plato que ya se pidió alguna vez no se puede borrar
  -- de la carta sin romper el historial. Se desactiva (producto.activo).
  producto_id     INTEGER        NOT NULL REFERENCES producto(id),

  cantidad        SMALLINT       NOT NULL,

  -- Desnormalización deliberada: ver el comentario de arriba. Es el precio
  -- vigente en el momento del pedido, no el de `producto.precio` de hoy.
  precio_unitario NUMERIC(10, 2) NOT NULL,

  nota            VARCHAR(200),
  estado          VARCHAR(16)    NOT NULL DEFAULT 'pendiente',
  creado_en       TIMESTAMPTZ    NOT NULL DEFAULT now(),

  CONSTRAINT item_cantidad_valida CHECK (cantidad BETWEEN 1 AND 50),
  CONSTRAINT item_precio_valido CHECK (precio_unitario >= 0),
  CONSTRAINT item_estado_valido
    CHECK (estado IN ('pendiente', 'en_preparacion', 'listo', 'entregado', 'anulado'))
);

CREATE INDEX idx_item_pedido_pedido ON item_pedido (pedido_id);

-- El tablero de cocina lee por estado y ordena por antigüedad: este
-- índice es el que lo hace rápido sin tener que barrer toda la tabla.
CREATE INDEX idx_item_pedido_tablero ON item_pedido (estado, creado_en);

-- ── El cobro ────────────────────────────────────────────────────
-- Cobrar es lo que cierra el pedido, no un paso aparte: por eso
-- pedido_id es UNIQUE. Un pedido tiene cero o una venta, nunca dos.

CREATE TABLE venta (
  id           SERIAL         PRIMARY KEY,
  pedido_id    INTEGER        NOT NULL UNIQUE REFERENCES pedido(id),

  -- Quién cobró. Igual que en el pedido: si la cuenta se da de baja, la
  -- venta queda, solo se pierde de quién fue.
  usuario_id   INTEGER        REFERENCES usuario(id) ON DELETE SET NULL,

  metodo_pago  VARCHAR(16)    NOT NULL,

  -- Descuento en pesos, no en porcentaje: así no hay que repetir el
  -- cálculo cada vez que se muestra la venta.
  descuento    NUMERIC(10, 2) NOT NULL DEFAULT 0,
  creada_en    TIMESTAMPTZ    NOT NULL DEFAULT now(),

  CONSTRAINT venta_metodo_valido CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta')),
  CONSTRAINT venta_descuento_valido CHECK (descuento >= 0)
);

-- ── El total, como vista y no como columna ───────────────────
-- Nunca se guarda un total: se calcula. Los ítems anulados no suman
-- (se pidieron de más y se dieron de baja; no se cobran).

CREATE VIEW v_venta_total AS
SELECT
  v.id         AS venta_id,
  v.pedido_id,
  v.descuento,
  COALESCE(SUM(ip.cantidad * ip.precio_unitario) FILTER (WHERE ip.estado <> 'anulado'), 0)
    - v.descuento AS total
FROM venta v
LEFT JOIN item_pedido ip ON ip.pedido_id = v.pedido_id
GROUP BY v.id, v.pedido_id, v.descuento;
