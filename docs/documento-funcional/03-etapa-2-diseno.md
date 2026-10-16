[← Etapa 1 — Análisis y factibilidad](02-etapa-1-analisis.md) · [Índice](README.md) · [Etapa 3 — Implementación, construcción y testing →](04-etapa-3-implementacion.md)

---

# Etapa 2 — Diseño y arquitectura

**En esta página:** [2.1 Elección tecnológica](#21-elección-tecnológica) · [2.2 Diseño de la base de datos](#22-diseño-de-la-base-de-datos) · [2.3 Especificación de requerimientos](#23-especificación-de-requerimientos) · [2.4 Modelado UML](#24-modelado-uml) · [2.5 Arquitectura del sistema](#25-arquitectura-del-sistema) · [2.6 Diseño de interfaz](#26-diseño-de-interfaz) · [2.7 Revisión SQA de la etapa (matriz de trazabilidad)](#27-revisión-sqa-de-la-etapa-matriz-de-trazabilidad)

Con el problema analizado, en esta etapa se decide **con qué** se construye y **cómo** se organiza: la tecnología, la base de datos, los diagramas UML y la arquitectura.

## 2.1 Elección tecnológica

| Decisión | Elegido | Alternativas evaluadas | Por qué |
| --- | --- | --- | --- |
| Lenguaje de programación | TypeScript (JavaScript con tipos) | JavaScript puro, Python, PHP | Un solo lenguaje en la web y en el servidor; los tipos detectan errores antes de ejecutar. |
| Frontend (framework) | React 19 + Vite + Tailwind CSS | Angular, Vue | Componentes reutilizables y diseño responsivo rápido. |
| Backend (framework) | Node.js 22 + Express | Django, Laravel | Mismo lenguaje que el frontend; liviano para una API REST. |
| Base de datos | PostgreSQL 16 + PostGIS 3.4 | MySQL, MongoDB | PostGIS resuelve la cercanía dentro de la base con índices geográficos. |
| Validación compartida | Zod, en el paquete «compartido» | Validar a mano en cada lado | La web y la API usan exactamente las mismas reglas. |
| Mapas | Leaflet + Esri / OpenStreetMap | Google Maps, CARTO | Sin clave de API ni tarjeta de crédito. |
| Software (IDE) | Visual Studio Code | WebStorm | Gratuito y con soporte completo de TypeScript. |
| Otras herramientas | Git y GitHub, Docker, DBeaver, Postman, Figma, draw.io | — | Gratuitas y conocidas por el equipo. |
| Asistente de IA | Asistente de programación con IA (Claude) | — | Acelera tareas repetitivas; todo lo que propone se revisa y se valida con compilación y pruebas. |

## 2.2 Diseño de la base de datos

### Reconocimiento del enunciado

El diseño de la base empieza por **analizar el enunciado del problema**. Se escribe en un párrafo qué hace el sistema y se marcan las palabras: los **sustantivos** se vuelven entidades (y luego clases u objetos), los **adjetivos** y características se vuelven atributos, y los **verbos** se vuelven relaciones (y luego métodos).

> [!NOTE]
> **Enunciado.** El **comensal** busca **restaurantes** cercanos según el **tipo de cocina** y los ve ordenados por distancia y puntaje. Cada restaurante tiene una **carta** organizada en **categorías** con **platos** que tienen precio, y **mesas** con una capacidad. Un comensal verificado **reserva** una mesa para una fecha y una hora y, después de la visita, deja una **reseña** con una puntuación. Por reservar y reseñar **acumula puntos** que **canjea** por **cupones**. El restaurante **paga** una **suscripción** mensual para **aparecer** en el buscador, y su **administrador** **mantiene** la carta desde un panel.

| Palabra del enunciado | Tipo | Se convierte en |
| --- | --- | --- |
| comensal, restaurante, tipo de cocina, categoría, plato, mesa, reserva, reseña, cupón, suscripción | Sustantivos | Entidades (tablas) y clases |
| administrador | Sustantivo (persona del local) | Entidad **usuario** (con atributo **rol**, que en este alcance es siempre «admin») |
| cercano, puntaje, precio, capacidad, fecha, hora, verificado, estado | Adjetivos y características | Atributos (ubicación, calificación, precio, capacidad…) |
| busca, tiene, reserva, deja, acumula, canjea, paga, aparece, mantiene | Verbos | Relaciones del DER y métodos de las clases |

### Notación de los DER

Los DER usan la notación de Chen (**rectángulo** = entidad, **rombo** = relación, **óvalo** = atributo) con la cardinalidad en **pies de gallo**. Como estaba planificado, el modelo está dividido en dos diagramas: el **DER del comensal** y el **DER del restaurante**. Así cada uno se puede leer completo y una actualización afecta a uno solo. Cuando una entidad aparece en los dos, se dibuja como rectángulo punteado con la referencia «ver DER del …».

![Símbolos, cardinalidad y convenciones de los DER.](img/der_leyenda.png)

*Figura 5. Símbolos, cardinalidad y convenciones de los DER.*

### DER del comensal

Identidad, visitas, reseñas y fidelización: comensal, sesión, aceptación legal, favorito, reserva, reseña, cupón y movimiento de puntos.

![DER del comensal.](img/der_comensal.png)

*Figura 6. DER del comensal.*

### DER del restaurante

Ficha, carta, mesas, administrador y suscripción: restaurante, tipo de cocina, horario, categoría, producto, mesa, usuario (administrador), sesión y suscripción. El inventario se quitó del diagrama porque quedó fuera de alcance.

![DER del restaurante.](img/der_restaurante.png)

*Figura 7. DER del restaurante.*

### Cardinalidades

La cardinalidad se lee **en las dos direcciones** y tiene un **mínimo** y un **máximo**:

- **Mínimo:** una tupla de la entidad A se puede relacionar **como mínimo** con tantas tuplas de la entidad B (0 si es opcional, 1 si es obligatoria).
- **Máximo:** una tupla de la entidad A se puede relacionar **como máximo** con tantas tuplas de la entidad B (1 o N).

En los DER el símbolo de pies de gallo **se lee junto a la entidad a la que se refiere**: dice cuántas instancias de esa entidad corresponden a una instancia de la otra. Por ejemplo, en comensal — hace — reserva, junto a reserva está «cero o muchos» (un comensal hace cero o muchas reservas) y junto a comensal está «uno y solo uno» (cada reserva la hace un único comensal).

| Relación | Lectura de A hacia B | Lectura de B hacia A | Tipo |
| --- | --- | --- | --- |
| Comensal hace Reserva | Un comensal hace mín. 0 y máx. N reservas | Una reserva la hace mín. 1 y máx. 1 comensal | 1:N |
| Reserva se asigna a Mesa | Una reserva se asigna a mín. 0 y máx. 1 mesa | Una mesa recibe mín. 0 y máx. N reservas | N:1 |
| Comensal escribe Reseña | Un comensal escribe mín. 0 y máx. N reseñas | Una reseña es de mín. 0 y máx. 1 comensal (si se da de baja, la reseña queda) | 1:N |
| Comensal favorito Restaurante | Un comensal guarda mín. 0 y máx. N restaurantes | Un restaurante es guardado por mín. 0 y máx. N comensales | N:M |
| Comensal obtiene Cupón | Un comensal obtiene mín. 0 y máx. N cupones | Un cupón es de mín. 1 y máx. 1 comensal | 1:N |
| Restaurante dispone de Mesa | Un restaurante dispone de mín. 0 y máx. N mesas | Una mesa pertenece a mín. 1 y máx. 1 restaurante | 1:N |
| Restaurante ofrece Tipo de cocina | Un restaurante ofrece mín. 0 y máx. N tipos | Un tipo es ofrecido por mín. 0 y máx. N restaurantes | N:M |
| Categoría agrupa Producto | Una categoría agrupa mín. 0 y máx. N platos | Un plato está en mín. 1 y máx. 1 categoría | 1:N |
| Restaurante contrata Suscripción | Un restaurante contrata mín. 0 y máx. N suscripciones (una por período) | Una suscripción es de mín. 1 y máx. 1 restaurante | 1:N |
| Restaurante emplea Usuario | Un restaurante tiene mín. 0 y máx. N usuarios (en este alcance, su administrador) | Un usuario es de mín. 1 y máx. 1 restaurante | 1:N |

### Modelo lógico (relacional)

Cada entidad se convierte en una tabla; las relaciones 1:N se resuelven con una clave foránea del lado N, y las N:M con una tabla intermedia. El alcance del proyecto usa **18 tablas**, creadas por las migraciones 002 a 007.

| Tabla | Clave primaria | Claves foráneas | Atributos principales |
| --- | --- | --- | --- |
| restaurante | id | — | nombre, descripcion, plan, estado, direccion, barrio, ciudad, ubicacion (geography), rango_precio, telefono, calificacion_prom, cantidad_resenas |
| tipo_cocina | id | — | nombre, slug |
| restaurante_tipo_cocina | (restaurante_id, tipo_cocina_id) | restaurante, tipo_cocina | — |
| horario | id | restaurante_id | dia_semana, abre, cierra |
| categoria | id | restaurante_id | nombre, orden |
| producto | id | restaurante_id, categoria_id | nombre, descripcion, precio, imagen, activo, vegetariano, sin_tacc, destacado, orden |
| comensal | id | — | nombre, email, password_hash, email_verificado, telefono_cifrado, telefono_verificado, creado_en, baja_en |
| sesion | id (UUID) | comensal_id | expira_en, revocada_en, ip, user_agent |
| aceptacion_legal | id | usuario_id → comensal | documento, version, hash_texto, aceptado_en, revocado_en |
| mesa | id | restaurante_id | numero, capacidad, estado |
| reserva | id | restaurante_id, comensal_id, mesa_id | fecha, hora, cantidad_personas, estado, notas, cancelada_en |
| resena | id | restaurante_id, comensal_id, reserva_id | autor, puntuacion, comentario, respuesta, creada_en |
| favorito | (comensal_id, restaurante_id) | comensal, restaurante | creado_en |
| cupon | id | comensal_id | codigo, titulo, puntos_gastados, vence_en, usado_en |
| movimiento_puntos | id | comensal_id, restaurante_id, reserva_id, resena_id, cupon_id | puntos, motivo, detalle, creado_en |
| usuario | id | restaurante_id | nombre, email, password_hash, rol, activo |
| sesion_staff | id (UUID) | usuario_id | expira_en, revocada_en, ip, user_agent |
| suscripcion | id | restaurante_id | plan, periodo_desde, periodo_hasta, monto, estado, comprobante, acreditada_en |

> [!NOTE]
> En el código existen además seis tablas que quedaron **fuera de alcance**: **ingrediente**, **producto_ingrediente** y **movimiento_stock** (migración 008, inventario) y **pedido**, **item_pedido** y **venta** (migración 009, salón y cocina). No se borran porque las migraciones aplicadas no se editan, pero no forman parte de este proyecto.

### Diccionario de datos (tablas centrales del alcance)

- **SMALLINT**: Número entero chico (hasta 32.767). Ahorra espacio en disco.
- **SERIAL**: Número entero que se suma solo (1, 2, 3...) para códigos de ID.
- **NUMERIC(2,1)**: Decimal exacto de dos dígitos en total y uno después de la coma (ej: 4.5). Evita errores de redondeo.
- **UUID**: Código larguísimo y aleatorio de letras y números. Es imposible de duplicar o adivinar (máxima seguridad para sesiones).
- **TIMESTAMPTZ**: Fecha y hora exacta con milisegundos y zona horaria incluida.
- **geography(Point, 4326)**: Coordenadas de GPS (Latitud y Longitud) guardadas con el estándar mundial para mapas.
- **Índice GIST**: Un turbo para la base de datos que le permite buscar y calcular distancias en el mapa en milisegundos.
- **CASCADE**: Borrado automático en cadena. Si eliminás un restaurante, se borran al toque todas sus reservas y suscripciones.
- **SET NULL**: Desconexión limpia. Si borrás una mesa, la reserva no se borra; solo el campo de la mesa se pone en blanco (NULL).
- **NOT NULL**: Campo obligatorio. El dato no puede quedar vacío (ej: no hay reserva sin un comensal_id).

**restaurante**

| Campo | Tipo | Restricción | Descripción |
| --- | --- | --- | --- |
| id | SERIAL | PK | Identificador del local |
| nombre | VARCHAR(120) | NOT NULL | Nombre comercial |
| estado | VARCHAR(24) | activa · pendiente_acreditacion · vencida · cancelada | Estado de la suscripción: solo «activa» aparece en el buscador |
| direccion / barrio / ciudad | VARCHAR | dirección obligatoria | Ubicación escrita |
| ubicacion | geography(Point, 4326) | NOT NULL, índice GIST | Punto en el mapa para buscar por cercanía |
| rango_precio | SMALLINT | entre 1 y 3 | Se muestra como $, $$ o $$$ |
| calificacion_prom | NUMERIC(2,1) | NULL o entre 1 y 5 | Promedio de reseñas |

**suscripcion**

| Campo | Tipo | Restricción | Descripción |
| --- | --- | --- | --- |
| id | INT | PK | Identificador del período |
| restaurante_id | INTEGER | NOT NULL, FK → restaurante, CASCADE | Local que paga |
| plan | VARCHAR | NOT NULL | Plan contratado |
| periodo_desde / periodo_hasta | DATE | NOT NULL | Período que cubre el pago |
| monto | NUMERIC | NOT NULL | Importe transferido |
| estado | VARCHAR(24) | por defecto 'pendiente_acreditacion' | Pasa a acreditada cuando la administración de RestoBA confirma la transferencia |
| comprobante | VARCHAR | opcional | Referencia del comprobante de transferencia |
| acreditada_en | TIMESTAMPTZ | opcional | Momento de la acreditación manual |

**reserva**

| Campo | Tipo | Restricción | Descripción |
| --- | --- | --- | --- |
| id | SERIAL | PK | Identificador de la reserva |
| restaurante_id | INTEGER | NOT NULL, FK → restaurante, CASCADE | Local reservado |
| comensal_id | INTEGER | NOT NULL, FK → comensal, CASCADE | Quién reserva (debe estar verificado) |
| mesa_id | INTEGER | FK → mesa, SET NULL | Mesa asignada: la más chica donde entra el grupo |
| fecha / hora | DATE / TIME | NOT NULL | Turno reservado |
| cantidad_personas | SMALLINT | NOT NULL | Tamaño del grupo |
| estado | VARCHAR(16) | por defecto 'confirmada' | confirmada, cancelada o cumplida |

### Normalización (1FN, 2FN y 3FN)

Se verificó cada tabla de las migraciones contra las tres formas normales; los DER reflejan la base tal como está, sin tablas inventadas.

**Criterio aplicado**

| Forma normal | Condición | Cómo se verificó |
| --- | --- | --- |
| 1FN | Valores atómicos, sin grupos repetidos, toda tabla con clave primaria. | Ningún campo guarda listas: los horarios van en **horario** (una fila por día) y los tipos de cocina en la tabla intermedia. Todas las tablas tienen PK. |
| 2FN | 1FN + ningún atributo depende de solo una parte de una clave compuesta. | Solo 2 tablas del alcance tienen PK compuesta: **favorito** y **restaurante_tipo_cocina**; ninguna tiene atributos que dependan de una parte de la clave. Cumple. |
| 3FN | 2FN + ningún atributo no clave depende de otro atributo no clave (sin dependencias transitivas). | Se revisó columna por columna; el resultado está abajo. |

**Cómo se resolvieron las relaciones muchos a muchos**

| Relación N:M | Tabla intermedia | PK | Atributos propios |
| --- | --- | --- | --- |
| comensal ↔ restaurante (favoritos) | favorito | (comensal_id, restaurante_id) | creado_en |
| restaurante ↔ tipo_cocina | restaurante_tipo_cocina | (restaurante_id, tipo_cocina_id) | — |

**Dependencias evitadas con tablas separadas.** Los datos del restaurante no se repiten en cada producto o mesa: **categoria**, **producto**, **mesa**, **horario**, **usuario** y **suscripcion** guardan solo la clave `restaurante_id`. Lo mismo con el comensal: **sesion**, **cupon**, **reserva**, **resena** y **movimiento_puntos** guardan `comensal_id` y no copian nombre ni email. Los tipos de cocina son una tabla aparte (**tipo_cocina**), no un texto repetido.

## 2.3 Especificación de requerimientos

### Requerimientos funcionales

Los requerimientos funcionales describen **qué hace el sistema** e interactúan con la base de datos. Se clasifican en **críticos** (sin ellos el sistema no cumple su objetivo) y **no críticos**.

| ID | Requerimiento | Actor | Prioridad | Estado |
| --- | --- | --- | --- | --- |
| RF-01 | El sistema debe proveer gestión de control de accesos basado en perfiles lógicos, con tres estados de verificación para comensales (anónimo, registrado y verificado) y credenciales de administración restringidas para los operadores de los locales gastronómicos. | Comensal, administrador | Crítico | Implementado |
| RF-02 | Buscar restaurantes por tipo de comida | Comensal | Crítico | Implementado |
| RF-03 | Mostrar restaurantes cercanos en el mapa | Comensal | Crítico | Implementado |
| RF-04 | Ordenar y filtrar por cercanía, puntaje y precio | Comensal | No crítico | Implementado |
| RF-05 | Ver perfil del restaurante: carta, horarios, «Cómo llegar» | Comensal | Crítico | Implementado |
| RF-06 | Dejar reseñas ligadas a una visita | Comensal | No crítico | Implementado |
| RF-07 | Reservar mesa con disponibilidad real | Comensal | Crítico | Implementado |
| RF-08 | Gestionar la carta del restaurante | Administrador | Crítico | Implementado |
| RF-09 | Mostrar en el buscador solo los locales con la suscripción al día | Sistema | Crítico | Implementado |
| RF-10 | El sistema debe permitir la actualización del estado de suscripción del restaurante (activa, vencida, pendiente_acreditacion), reflejando el cambio de manera inmediata en la visibilidad del local en el motor de búsqueda. | Administración de RestoBA | Crítico | Implementado sin pantalla: en esta fase el estado se actualiza directamente en la base |
| RF-11 | Aislar los datos de cada restaurante | Sistema | Crítico | Implementado |
| RF-12 | El sistema debe procesar transacciones automáticas de acumulación de puntos por eventos completados (reserva cumplida, reseña publicada) y gestionar su débito al emitir cupones de fidelización. Además, debe permitir al comensal registrado guardar restaurantes favoritos. | Comensal | No crítico | Implementado |

### Especificación de requerimientos funcionales

Cada requerimiento funcional se especifica con su actor, lo que entra al sistema, los **pasos que el sistema ejecuta** para cumplirlo, lo que devuelve, las reglas que controla y con qué se vincula (caso de uso, tablas, endpoint, pantalla y caso de prueba). Los pasos describen el funcionamiento real del sistema construido.

**RF-01 — Control de acceso por perfiles y estados**

|   |   |
| --- | --- |
| **Actores** | Comensal (anónimo, registrado o verificado) y administrador del restaurante. |
| **Entradas** | Registro: nombre, correo, contraseña (mínimo 10 caracteres) y declaración de mayoría de edad. Verificación: código de 6 dígitos del correo, teléfono y su código. Marco legal: aceptación de los tres documentos. Administrador: correo y contraseña entregados por la administración de RestoBA. |
| **Proceso** | 1. La web envía el registro a `POST /api/auth/registro`; la API lo valida con el esquema compartido y rechaza un correo ya usado.<br>2. Guarda la contraseña con bcrypt (costo 12) y genera un código de verificación de 6 dígitos que vence a los 15 minutos; el código se guarda como hash.<br>3. Abre la sesión: un token de acceso JWT de 15 minutos y un token de renovación en una cookie httpOnly de 30 días.<br>4. El comensal verifica el correo y el teléfono con sus códigos; el teléfono se guarda cifrado con AES-256-GCM.<br>5. Acepta los tres documentos legales (`POST /api/legal/aceptacion`): la API compara la versión y la huella del texto con el documento vigente y guarda la constancia.<br>6. Con correo, teléfono y marco legal completos, el comensal pasa a nivel **verificado**: el control `requiereVerificado` le habilita reservar, reseñar y canjear.<br>7. El administrador ingresa por `POST /api/gestion/login`, con una sesión separada de la del comensal. |
| **Salidas** | Sesión iniciada y nivel del comensal (anónimo sin sesión, registrado o verificado). |
| **Reglas y validaciones** | • Credenciales incorrectas: 401 con el mismo mensaje, sin revelar si el correo existe.<br>• Función de verificado sin estarlo: 403 que explica qué falta.<br>• Documento legal que cambió de versión mientras se leía: 409 y se pide leerlo de nuevo. |
| **Vinculado con** | CU-04, CU-05, CU-10 · tablas comensal, sesion, aceptacion_legal, usuario, sesion_staff · pantallas Registro, Ingresar, Cuenta y /gestion · prueba CN-04. |

**RF-02 — Buscar restaurantes por tipo de comida**

|   |   |
| --- | --- |
| **Actor** | Comensal, en cualquier nivel (no hace falta cuenta). |
| **Entradas** | Tipo de cocina y/o un texto libre (nombre, barrio o tipo de comida); opcionalmente la ubicación. |
| **Proceso** | 1. La web llama a `GET /api/restaurantes?cocina=…&q=…`.<br>2. La API valida los parámetros: texto de 1 a 120 caracteres y hasta 50 resultados (20 por defecto).<br>3. La consulta toma solo los locales con la suscripción en estado «activa».<br>4. Compara el texto sin acentos ni mayúsculas (función `normalizar`) contra el nombre, el barrio y los tipos de cocina del local.<br>5. Devuelve los resultados con el orden pedido (ver RF-04). |
| **Salidas** | Lista de restaurantes con nombre, tipos de cocina, rango de precio, puntaje, cantidad de reseñas y, si hay ubicación, distancia. |
| **Reglas y validaciones** | • Parámetros inválidos: 400 con el detalle de cada campo.<br>• Sin coincidencias: lista vacía y la web sugiere otro tipo de comida. |
| **Vinculado con** | CU-01 · tablas restaurante, tipo_cocina, restaurante_tipo_cocina · pantallas Inicio y Resultados · prueba CN-09. |

**RF-03 — Mostrar restaurantes cercanos en el mapa**

|   |   |
| --- | --- |
| **Actores** | Comensal · API de geolocalización del navegador · API de mapas (Esri / OpenStreetMap). |
| **Entradas** | Latitud y longitud del dispositivo, solo si el comensal da permiso. |
| **Proceso** | 1. Al tocar «Cerca mío», el navegador pide permiso de ubicación.<br>2. La web envía `lat` y `lng` a `GET /api/restaurantes`.<br>3. Si no se fijó un radio, la API prueba en escalera 1 km, 3 km y 10 km con `ST_DWithin` hasta encontrar resultados, y marca si tuvo que ampliar.<br>4. Calcula la distancia real de cada local con `ST_Distance`.<br>5. La web dibuja los locales como marcadores en el mapa (Leaflet) sobre las teselas del proveedor de mapas. |
| **Salidas** | Resultados con su distancia, el radio aplicado, el aviso de «se amplió el radio» y el mapa con los marcadores. |
| **Reglas y validaciones** | • La ubicación no se guarda en ningún lado.<br>• Sin permiso de ubicación, la búsqueda sigue funcionando ordenada por puntaje (RF-04). |
| **Vinculado con** | CU-02 · columna restaurante.ubicacion (geography con índice GIST) · pantalla Resultados · pruebas CB-11 a CB-14. |

**RF-04 — Ordenar y filtrar resultados**

|   |   |
| --- | --- |
| **Actor** | Comensal. |
| **Entradas** | Orden (cercanía, puntaje o mixto), rangos de precio (1 a 3) y puntaje mínimo (1 a 5). |
| **Proceso** | 1. La web agrega los criterios a la búsqueda.<br>2. La API los valida.<br>3. Si se pidió cercanía y no hay ubicación, cambia el orden a puntaje y lo informa en la respuesta.<br>4. Filtra por rango de precio y puntaje mínimo y ordena los resultados. |
| **Salidas** | Resultados ordenados y el orden que realmente se aplicó. |
| **Reglas y validaciones** | • Un local sin reseñas no rompe el orden por puntaje. |
| **Vinculado con** | CU-01 · pantalla Resultados · prueba CN-08. |

**RF-05 — Ver el perfil del restaurante**

|   |   |
| --- | --- |
| **Actores** | Comensal · Google Maps. |
| **Entradas** | Identificador del restaurante y, opcionalmente, la ubicación del comensal. |
| **Proceso** | 1. La web llama a `GET /api/restaurantes/:id`.<br>2. La API busca el local solo si su suscripción está «activa».<br>3. Trae los horarios por día, la carta (secciones y platos en su orden), la distancia si hay ubicación y si el comensal lo tiene en favoritos.<br>4. El botón «Cómo llegar» abre Google Maps con las coordenadas del local y el recorrido a pie. |
| **Salidas** | Perfil con datos del local, horarios, carta y acceso a «Cómo llegar». |
| **Reglas y validaciones** | • Local inexistente o con la suscripción no activa: 404. |
| **Vinculado con** | CU-03 · tablas restaurante, horario, categoria, producto · pantallas Perfil y Carta · prueba de aceptación de la Etapa 4. |

**RF-06 — Dejar una reseña ligada a una visita**

|   |   |
| --- | --- |
| **Actor** | Comensal verificado. |
| **Entradas** | La visita (reserva) a reseñar, una puntuación de 1 a 5 y un comentario de hasta 1500 caracteres. |
| **Proceso** | 1. La web pide `GET /api/resenas/pendientes`: las visitas ya pasadas que todavía no tienen reseña.<br>2. El comensal elige la visita, puntúa y comenta; la web envía `POST /api/resenas`.<br>3. En una transacción, la API comprueba que la reserva sea del comensal, que ya haya pasado y que no tenga reseña.<br>4. Guarda la reseña, marca la reserva como cumplida, acredita 120 puntos y recalcula el puntaje promedio del local. |
| **Salidas** | Reseña publicada y puntos ganados. |
| **Reglas y validaciones** | • Sin visita registrada: 409, solo se reseñan visitas reales.<br>• Visita ya reseñada: 409, se puede editar con `PUT /api/resenas/:id`.<br>• Puntuación fuera de 1 a 5: rechazo. |
| **Vinculado con** | CU-07 · tablas resena, reserva, movimiento_puntos, restaurante · pantalla Perfil · pruebas CN-01 a CN-03 y CN-06. |

**RF-07 — Reservar mesa con disponibilidad real**

|   |   |
| --- | --- |
| **Actor** | Comensal verificado. |
| **Entradas** | Fecha, cantidad de personas y horario elegido. |
| **Proceso** | 1. La web pide `GET /api/restaurantes/:id/disponibilidad?fecha&personas`.<br>2. La API cruza los horarios del día, las mesas con capacidad suficiente y las reservas existentes (cada reserva ocupa su mesa dos horas) y devuelve los turnos libres.<br>3. El comensal elige un turno y la web envía `POST /api/reservas`.<br>4. En una transacción, la API bloquea las mesas aptas (`FOR UPDATE`), elige la más chica libre donde entra el grupo y guarda la reserva. |
| **Salidas** | Reserva confirmada, visible en «Mis reservas». |
| **Reglas y validaciones** | • Local cerrado ese día, turno inexistente, sin mesa libre, grupo más grande que cualquier mesa o reserva duplicada: 409 con el motivo.<br>• La reserva se puede cancelar hasta 2 horas antes. |
| **Vinculado con** | CU-06 · tablas reserva, mesa, horario · pantallas Perfil y Cuenta · pruebas CB-01 a CB-06, CN-04 y CN-05. |

**RF-08 — Gestionar la carta del restaurante**

|   |   |
| --- | --- |
| **Actor** | Administrador del restaurante. |
| **Entradas** | Secciones (nombre y orden) y platos (nombre, descripción, precio y etiquetas vegetariano, sin TACC y destacado). |
| **Proceso** | 1. El panel carga la carta con `GET /api/gestion/carta`.<br>2. Crear, editar o borrar secciones y platos usa `POST`, `PUT` y `DELETE` sobre `/api/gestion/carta/…`.<br>3. Antes de guardar, la API exige rol administrador y suscripción al día.<br>4. El restaurante se toma siempre de la sesión del administrador.<br>5. El cambio se ve enseguida en el perfil público. |
| **Salidas** | Carta actualizada. |
| **Reglas y validaciones** | • Borrar una sección que todavía tiene platos: 409, primero hay que moverlos.<br>• Sección o plato de otro local: 404.<br>• Suscripción no activa: 403, el panel queda en modo lectura. |
| **Vinculado con** | CU-11 · tablas categoria, producto · pantalla /gestion/carta · pruebas CB-10 y CN-11. |

**RF-09 — Mostrar solo los locales con la suscripción al día**

|   |   |
| --- | --- |
| **Actor** | Sistema. |
| **Entradas** | El estado de suscripción de cada restaurante. |
| **Proceso** | 1. Todas las consultas públicas (buscador, perfil y tipos de cocina) filtran por `restaurante.estado = 'activa'`.<br>2. Un local vencido o pendiente de acreditación simplemente no aparece. |
| **Salidas** | Resultados formados solo por locales al día. |
| **Reglas y validaciones** | • La regla vive en la consulta SQL, no en la pantalla: no hay forma de verlo desde la web. |
| **Vinculado con** | CU-01 · columna restaurante.estado · pruebas CB-07 a CB-09 y CN-10. |

**RF-10 — Actualizar el estado de suscripción**

|   |   |
| --- | --- |
| **Actor** | Administración de RestoBA. |
| **Entradas** | La transferencia del restaurante: período, monto y comprobante. |
| **Proceso** | 1. La administración verifica la transferencia en el banco.<br>2. Registra el período en `suscripcion` (desde, hasta, monto, comprobante y fecha de acreditación).<br>3. Actualiza `restaurante.estado` a activa, vencida o pendiente_acreditacion.<br>4. Como cada búsqueda consulta el estado en el momento, el cambio se refleja en la búsqueda siguiente. |
| **Salidas** | El local aparece o deja de aparecer en el buscador. |
| **Reglas y validaciones** | • En esta fase no hay pantalla: el estado se actualiza directamente en la base de datos. |
| **Vinculado con** | CU-12 · tablas suscripcion, restaurante · pruebas CB-07 a CB-09. |

**RF-11 — Aislar los datos de cada restaurante**

|   |   |
| --- | --- |
| **Actor** | Sistema. |
| **Entradas** | La sesión del administrador. |
| **Proceso** | 1. El administrador inicia sesión y su token identifica a su usuario.<br>2. El control `requiereStaff` carga el usuario y el restaurante al que pertenece.<br>3. Cada consulta del panel filtra por ese restaurante; nunca se toma de la dirección ni de los datos que manda el navegador.<br>4. Si se pide un dato de otro local, la respuesta es «no encontrado». |
| **Salidas** | Cada local ve y modifica solo sus propios datos. |
| **Reglas y validaciones** | • No hay forma de cambiar de local cambiando un número en la dirección. |
| **Vinculado con** | CU-10, CU-11 · columna restaurante_id en categoria y producto · prueba CN-12. |

**RF-12 — Puntos, cupones y favoritos**

|   |   |
| --- | --- |
| **Actor** | Comensal (registrado para favoritos, verificado para canjear). |
| **Entradas** | Visitas cumplidas, reseñas publicadas, el cupón elegido y el restaurante a guardar. |
| **Proceso** | 1. **Visitas:** al consultar sus puntos, el sistema acredita 50 puntos por cada visita ya pasada que todavía no se acreditó (una sola vez por visita).<br>2. **Reseñas:** al publicar una reseña se acreditan 120 puntos (RF-06).<br>3. **Canje:** con `POST /api/puntos/canjear`, en una transacción, la API comprueba que el saldo alcance, crea el cupón con su código y vencimiento a 3 meses y descuenta los puntos. Catálogo: café de cortesía (400), postre (800) y entrada para compartir (1500).<br>4. **Favoritos:** `POST /api/favoritos/:id` agrega el local o lo quita si ya estaba. |
| **Salidas** | Saldo de puntos, cupones vigentes y lista de favoritos. |
| **Reglas y validaciones** | • Saldo insuficiente: rechazo con el saldo disponible.<br>• Dos canjes simultáneos no pueden gastar los mismos puntos. |
| **Vinculado con** | CU-08, CU-09 · tablas favorito, movimiento_puntos, cupon · pantalla Cuenta · prueba CN-07. |

### Requerimientos no funcionales

Describen **cómo** tiene que comportarse el sistema y orientan el diseño y el desarrollo.

| ID | Atributo de calidad (ISO/IEC 25010) | Especificación técnica y criterio de aceptación cuantitativo | Método de verificación (SQA) |
| --- | --- | --- | --- |
| RNF-01 | Usabilidad e interfaz | La interfaz web debe ser responsiva con diseño mobile-first. El 100 % de los flujos críticos (búsqueda y reserva) debe poder completarse en un dispositivo móvil con un máximo de 4 interacciones. | Pruebas de usabilidad en dispositivos (UAT) y tasa de éxito de tareas. |
| RNF-02 | Eficiencia de rendimiento | Las consultas de proximidad espacial con PostGIS (`ST_DWithin`) deben devolver los resultados ordenados en JSON en menos de 1,5 segundos bajo una carga sostenida de 50 usuarios concurrentes. | Pruebas de carga con herramientas de inyección de tráfico (por ejemplo, Apache JMeter o Artillery). |
| RNF-03 | Disponibilidad del servicio | El entorno de producción en la nube debe garantizar una disponibilidad (uptime) del 99,5 % anual, excluyendo las ventanas programadas de mantenimiento preventivo. | Monitoreo automatizado del servidor mediante registros de disponibilidad. |
| RNF-04 | Seguridad de la información | El sistema debe cifrar los números telefónicos en reposo con AES-256-GCM. Las contraseñas deben procesarse con bcrypt con costo 12. El backend debe mitigar la inyección de código mediante consultas parametrizadas obligatorias. | Análisis estático de vulnerabilidades en el código y pruebas de caja blanca. |
| RNF-05 | Compatibilidad y portabilidad | La web debe mantener paridad funcional completa en las últimas tres versiones estables de los motores de renderizado más usados: Chromium (Chrome y Edge), WebKit (Safari) y Gecko (Firefox). | Pruebas de compatibilidad en cada navegador (tabla de dispositivos del apartado 4.2). |
| RNF-06 | Escalabilidad y diseño | El backend debe operar como una arquitectura sin estado (stateless) estructurada en capas independientes. Los cambios en el esquema de datos deben ser trazables de forma incremental, únicamente mediante archivos de migración SQL inmutables. | Auditoría técnica del código y revisión cruzada de la estructura de la base de datos (peer review). |

### Especificación de requerimientos no funcionales

Para cada requerimiento no funcional se indica **cómo lo cumple el sistema**, dónde está resuelto y en qué estado se encuentra.

| ID | Cómo lo cumple el sistema | Dónde está resuelto | Estado |
| --- | --- | --- | --- |
| **RNF-01** | 1. Diseño mobile-first con Tailwind: las pantallas se piensan primero para celular.<br>2. Búsqueda: elegir el tipo de comida, tocar «Cerca mío» y abrir el perfil.<br>3. Reserva: «Reservar mesa», fecha y personas, turno y confirmar. | frontend/ (páginas y componentes) | Implementado; el conteo de interacciones se verifica en las pruebas de aceptación. |
| **RNF-02** | 1. La columna de ubicación tiene un índice geográfico GIST.<br>2. `ST_DWithin` usa ese índice para descartar los locales lejanos antes de medir distancias.<br>3. Los resultados se limitan a 50 como máximo y las consultas usan un pool de conexiones. | backend/src/db/restaurantes.ts e índice de la migración 002 | Implementado; falta la prueba de carga con 50 usuarios. |
| **RNF-03** | 1. La base corre en Docker con reinicio automático (`restart: unless-stopped`) y un control de salud (`pg_isready`).<br>2. Copia diaria de la base con prueba de restauración mensual (Etapa 4). | infra/docker-compose.yml y plan de mantenimiento | A medir en producción. |
| **RNF-04** | 1. Contraseñas con bcrypt costo 12 y códigos de verificación guardados como hash.<br>2. Teléfono cifrado con AES-256-GCM.<br>3. Token de acceso de 15 minutos y renovación en cookie httpOnly.<br>4. Todas las consultas SQL con parámetros. | backend/src/seguridad.ts, rutas y consultas | Implementado. |
| **RNF-05** | 1. React y Vite compilan a JavaScript estándar, sin complementos del navegador.<br>2. Se prueba en Chrome, Edge, Safari y Firefox (tabla de dispositivos del apartado 4.2). | frontend/ | Implementado; pruebas por navegador pendientes. |
| **RNF-06** | 1. La API no guarda estado entre pedidos: la sesión viaja en el token.<br>2. Capas separadas: rutas, consultas a la base y esquemas compartidos.<br>3. Migraciones numeradas con huella SHA-256: el sistema se niega a arrancar si una migración aplicada se modifica. | backend/, compartido/ e infra/db/migrations/ | Implementado. |

## 2.4 Modelado UML

### Diagrama de casos de uso

El diagrama muestra los 12 casos de uso del sistema y los actores que participan: el **comensal** (con sus tres niveles), el **administrador del restaurante**, que mantiene la carta, y la **administración de RestoBA**, que acredita la suscripción con la que el local aparece en la guía.

Además, siguiendo el criterio de la cátedra, **toda API externa que pide o envía información al sistema también es un actor**. A la derecha del diagrama están los tres actores secundarios (sistemas externos) que participan en los casos de uso del comensal. La base de datos no es un actor: es parte del sistema.

| Actor secundario | Qué intercambia con el sistema | Casos de uso |
| --- | --- | --- |
| API de geolocalización del navegador | Entrega la ubicación del comensal, solo si él da permiso | CU-01, CU-02 |
| API de mapas (Esri / OpenStreetMap) | Recibe el pedido de teselas y devuelve las imágenes del mapa | CU-02 |
| Google Maps | Recibe las coordenadas del restaurante y muestra el recorrido a pie («Cómo llegar») | CU-03 |

![Diagrama de casos de uso.](img/03_casos_de_uso.png)

*Figura 8. Diagrama de casos de uso.*

### Tabla de casos de uso

| CU | Nombre | Actor | Propósito |
| --- | --- | --- | --- |
| CU-01 | Buscar restaurantes por tipo de comida | Comensal · API de geolocalización | Encontrar dónde comer según lo que quiere |
| CU-02 | Ver restaurantes cercanos en el mapa | Comensal · API de geolocalización · API de mapas | Ver qué tiene cerca y a qué distancia |
| CU-03 | Ver perfil, carta y «Cómo llegar» | Comensal · Google Maps | Decidir y llegar al local |
| CU-04 | Registrarse y verificar la cuenta | Comensal | Pasar de visitante a usuario verificado |
| CU-05 | Aceptar el marco legal | Comensal | Dejar constancia de la aceptación de los documentos |
| CU-06 | Reservar una mesa | Comensal verificado | Asegurarse un lugar |
| CU-07 | Dejar una reseña de la visita | Comensal verificado | Calificar un local donde estuvo |
| CU-08 | Guardar restaurantes favoritos | Comensal registrado | Volver a encontrarlos rápido |
| CU-09 | Canjear puntos por un cupón | Comensal verificado | Obtener un beneficio |
| CU-10 | Ingresar al panel del restaurante | Administrador del restaurante | Acceder al panel de su local |
| CU-11 | Gestionar la carta | Administrador del restaurante | Mantener secciones, platos y precios |
| CU-12 | Acreditar la suscripción del local | Administración de RestoBA | Confirmar el pago para que el local aparezca en el buscador |

### Casos de uso detallados

Para los casos de uso más importantes se detalla el propósito, el flujo principal y las **excepciones** (lo que puede salir mal y cómo responde el sistema).

**CU-01 — Buscar restaurantes por tipo de comida**

|   |   |
| --- | --- |
| **Actores** | Comensal (principal; cualquier nivel, incluso visitante) · API de geolocalización del navegador (secundario) |
| **Propósito** | Encontrar restaurantes de un tipo de comida, ordenados por cercanía y puntaje. |
| **Precondición** | Ninguna. |
| **Flujo principal** | 1. El comensal elige el tipo de comida y toca «Cerca mío».<br>2. El navegador pide permiso de ubicación y el comensal lo da.<br>3. El sistema busca dentro de 1 km; si no hay resultados, amplía a 3 km y luego a 10 km, y avisa que amplió.<br>4. Muestra la lista y el mapa con el puntaje de cada local. |
| **Excepciones** | • Ubicación denegada: la búsqueda sigue ordenada por puntaje y se avisa.<br>• Sin resultados aun a 10 km: mensaje y sugerencia de otro tipo de comida.<br>• Local con la suscripción vencida: no aparece. |
| **Postcondición** | El comensal ve los resultados; la ubicación no se guarda. |

**CU-06 — Reservar una mesa**

|   |   |
| --- | --- |
| **Actor** | Comensal verificado |
| **Propósito** | Asegurarse un lugar para una fecha, una hora y una cantidad de personas. |
| **Precondición** | Correo y teléfono verificados y los tres documentos legales aceptados. |
| **Flujo principal** | 1. En el perfil toca «Reservar mesa».<br>2. Elige fecha y cantidad de personas.<br>3. El sistema muestra los horarios libres según los horarios del local y sus mesas.<br>4. Elige un horario y confirma.<br>5. El sistema asigna la mesa más chica donde entra el grupo, dentro de una transacción, y confirma. |
| **Excepciones** | • No está verificado: se lo lleva a verificar la cuenta.<br>• El local no atiende ese día.<br>• No quedan turnos para ese grupo.<br>• El grupo es más grande que cualquier mesa.<br>• Otra persona tomó el último turno en el mismo momento: «turno no disponible».<br>• Ya tiene una reserva igual: reserva duplicada. |
| **Postcondición** | La reserva queda confirmada y aparece en «Mis reservas». |

**CU-11 — Gestionar la carta**

|   |   |
| --- | --- |
| **Actor** | Administrador del restaurante |
| **Propósito** | Mantener actualizadas las secciones, los platos y los precios que ve el comensal. |
| **Precondición** | Sesión de administrador iniciada en /gestion. |
| **Flujo principal** | 1. Entra a «Carta».<br>2. Crea o edita una sección (nombre y orden).<br>3. Crea o edita un plato: nombre, descripción, precio y etiquetas (vegetariano, sin TACC, destacado).<br>4. Guarda: el cambio se ve enseguida en el perfil público del local. |
| **Excepciones** | • Suscripción no activa: el panel queda en modo lectura y no deja guardar.<br>• Datos inválidos (por ejemplo, precio negativo): se rechaza con el mensaje del campo.<br>• La sección o el plato es de otro local: «no encontrado». |
| **Postcondición** | La carta pública muestra los datos nuevos. |

**CU-12 — Acreditar la suscripción del local**

|   |   |
| --- | --- |
| **Actor** | Administración de RestoBA |
| **Propósito** | Confirmar que el restaurante pagó, para que aparezca en el buscador. |
| **Precondición** | El restaurante transfirió el importe del período por fuera de la plataforma (T&C, art. 10). |
| **Flujo principal** | 1. La administración verifica la transferencia en el banco.<br>2. Registra el período pagado con su comprobante y la fecha de acreditación.<br>3. El estado del local pasa a «activa» y empieza a aparecer en las búsquedas. |
| **Excepciones** | • Período vencido sin pago: el local pasa a «vencida» y deja de aparecer en el buscador; su panel queda en modo lectura. |
| **Postcondición** | El local aparece en el buscador hasta el fin del período pagado. |
| **Nota** | En el prototipo no hay pantalla para este caso de uso: la acreditación se registra directamente en la base de datos. |

### Diagrama de clases

Un **objeto** representa un elemento, unidad o entidad individual e identificable; una **clase** es el molde de esos objetos. El diagrama de clases sale mayormente de la base de datos (el «molde» de los objetos): cada clase tiene su nombre, sus **atributos** (privados, con «−») y sus **métodos** (públicos, con «+»). Las líneas son asociaciones con su **multiplicidad** en cada extremo; el rombo negro es **composición** (la parte no existe sin el todo: una mesa no existe sin su restaurante). El diagrama del restaurante muestra solo las clases del alcance.

Se presenta en dos partes para que se pueda leer: el lado del comensal y el lado del restaurante.

![Diagrama de clases — lado del comensal.](img/05a_clases_comensal.png)

*Figura 9. Diagrama de clases — lado del comensal.*

![Diagrama de clases — lado del restaurante.](img/05b_clases_restaurante.png)

*Figura 10. Diagrama de clases — lado del restaurante.*

### Diagramas de secuencia (DSS)

El diagrama de secuencia muestra, en orden temporal, los **mensajes** que intercambian un **actor** y las **instancias** del sistema para cumplir un caso de uso. Las flechas llenas son llamadas y las punteadas son respuestas. Los recuadros **loop** (repetición) y **alt** (alternativa) marcan partes que se repiten o que ocurren solo si se cumple una condición.

**1. Los Componentes (Parte Superior)**

- **Personita (Comensal):** El actor o usuario que inicia la acción en la aplicación.
- **Cajas azules superiores (:Web RestoBA, :API REST, etc.):** Los objetos o módulos del sistema que participan en el proceso.
- **Líneas de puntos verticales:** La **línea de vida** de cada componente. El tiempo corre de arriba hacia abajo.

**2. Las Flechas y Bloques (Interacción)**

- **Flechas continuas con texto:** **Mensajes o llamadas** (acciones, peticiones HTTP o funciones) que un componente le manda a otro.
- **Flechas de puntos con texto:** **Respuestas** que devuelven los datos solicitados.
- **Recuadro marrón (alt [ubicación denegada]):** Un **bloque de alternativa** (un if/else en código). Muestra el camino alternativo que toma el sistema si el usuario no da permiso de GPS.

![DSS de CU-01 y CU-02: buscar restaurantes cercanos.](img/06b_secuencia_busqueda.png)

*Figura 11. DSS de CU-01 y CU-02: buscar restaurantes cercanos.*

![DSS de CU-06: el comensal reserva una mesa.](img/06a_secuencia_reserva.png)

*Figura 12. DSS de CU-06: el comensal reserva una mesa.*

## 2.5 Arquitectura del sistema

Arquitectura **cliente–servidor en tres capas**, con una única API REST que atiende tanto al comensal como al administrador del restaurante.

- **Presentación:** una sola web en React. El lado del comensal y el panel del restaurante (/gestion) son dos «mundos» con sesiones separadas.
- **Lógica:** API REST en Node.js + Express. Cada ruta valida los datos con los mismos esquemas que usa la web y aplica los controles de sesión, nivel del comensal y suscripción del local.
- **Datos:** PostgreSQL + PostGIS en Docker. Todo el acceso pasa por un único pool de conexiones y con consultas parametrizadas.
- **Multiempresa:** el restaurante de cada consulta sale siempre del usuario que inició sesión, nunca de lo que manda el navegador. Por eso un local no puede ver datos de otro cambiando un número en la dirección.

![Arquitectura en tres capas](img/07_arquitectura.png)

*Figura 13. Arquitectura en tres capas*

### Cómo funciona el mapa (Leaflet con Esri y OpenStreetMap)

El mapa del buscador está hecho con **Leaflet**, una librería libre de JavaScript que dibuja mapas interactivos en el navegador (en React se usa a través de React Leaflet). Leaflet no trae el dibujo del mundo: se lo pide a un **proveedor de teselas**.

**Qué es una tesela.** El mapa del mundo se divide en cuadrados de 256 × 256 píxeles, uno por cada zona y nivel de zoom. En el zoom 0 el mundo entero es una sola tesela; en cada nivel siguiente cada cuadrado se divide en cuatro. Cada tesela es una imagen con una dirección del tipo `…/{z}/{y}/{x}` (zoom, fila y columna). Cuando el comensal mueve el mapa o hace zoom, Leaflet calcula qué teselas se ven en pantalla y descarga solo esas.

**Proveedores de teselas**

| Proveedor | Cómo se ve | Zoom máximo | Condiciones |
| --- | --- | --- | --- |
| **Esri — World Light Gray Canvas** (por defecto) | Mapa gris claro en dos capas: el dibujo de calles y manzanas abajo, y las etiquetas (nombres de calles y barrios) encima. Combina con el sistema de diseño. | 16 | Sin clave de API ni tarjeta. |
| **OpenStreetMap** (respaldo) | El mapa clásico de OpenStreetMap, más colorido. | 19 | Sin clave de API; muestra la atribución «© OpenStreetMap» y está sujeto a su política de uso justo. |

Se pasa de un proveedor al otro cambiando una sola variable de configuración (`VITE_MAPA_PROVEEDOR=osm`), sin tocar el código. Se descartaron Google Maps, porque exige tarjeta de crédito, y CARTO, que desde 2025 marca sus teselas gratuitas con «API KEY REQUIRED».

**Paso a paso: qué pasa cuando el comensal busca**

1. El comensal busca y la API devuelve la lista de restaurantes con la latitud y la longitud de cada uno. La **distancia la calcula PostGIS en la base de datos**, no el mapa.
2. React Leaflet crea el mapa centrado en la ubicación del comensal o, si no la compartió, en el Obelisco (-34,6037; -58,3816), con zoom 14.
3. Leaflet pide al proveedor solo las teselas visibles. El navegador las descarga **directo de Esri u OpenStreetMap**, sin pasar por el servidor de RestoBA.
4. Sobre las teselas dibuja los marcadores: una burbuja con el puntaje y el rango de precio de cada local, y un punto para la posición del comensal.
5. Encuadra solo: ajusta el zoom para que entren todos los resultados (hasta zoom 16) o centra el local seleccionado.
6. Al elegir un local dibuja una línea punteada entre el comensal y el restaurante, y abre una tarjeta con la foto, los datos y el enlace al perfil.
7. «Ubicar» lleva al mapa centrado en ese local; «Cómo llegar» abre Google Maps con el recorrido a pie, por fuera de la aplicación.

> [!NOTE]
> Sin conexión a internet el mapa se ve gris, porque no puede descargar las teselas, pero los resultados y las distancias siguen funcionando: los calcula la base de datos. El proveedor de mapas solo recibe los pedidos de teselas de la zona que se está mirando; RestoBA no le envía datos del comensal.

## 2.6 Diseño de interfaz

Antes de programar se armó una **maqueta navegable** de las pantallas del comensal. La interfaz final respeta un sistema de diseño propio.

| Ruta | Pantalla | Usuario |
| --- | --- | --- |
| / | Inicio con buscador | Comensal |
| /buscar | Resultados: lista y mapa | Comensal |
| /restaurante/:id | Perfil del restaurante | Comensal |
| /restaurante/:id/carta | Carta con fotos | Comensal |
| /registro · /ingresar | Crear cuenta e ingresar | Comensal |
| /cuenta | Tu cuenta: verificación, reservas, puntos y cupones | Comensal |
| /gestion | Ingreso al panel | Administrador del restaurante |
| /gestion/carta | Carta del local | Administrador del restaurante |

**Sistema de diseño:** papel cálido #FCFBF9, tinta #1B1C21 y tres acentos: vino #7C2239, verde #1C6350 y ámbar #815214. Tipografías: Petrona para títulos, Archivo para la interfaz e IBM Plex Mono para datos y precios. Separación con líneas finas, sin sombras ni degradés.

## 2.7 Revisión SQA de la etapa (matriz de trazabilidad)

La matriz de trazabilidad comprueba que cada requerimiento tiene su caso de uso, sus tablas, su pantalla, su endpoint y el caso de prueba que lo verifica en la Etapa 3. Si una fila queda incompleta, falta algo en el diseño o en las pruebas.

| RF | Casos de uso | Tablas | Pantalla | Endpoint | Caso de prueba SQA |
| --- | --- | --- | --- | --- | --- |
| RF-02, RF-03, RF-04 | CU-01, CU-02 | restaurante, tipo_cocina | Inicio, Resultados | GET /api/restaurantes | CB-11 a CB-14, CN-08, CN-09 |
| RF-05 | CU-03 | restaurante, horario, categoria, producto | Perfil, Carta | GET /api/restaurantes/:id | Prueba de aceptación: buscar y abrir un perfil (Etapa 4) |
| RF-01 | CU-04, CU-05, CU-10 | comensal, sesion, aceptacion_legal, usuario, sesion_staff | Registro, Cuenta, /gestion | /api/auth/…, /api/gestion/login | CN-04 |
| RF-07 | CU-06 | reserva, mesa | Perfil | POST /api/reservas | CB-01 a CB-06, CN-04, CN-05 |
| RF-06 | CU-07 | resena | Perfil | POST /api/resenas | CN-01 a CN-03, CN-06 |
| RF-12 | CU-08, CU-09 | favorito, movimiento_puntos, cupon | Cuenta | /api/favoritos, /api/puntos | CN-07 |
| RF-08 | CU-11 | categoria, producto | Carta (panel) | /api/gestion/carta | CB-10, CN-11 |
| RF-09, RF-10 | CU-01, CU-12 | restaurante.estado, suscripcion | Resultados | GET /api/restaurantes (filtra por estado «activa») | CB-07 a CB-09, CN-10 |
| RF-11 | CU-10, CU-11 | restaurante_id en categoria y producto | Carta (panel) | Control de sesión del administrador | CN-12 |

---

[← Etapa 1 — Análisis y factibilidad](02-etapa-1-analisis.md) · [Índice](README.md) · [Etapa 3 — Implementación, construcción y testing →](04-etapa-3-implementacion.md)
