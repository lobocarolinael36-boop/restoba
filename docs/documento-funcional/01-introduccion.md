[← Portada y equipo](00-portada.md) · [Índice](README.md) · [Etapa 1 — Análisis y factibilidad →](02-etapa-1-analisis.md)

---

# Introducción, resumen ejecutivo y alcance del producto (MVP)

**En esta página:** [Resumen ejecutivo](#resumen-ejecutivo) · [Etapas y fases del ciclo de vida](#etapas-y-fases-del-ciclo-de-vida)

Este documento funcional describe el proyecto **RestoBA** siguiendo el ciclo de vida del software. El ciclo se divide en **cuatro etapas**, y cada etapa en **fases**: cada fase produce entregables concretos y se cierra con una revisión de calidad (SQA) antes de pasar a la siguiente, como corresponde al modelo en cascada.

RestoBA es una aplicación web responsiva para **descubrir restaurantes**. El **comensal** busca locales cercanos por tipo de comida, ve el perfil y la carta, llega con «Cómo llegar», reserva, reseña, guarda favoritos y suma puntos. El **restaurante** paga una suscripción mensual para aparecer en la guía y mantiene su carta actualizada desde un panel propio. La plataforma es de acceso libre y sin cargo para el comensal final, financiándose en su totalidad mediante el modelo de suscripción B2B de los restaurantes.

> [!IMPORTANT]
> **Alcance del proyecto.** El proyecto llega hasta ahí: el comensal que va al restaurante y el restaurante que paga para aparecer. Todo lo que pasa dentro del local (mozos, cocina, pedidos, cobro e inventario) queda **fuera de alcance** y se describe al final, en el apartado «Fuera de alcance y trabajo futuro».

## Resumen ejecutivo

- **Qué es:** una aplicación web responsiva para descubrir restaurantes de la Ciudad de Buenos Aires por cercanía, tipo de comida y puntaje.
- **Para quién:** comensales, que la usan sin cargo, y restaurantes, que pagan una suscripción mensual para aparecer.
- **Qué resuelve:** el comensal encuentra en un solo lugar la carta, las reseñas de visitas reales, la reserva y el camino al local; el restaurante consigue visibilidad frente a la gente que está cerca.
- **Cómo está hecho:** React y Node.js con TypeScript, PostgreSQL con PostGIS para la búsqueda por cercanía y un mapa con Leaflet sobre teselas de Esri u OpenStreetMap, sin claves de API.
- **Estado:** Producto Mínimo Viable (versión v1.0.0) construido; los 12 requerimientos funcionales están implementados (RF-10 sin pantalla). Quedan por ejecutar las pruebas de código y de aceptación.
- **Equipo, plazo y costo:** 5 integrantes, 10 semanas, metodología en cascada con SQA y un costo operativo anual estimado de $735.174 ARS.

## Etapas y fases del ciclo de vida

| Etapa | Apartados | Entregables principales |
| --- | --- | --- |
| **1. Análisis y factibilidad** | • 1.1 Reconocimiento del problema y objetivos<br>• 1.2 Modelo de contexto<br>• 1.3 Relevamiento<br>• 1.4 Estudio de mercado<br>• 1.5 Factibilidades<br>• 1.6 O.L.A.<br>• 1.7 Propuesta, presupuesto y contrato<br>• 1.8 Planificación | Diagramas de contexto de nivel 0 y nivel 1, presentación del problema, investigación y carga de datos, estudio de competencia, FODA, factibilidades, O.L.A., propuesta, contrato, Gantt y curva de avance. |
| **2. Diseño y arquitectura** | • 2.1 Elección tecnológica<br>• 2.2 Base de datos<br>• 2.3 Especificación de requerimientos<br>• 2.4 Modelado UML<br>• 2.5 Arquitectura<br>• 2.6 Diseño de interfaz<br>• 2.7 Revisión SQA | Lenguaje, frameworks y herramientas; DER y modelo lógico; requerimientos especificados; casos de uso; diagrama de clases; diagramas de secuencia; arquitectura en tres capas y funcionamiento del mapa; maqueta; matriz de trazabilidad. |
| **3. Implementación, construcción y testing** | • 3.1 Preparación del entorno<br>• 3.2 Construcción por módulos<br>• 3.3 Testing de código<br>• 3.4 Puesta en producción | Repositorio y estructura del proyecto, módulos construidos, pruebas de caja blanca y de caja negra. |
| **4. Release, mantenimiento y cierre** | • 4.1 Release<br>• 4.2 Pruebas de aceptación<br>• 4.3 Plan de reversión<br>• 4.4 Manuales<br>• 4.5 Mantenimiento<br>• 4.6 Anexos<br>• 4.7 Cierre y trabajo futuro | Notas de versión, pruebas de aceptación con usuarios, plan de vuelta atrás, manuales de usuario y técnico, plan de mantenimiento, anexos y cierre. |

---

[← Portada y equipo](00-portada.md) · [Índice](README.md) · [Etapa 1 — Análisis y factibilidad →](02-etapa-1-analisis.md)
