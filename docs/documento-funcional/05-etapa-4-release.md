[← Etapa 3 — Implementación y producción](04-etapa-3-implementacion.md) · [Índice](README.md) · [Anexos (desvíos y glosario) →](06-anexos.md)

---

# Etapa 4 — Release, reversión y mantenimiento

**En esta página:** [Fase 1 — Release](#fase-1--release) · [Fase 2 — Testing de producto (pruebas de aceptación)](#fase-2--testing-de-producto-pruebas-de-aceptación) · [Fase 3 — Reversión (plan de vuelta atrás)](#fase-3--reversión-plan-de-vuelta-atrás) · [Fase 4 — Manual de usuario](#fase-4--manual-de-usuario) · [Fase 5 — Manual técnico y capacitación](#fase-5--manual-técnico-y-capacitación) · [Fase 6 — Mantenimiento](#fase-6--mantenimiento) · [Cierre del proyecto](#cierre-del-proyecto) · [Fuera de alcance y trabajo futuro](#fuera-de-alcance-y-trabajo-futuro)

Es la entrega del producto al usuario: se publica una versión, se prueba con usuarios reales, se prepara la forma de volver atrás si algo sale mal, se entregan los manuales y se planifica el mantenimiento.

## Fase 1 — Release

Las versiones se numeran como **mayor.menor.corrección** (por ejemplo, 1.0.0). La entrega final es la **versión 1.0.0**.

**Notas de la versión 1.0.0**

- Lado del comensal: buscador por tipo de comida y cercanía con mapa, perfil con carta y «Cómo llegar», cuentas con verificación, aceptación del marco legal, reservas, reseñas, favoritos, puntos y cupones.
- Restaurante: aparece en el buscador solo con la suscripción al día; ingreso del administrador al panel, modo lectura para locales impagos y gestión de la carta.
- Base de datos: migraciones 001 a 007 (las 008 y 009 existen en el código pero quedan fuera de alcance).
- Pendiente para próximas versiones: ver «Fuera de alcance y trabajo futuro».

**Lista de control antes de publicar**

- Verificación de tipos y compilación sin errores.
- Casos de prueba críticos aprobados y cero defectos críticos abiertos.
- Copia de seguridad de la base hecha y probada.
- Versión etiquetada en el repositorio (por ejemplo, v1.0.0).
- Manual de usuario actualizado.

## Fase 2 — Testing de producto (pruebas de aceptación)

A diferencia del testing de código, acá prueban **los usuarios reales** con el sistema completo, en su propio dispositivo y en su contexto de uso.

| Escenario | Rol | Criterio de aceptación | Resultado |
| --- | --- | --- | --- |
| Buscar pastas cerca y abrir un perfil | Comensal | En menos de un minuto llega al perfil de un local cercano |  |
| Crear cuenta, verificarla y reservar | Comensal | Termina la reserva sin ayuda |  |
| Dejar una reseña después de la visita y canjear puntos | Comensal | Publica la reseña y obtiene un cupón sin ayuda |  |
| Cambiar el precio de un plato | Administrador del restaurante | El precio nuevo se ve en el perfil público |  |
| Local con la suscripción vencida | Administración de RestoBA | El local deja de aparecer en el buscador |  |

| Dispositivo / navegador | Resultado |
| --- | --- |
| Android + Chrome |  |
| iPhone + Safari |  |
| Windows + Edge |  |
| Windows / Linux + Firefox |  |

**Acta de aceptación.** Se deja constancia de que el producto cumple los criterios acordados en el contrato.

|   |   |
| --- | --- |
| **Fecha** | **[Completar]** |
| **Versión aceptada** | 1.0.0 |
| **Observaciones** |  |
| **Firma del cliente** |  |
| **Firma del equipo** |  |

## Fase 3 — Reversión (plan de vuelta atrás)

La reversión es volver a la **última versión estable** cuando una publicación sale mal. Se planifica antes de publicar, no durante el problema.

**Cuándo se revierte:** un error que impide operar (no se puede buscar, reservar o iniciar sesión), pérdida o daño de datos, o una falla de seguridad.

1. Antes de cada release: copia completa de la base, etiqueta de la versión en el repositorio y la versión anterior compilada a mano.
2. Avisar a los restaurantes que habrá una interrupción breve.
3. Detener la API.
4. Volver a publicar la versión anterior desde su etiqueta.
5. Si la versión nueva había aplicado migraciones, restaurar la copia de la base: las migraciones solo avanzan, no tienen «deshacer».
6. Verificar con la lista de control (ingreso, búsqueda, perfil, reserva) y reabrir.
7. Registrar el incidente y corregirlo con una migración nueva; nunca se edita una migración ya aplicada.

**Tiempo objetivo de reversión:** **[Completar, por ejemplo 30 minutos]**.

## Fase 4 — Manual de usuario

### Comensal

**Buscar dónde comer**

1. Entrá a la página de inicio y elegí el tipo de comida.
2. Tocá «Cerca mío» y permití la ubicación. Si no la permitís, la búsqueda sigue ordenada por puntaje.
3. Mirá la lista y el mapa: cada marcador muestra el puntaje del local. Con «Ordenar por» elegís cercanía o puntaje, y podés filtrar por precio.
4. Tocá «Ver perfil» para ver la carta, los horarios y la dirección.
5. En el perfil, «Cómo llegar» abre Google Maps con el recorrido a pie; «Ubicar» lo muestra en el mapa de RestoBA.

**Crear tu cuenta y verificarla**

1. Tocá «Crear cuenta» y completá nombre, correo y contraseña (tenés que ser mayor de 18 años).
2. En «Tu cuenta», ingresá el código de 6 dígitos que te llega al correo.
3. Agregá tu teléfono y confirmalo con su código.
4. Leé y aceptá los tres documentos del marco legal. Desde ese momento sos **Usuario Verificado**: podés reservar, reseñar y sumar puntos.

**Reservar, reseñar y usar tus puntos**

1. En el perfil del restaurante tocá «Reservar mesa», elegí fecha, personas y un horario libre, y confirmá. La reserva aparece en «Mis reservas».
2. Después de la visita, en el perfil aparece «Contá cómo te fue»: elegí de 1 a 5 y escribí tu comentario. Tocá «Publicar reseña».
3. Sumás puntos por cada visita completada y por cada reseña publicada. En «Tu cuenta» → «Puntos y cupones» los canjeás por cupones.

### Administrador del restaurante

El administrador entra por **/gestion** con el correo y la contraseña que le entregó la administración de RestoBA al dar de alta el local. Si la suscripción no está al día, arriba aparece «Panel en modo lectura»: se puede mirar la carta, pero no guardar cambios.

- **Carta:** creá secciones y platos con precio, descripción y etiquetas (vegetariano, sin TACC, destacado). Si un plato hoy no hay, desactivalo. Los cambios se ven enseguida en el perfil público.
- **Suscripción:** se paga por transferencia bancaria, por fuera de la plataforma. Cuando la administración de RestoBA la acredita, el local vuelve a aparecer en el buscador.
- **Ficha, horarios y mesas:** los carga la administración de RestoBA al dar de alta el local. Para cambiarlos, pedíselo a la administración.

### Preguntas frecuentes

| Pregunta | Respuesta |
| --- | --- |
| No me aparecen restaurantes cerca | Revisá que hayas permitido la ubicación. El sistema amplía solo el radio hasta 10 km; si aun así no hay, probá otro tipo de comida. |
| No puedo reservar | Necesitás ser Usuario Verificado: correo y teléfono confirmados y el marco legal aceptado. |
| No puedo dejar una reseña | Las reseñas son solo de visitas reales: aparecen después de una reserva cumplida. |
| El panel no me deja cargar nada | La suscripción del local no está activa: el panel queda en modo lectura hasta regularizarla. |
| Mi local no aparece en el buscador | La suscripción está vencida o pendiente de acreditación. Cuando se acredita el pago, vuelve a aparecer. |

## Fase 5 — Manual técnico y capacitación

**Manual técnico (instalación).** Requiere Node.js 22, Docker Desktop y Git. Se clona el repositorio, se ejecuta `npm install` y luego `npm start`, que verifica los requisitos, crea la configuración, levanta la base, aplica las migraciones, carga los datos de ejemplo y deja la web en http://localhost:5173. La guía completa para llevarlo a otra computadora está en el repositorio (docs/como-mostrarlo.md).

| Capacitación | Destinatarios | Duración | Contenido |
| --- | --- | --- | --- |
| Panel del restaurante | Dueño o encargado | **[Completar]** | Ingreso al panel, carga de la carta, modo lectura y pago de la suscripción |

## Fase 6 — Mantenimiento

| Tipo | Qué es | Ejemplos en RestoBA |
| --- | --- | --- |
| **Correctivo** | Corregir errores encontrados en uso | Defectos reportados por comensales, restaurantes o SQA |
| **Adaptativo** | Adaptar el sistema a cambios del entorno | Cambio de proveedor de mapas, nuevas versiones de navegadores, cambios legales |
| **Perfectivo** | Agregar o mejorar funciones | Pantalla para acreditar suscripciones; que el restaurante edite su ficha, horarios y mesas, vea sus reservas y conteste reseñas desde el panel; estadísticas de visitas al perfil |
| **Preventivo** | Evitar problemas antes de que ocurran | Actualizar dependencias, revisar copias de seguridad, ampliar pruebas automatizadas, revisar los registros del servidor |

**Soporte:** canal de contacto **[Completar: correo o WhatsApp]** · horario **[Completar]** · tiempo de respuesta para errores críticos **[Completar]**.

**Copias de seguridad:** copia diaria de la base, conservación de **[Completar]** días y una prueba de restauración por mes.

## Cierre del proyecto

RestoBA cumple el objetivo planteado: una guía web donde el comensal descubre restaurantes cercanos, ve la carta, llega, reserva, reseña y suma puntos, y donde los restaurantes aparecen gracias a una suscripción mensual, con aislamiento entre locales y la seguridad declarada en su marco legal.

## Fuera de alcance y trabajo futuro

Durante el desarrollo se construyó también una parte de **gestión interna del restaurante**. Al acotar el proyecto se decidió dejarla afuera: el proyecto llega hasta el comensal que va al restaurante y el restaurante que paga para aparecer. Ese código **no se borró**, porque las migraciones aplicadas no se editan, pero no forma parte de este proyecto ni de sus pruebas.

| Parte | Qué hace | Dónde está en el código |
| --- | --- | --- |
| Mozos y cocina | Cuentas del personal con roles «mozo» y «cocina» | Rutas /gestion/empleados; rol en la tabla usuario |
| Pedidos y cobro | Abrir mesa, cargar platos, tablero de cocina, entregar y cobrar | Migración 009 (pedido, item_pedido, venta); pantallas Mesas y Cocina |
| Inventario y recetas | Stock por ingrediente, recetas y descuento automático al cocinar | Migración 008 (ingrediente, producto_ingrediente, movimiento_stock); pantallas Inventario y Recetas |

**Trabajo futuro dentro del alcance actual:** una pantalla para que la administración de RestoBA acredite las suscripciones, y que el restaurante pueda editar su ficha, horarios y mesas, ver sus reservas y contestar reseñas desde el panel. La base de datos ya tiene los campos necesarios (por ejemplo, `resena.respuesta`).

**Lecciones aprendidas:** **[Completar por el equipo]**

---

[← Etapa 3 — Implementación y producción](04-etapa-3-implementacion.md) · [Índice](README.md) · [Anexos (desvíos y glosario) →](06-anexos.md)
