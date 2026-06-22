# DERR — Plan de acción: Apify MCP Connectors

> Documento de decisión y plan accionable, derivado de la evaluación del anuncio
> de Apify "Spring updates / MCP connectors".
> Fecha: 2026-06-22 · Responsable: Ernesto (Albert Rodríguez Robelt)

---

## 0. Resumen ejecutivo (TL;DR)

- **Para el núcleo clínico de DERR (MS, Dental, Q-Engine): NO integrar Apify.**
  Maneja PHI bajo custodia (KIA, GNC), regido por las Mandela Rules y la
  legislación de Aruba. Enviar datos de pacientes a la nube de Apify es un
  problema legal y de privacidad. DERR corre **local** por diseño (Docker,
  localhost, datos en `C:\Users\errob\DERR-Protected-Data`); Apify es lo
  opuesto (ejecución en su cloud).
- **Para el ecosistema alrededor de DERR (sin PHI): SÍ, con un piloto pequeño.**
  Vigilancia regulatoria, inteligencia de mercado y automatización
  administrativa son buenos candidatos.
- **Primer paso recomendado:** un Actor que monitoree la página oficial de
  **IVA** y avise por Slack o cree una nota en Notion cuando haya
  actualizaciones. Deadline anual relevante: **1 de junio**.
- **Palanca de dev a observar:** el **Apify MCP server** (distinto de los MCP
  connectors) para dar a Claude Code acceso a scrapers durante el desarrollo.

---

## 1. Qué son realmente los MCP Connectors de Apify

Los Actors de Apify son scrapers/automatizaciones web. Antes solo leían la web
pública. La novedad: los Actors pueden conectarse de forma segura a apps como
**Notion, Slack, GitHub, Sentry y Supabase** vía el **Model Context Protocol**,
**sin ver tus credenciales** (pasan por un proxy). Un Actor puede scrapear algo,
procesarlo y escribir el resultado en Notion o avisar por Slack en la misma
ejecución.

> **No confundir:**
> - **MCP Connectors** → dan a los Actors "brazos" para actuar sobre apps
>   externas (dirección: Actor → app).
> - **Apify MCP server** → expone los Actors como herramientas para
>   Claude/ChatGPT (dirección: LLM → Actor). Esta es la cara útil para ti como dev.

---

## 2. Decisión sobre el núcleo clínico de DERR

**Veredicto: NO integrar Apify en el core clínico.** Razones:

| Motivo | Detalle |
|---|---|
| Privacidad / legal | PHI bajo custodia (KIA, GNC), Mandela Rules + legislación de Aruba. Mandar PHI a la nube de Apify = riesgo serio. |
| Arquitectura | DERR está diseñado para correr local (Docker, localhost, datos protegidos). Apify ejecuta en su cloud. |
| Ya existe lo correcto | Integraciones nativas más apropiadas: FHIR R4, REST API propia, DICOM, EDI claims. |

**Regla operativa:** ningún flujo de Apify debe tocar datos de pacientes.
Todo lo que sigue es **sin PHI**.

---

## 3. Dónde SÍ puede aportar (todo sin PHI)

1. **Vigilancia regulatoria y sanitaria.** Cambios en guías de IVA,
   farmacovigilancia EMA/FDA, retiros de lotes, brotes relevantes para entorno
   penitenciario (sarna, TB, VHC), actualizaciones OMS/CDC. El Actor scrapea y,
   vía connector, abre un issue en GitHub / avisa por Slack / crea página en Notion.
2. **Inteligencia competitiva (fase comercial de DERR).** Monitoreo de Epic,
   Cerner, Hix, OpenMRS, Athenahealth (precios públicos, features, casos de uso)
   escrito a una base de datos para preparar material de venta.
3. **Vigilancia de proveedores y equipos (ciclo de renovación trianual).**
   Precios y disponibilidad de proveedores médicos, con alertas por umbral. Útil
   para el plan ministerial.
4. **Catálogos públicos de CME** (BLS, ACLS, PHTLS, ATLS) y feeds de revistas,
   con notificación automática a un canal cuando aparezca algo relevante.
5. **Project management de DERR vía GitHub connector.** Si un Actor detecta un
   enlace roto en el Help System o que cambió la URL oficial de IVA, abre un
   issue automáticamente en el repo. Encaje real en el flujo de desarrollo.

---

## 4. Piloto recomendado: monitor de IVA → Slack/Notion

**Objetivo:** no perderse cambios normativos de IVA antes del deadline anual del
**1 de junio**. Caso aislado, sin datos sensibles, para evaluar la plataforma
sin tocar el core clínico.

**Flujo:**

```
Actor (scrape página oficial IVA)
   → detecta cambio vs. última versión
   → MCP Connector
        ├─ Slack: mensaje a canal #derr-regulatorio
        └─ Notion: nueva página con resumen + fecha + enlace
```

**Criterios de éxito del piloto:**
- [ ] Detecta correctamente una actualización publicada (sin falsos positivos por
      cambios cosméticos de la página).
- [ ] La notificación llega con resumen claro, fecha y enlace a la fuente.
- [ ] Cero PHI involucrado en cualquier punto del flujo.
- [ ] Coste mensual del Actor dentro de un presupuesto aceptable.

**Checklist de implementación (cuando decidas arrancar):**
- [ ] Identificar la URL oficial exacta de la guía/normativa de IVA a vigilar.
- [ ] Elegir destino: Slack, Notion, o ambos.
- [ ] Crear el Actor (o usar un generic web-monitoring Actor) en Apify.
- [ ] Configurar el MCP Connector del destino (sin exponer credenciales).
- [ ] Definir frecuencia de chequeo (p.ej. diario) y ventana crítica antes del 1 de junio.
- [ ] Probar con un cambio simulado y validar la alerta.

---

## 5. Palanca de dev: Apify MCP server (a observar)

Independiente del piloto. El **Apify MCP server** podría sumar a tu flujo de
**Claude Code** dándole acceso a scrapers cuando los necesites durante el
desarrollo. Es palanca real para ti como dev, no para el producto clínico.

- Acción: cuando quieras, puedo ayudarte a configurar el Apify MCP server en
  Claude Code (paso aparte, no requiere tocar DERR).

---

## 6. Próximos pasos

1. Decidir si arrancas el **piloto de IVA** (Sección 4).
2. Elegir destino de notificación (Slack / Notion).
3. (Opcional) Configurar el **Apify MCP server** para Claude Code (Sección 5).
4. Mantener la regla de oro: **nada de PHI en ningún flujo de Apify.**

---

*Documento vivo. Actualízalo a medida que el piloto avance o cambien las prioridades.*
