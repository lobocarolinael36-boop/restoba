[← Etapa 2 — Diseño y arquitectura](03-etapa-2-diseno.md) · [Índice](README.md) · [Etapa 4 — Release, reversión y mantenimiento →](05-etapa-4-release.md)

---

# Etapa 3 — Implementación y producción

**En esta página:** [Fase 1 — Preparación del entorno](#fase-1--preparación-del-entorno) · [Fase 2 — Construcción por módulos](#fase-2--construcción-por-módulos) · [Fase 3 — Testing de código](#fase-3--testing-de-código) · [Fase 4 — Puesta en producción](#fase-4--puesta-en-producción) · [Revisión SQA de la etapa](#revisión-sqa-de-la-etapa)

En esta etapa se programa el sistema diseñado, módulo por módulo, y se prueba el código con técnicas de **caja blanca** y de **caja negra** antes de llevarlo a producción.

## Fase 1 — Preparación del entorno

Para trabajar hace falta **Node.js 22 o superior**, **Docker Desktop** y **Git**. No se instala PostgreSQL a mano: corre en un contenedor con la misma versión en todas las PCs del equipo.

| Carpeta | Contenido |
| --- | --- |
| backend/ | API REST: rutas (un archivo por familia de endpoints), consultas SQL, control de sesión y seguridad |
| frontend/ | Web responsiva: páginas, componentes, cliente de la API y sistema de diseño |
| compartido/ | Tipos y esquemas de validación que usan la web y la API |
| infra/ | Docker de la base y las migraciones SQL numeradas (las del alcance son 001 a 007) |
| legal/ | Los cuatro documentos del marco legal; la web los muestra desde acá |
| docs/ | Anexos, guía para mostrar el proyecto y la maqueta |
| scripts/ | Arranque en un solo comando y empaquetado sin internet |

| Comando | Qué hace |
| --- | --- |
| `npm install` | Instala las dependencias de los tres paquetes |
| `npm start` | Hace todo: verifica Node y Docker, crea el archivo de configuración, levanta la base, aplica migraciones, carga datos de ejemplo y deja corriendo la API y la web |
| `npm run dev` | Levanta solo la API y la web (la base ya tiene que estar arriba) |
| `npm run db:migrate` | Aplica las migraciones pendientes |
| `npm run db:seed` | Carga los datos de ejemplo (nunca en producción) |
| `npm run typecheck` · `npm run build` | Verifica los tipos y compila para producción |

> [!WARNING]
> **Configuración y secretos.** Las claves (firma de sesiones, cifrado del teléfono, conexión a la base) van solo en el archivo `.env`, que nunca se sube al repositorio. Sus parámetros están declarados en el Anexo Técnico de Seguridad.

## Fase 2 — Construcción por módulos

| Iteración | Módulo | Contenido | Estado |
| --- | --- | --- | --- |
| A0 | Fundaciones | Repositorio, paquetes, Docker con PostGIS, sistema de diseño | Terminado |
| A1 | Cuentas y marco legal | Registro, verificación de correo y teléfono, aceptación de documentos | Terminado |
| A2 | Buscador | Búsqueda por cercanía con PostGIS, mapa, perfil y «Cómo llegar» | Terminado |
| A4 | Reservas | Disponibilidad real por horario y mesa | Terminado |
| A3 | Comunidad | Reseñas ligadas a la visita, favoritos, puntos y cupones | Terminado |
| B1 | Panel del restaurante | Suscripción (modo lectura si no está al día) e ingreso del administrador para gestionar la carta | Terminado |

### Estándares de codificación

- TypeScript en todo el proyecto, con verificación de tipos obligatoria antes de dar algo por terminado.
- Toda entrada del usuario se valida con los esquemas compartidos; los errores se devuelven campo por campo.
- Las consultas SQL siempre llevan los valores como parámetros, nunca pegados al texto (evita la inyección de SQL).
- Una migración aplicada no se edita: se crea una nueva. El sistema guarda una huella de cada migración y se niega a arrancar si alguien la modifica.
- Las operaciones que tocan varias tablas se hacen en una transacción: o se guarda todo o no se guarda nada.
- El restaurante sale siempre de la sesión del usuario, nunca de la dirección ni de los datos que manda el navegador.

## Fase 3 — Testing de código

### Estrategia

| Técnica | Qué mira | Cuándo | Quién |
| --- | --- | --- | --- |
| **Caja blanca** | El código por dentro: que cada camino y cada rama se ejecute y dé lo esperado | Al terminar cada módulo | Quien lo programó + SQA |
| **Caja negra** | El sistema desde afuera: entradas y salidas, sin mirar el código | Al integrar cada módulo | SQA |
| Verificación automática | Tipos y compilación de los tres paquetes | Antes de cada entrega | Todo el equipo |

> [!NOTE]
> Las columnas «Obtenido» y «Estado» se completan al ejecutar cada caso. Un caso que falla se anota en el registro de defectos.

### Pruebas de caja blanca

**Caso 1 — Disponibilidad de una reserva.** Se recorre cada camino de la función que decide si un comensal puede reservar.

| ID | Camino | Entrada | Esperado | Obtenido | Estado |
| --- | --- | --- | --- | --- | --- |
| CB-01 | El local no atiende ese día | Fecha sin horario | «cerrado», sin reserva |  |  |
| CB-02 | Hora fuera de los turnos | Hora inexistente | «turno_no_disponible» |  |  |
| CB-03 | Grupo más grande que cualquier mesa | 12 personas, mesa máxima de 8 | «grupo_muy_grande» |  |  |
| CB-04 | Todas las mesas aptas ocupadas | Turno completo | «sin_mesa» |  |  |
| CB-05 | Reserva repetida | Mismo local y día | «duplicada» |  |  |
| CB-06 | Hay lugar | 4 personas, mesas de 2, 4 y 6 libres | Reserva confirmada en la mesa de 4 |  |  |

**Caso 2 — Visibilidad según la suscripción.** Se ejecuta cada rama del filtro del buscador y del control del panel.

| ID | Rama | Entrada | Esperado | Obtenido | Estado |
| --- | --- | --- | --- | --- | --- |
| CB-07 | Suscripción activa | Local «activa» | Aparece en el buscador |  |  |
| CB-08 | Suscripción vencida | Local «vencida» | No aparece en el buscador |  |  |
| CB-09 | Pendiente de acreditación | Local «pendiente_acreditacion» | No aparece en el buscador |  |  |
| CB-10 | Panel de un local vencido | Guardar un plato | Rechazo: panel en modo lectura |  |  |

**Caso 3 — Escalera de radios de la búsqueda.**

| ID | Camino | Esperado | Obtenido | Estado |
| --- | --- | --- | --- | --- |
| CB-17 | Hay resultados dentro de 1 km | Usa 1 km, no amplía |  |  |
| CB-18 | Nada a 1 km, sí a 3 km | Usa 3 km y avisa que amplió |  |  |
| CB-19 | Nada a 3 km, sí a 10 km | Usa 10 km y avisa que amplió |  |  |
| CB-20 | Sin ubicación | Sin radio; ordena por puntaje |  |  |

### Pruebas de caja negra

Se usan **partición de equivalencias** (una entrada representativa de cada grupo válido e inválido) y **valores límite** (justo en el borde de lo permitido).

| ID | Clase de entrada | Entrada | Esperado | Obtenido | Estado |
| --- | --- | --- | --- | --- | --- |
| CN-01 | Puntuación de reseña · límite inferior inválido | 0 | Rechazo «Elegí de 1 a 5» |  |  |
| CN-02 | Puntuación · límites válidos | 1 y 5 | Se publica la reseña |  |  |
| CN-03 | Puntuación · límite superior inválido | 6 | Rechazo «Elegí de 1 a 5» |  |  |
| CN-04 | Reservar sin cuenta verificada | Comensal registrado sin verificar | Rechazo que explica qué falta |  |  |
| CN-05 | Reserva en un día sin atención | Fecha en que el local cierra | «Ese día el local no atiende» |  |  |
| CN-06 | Reseña sin visita | Comensal sin reserva cumplida | No aparece la opción de reseñar |  |  |
| CN-07 | Canje con puntos insuficientes | Saldo menor al costo del cupón | Rechazo con el saldo disponible |  |  |
| CN-08 | Ubicación denegada | Buscar «pastas» | Resultados por puntaje y aviso |  |  |
| CN-09 | Búsqueda sin acentos | «bodegon» | Aparecen los bodegones |  |  |
| CN-10 | Local con suscripción vencida | Buscar «Fantasma» | No aparece |  |  |
| CN-11 | Precio de un plato inválido | Precio negativo | Rechazo con mensaje del campo |  |  |
| CN-12 | Dato de otro restaurante | Editar un plato ajeno | «No encontrado» |  |  |

### Verificación automática ya realizada

En octubre de 2026 se ejecutaron la **verificación de tipos** y la **compilación de producción** de los tres paquetes (web, API y compartido): ambas terminaron **sin errores**. La ejecución de los casos de prueba con la base levantada queda a cargo de SQA: **[Completar fecha y resultado]**.

### Registro de defectos

| ID | Fecha | Descripción | Severidad | Responsable | Estado |
| --- | --- | --- | --- | --- | --- |
| D-01 |  |  |  |  |  |
| D-02 |  |  |  |  |  |
| D-03 |  |  |  |  |  |

## Fase 4 — Puesta en producción

1. Compilar la web y la API para producción (`npm run build`).
2. Crear el servidor con Docker y la base en la versión fija del proyecto.
3. Cargar el archivo de configuración con claves nuevas y largas (nunca las de desarrollo).
4. Aplicar las migraciones (`npm run db:migrate`). Los datos de ejemplo no se cargan: el script se niega a correr en producción.
5. Configurar el dominio y el certificado HTTPS.
6. Dar de alta los restaurantes reales (ficha, horarios y mesas) con la cuenta de su administrador, y acreditar su primera suscripción.
7. Programar la copia diaria de la base.

## Revisión SQA de la etapa

- Todos los requerimientos críticos están implementados (ver matriz de trazabilidad).
- Casos de caja blanca y caja negra ejecutados: **[Completar: cantidad aprobados / total]**.
- Defectos críticos abiertos: **[Completar]** (meta: ninguno).

---

[← Etapa 2 — Diseño y arquitectura](03-etapa-2-diseno.md) · [Índice](README.md) · [Etapa 4 — Release, reversión y mantenimiento →](05-etapa-4-release.md)
