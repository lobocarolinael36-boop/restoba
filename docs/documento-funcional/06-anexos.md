[← Etapa 4 — Release, reversión y mantenimiento](05-etapa-4-release.md) · [Índice](README.md)

---

# Anexo A — Desvíos respecto del documento de análisis

Registro honesto de en qué se aparta la implementación del análisis original y por qué, para que la documentación y el código no se contradigan.

| Tema | Análisis original | Implementación | Motivo |
| --- | --- | --- | --- |
| Nombre | Sin marca definida | RestoBA | Es el nombre con el que está redactado el marco legal. |
| Fidelización | Excluida | Incluida (puntos y cupones) | Ya está regulada en los Términos y Condiciones (art. 8) y es una diferencia frente a la competencia. |
| Pago de la suscripción | Mercado Pago | Transferencia bancaria, fuera de la plataforma | T&C art. 10: la plataforma no procesa pagos ni guarda datos bancarios. |
| Niveles del comensal | Un único actor | Visitante, registrado y verificado | T&C art. 5. |
| Favoritos | No figuraban | Incluidos | Distinguen al usuario registrado del visitante (T&C art. 5). |
| Ubicación | Latitud y longitud sueltas | Un dato geográfico con índice | Permite resolver la cercanía dentro de la base. |
| Mapas | Sin definir | Leaflet con Esri / OpenStreetMap | Sin clave de API ni tarjeta. |
| Lenguaje | JavaScript | TypeScript | Mismo ecosistema, con verificación de tipos. |
| Base de datos | Sin definir la instalación | PostgreSQL + PostGIS en Docker | La misma versión en todas las PCs del equipo. |
| Alcance | Buscador + gestión del salón, la cocina y el depósito | Buscador para el comensal + suscripción y carta del restaurante | Se acotó el proyecto (versión 5.0 del documento): la gestión interna del local queda fuera de alcance. |

# Anexo B — Glosario

| Término | Significado |
| --- | --- |
| API REST | Conjunto de direcciones del servidor a las que la web pide y envía datos. |
| Caja blanca / caja negra | Pruebas que miran el código por dentro / pruebas que solo miran entradas y salidas. |
| Cardinalidad | Cuántas tuplas de una entidad se relacionan, como mínimo y como máximo, con otra. |
| DER | Diagrama de entidad–relación: el modelo conceptual de la base de datos. |
| DSS | Diagrama de secuencia del sistema. |
| Migración | Archivo SQL numerado que cambia la estructura de la base; una vez aplicado no se edita. |
| Multiempresa | Un mismo sistema atiende a muchos restaurantes y cada uno ve solo sus datos. |
| O.L.A. | Objetivos, límites y alcances del proyecto. |
| PostGIS | Extensión de PostgreSQL para datos geográficos y búsquedas por distancia. |
| Suscripción | Pago mensual del restaurante para aparecer en la guía; se acredita a mano al confirmar la transferencia. |
| SQA | Aseguramiento de la calidad del software: revisiones al cierre de cada etapa. |
| Transacción | Grupo de operaciones que se guardan todas juntas o ninguna. |

---

[← Etapa 4 — Release, reversión y mantenimiento](05-etapa-4-release.md) · [Índice](README.md)
