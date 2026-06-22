# DERR — Spec técnica del piloto: Monitor de IVA → Slack/Notion

> Especificación de implementación del primer caso piloto de Apify para el
> ecosistema DERR. **Sin PHI.** Caso aislado, no toca el core clínico.
> Fecha: 2026-06-22 · Estado: borrador para implementar

---

## 1. Objetivo y alcance

> **Aclaración clave:** **IVA = Inspectie Volksgezondheid Aruba** (Inspección de
> Salud Pública de Aruba), el **regulador sanitario** — NO el impuesto IVA/BBO.
> Sitio oficial: `https://www.iva.aw/` (contenido en papiamento). Encaja de lleno
> con la vigilancia regulatoria de DERR.

**Objetivo:** detectar cambios en la normativa, guías y reportes publicados por
**IVA (Inspección de Salud Pública de Aruba)** y notificar de forma automática,
para no perder actualizaciones regulatorias relevantes para la práctica clínica
y el plan ministerial.

**En alcance:**
- Scrapeo periódico de la(s) página(s) oficial(es) de IVA.
- Detección de cambios respecto a la última versión guardada.
- Notificación a Slack y/o Notion con resumen, fecha y enlace.

**Fuera de alcance (explícito):**
- Cualquier dato de pacientes (PHI). **El flujo nunca toca KIA/GNC ni
  `DERR-Protected-Data`.**
- Decisiones automáticas: el Actor solo informa; la lectura la haces tú.

---

## 2. Arquitectura del flujo

```
┌─────────────────────────┐
│  Apify Actor (cloud)    │
│  - HTTP GET página IVA  │
│  - Extrae contenido     │
│  - Normaliza (limpia    │
│    cabeceras/footers)   │
└───────────┬─────────────┘
            │ hash/diff vs. snapshot anterior (Apify Key-Value Store / Dataset)
            ▼
     ¿Cambio real?  ──No──►  fin (sin ruido)
            │ Sí
            ▼
┌─────────────────────────┐
│   MCP Connector         │
│   (credenciales por     │
│    proxy, nunca al Actor)│
├───────────┬─────────────┤
│  Slack    │   Notion    │
│  msg a    │   nueva     │
│ #derr-    │   página    │
│ regulatorio│  con resumen│
└───────────┴─────────────┘
```

---

## 3. Componentes

### 3.1 Actor de scraping
- **Opción A (ELEGIDA):** `muhammad-bilal/web-drift-detector` — *Website Change
  Monitoring & Content Diff* del Apify Store. Detecta cambios, genera diffs
  estructurados, severidad, snapshots históricos y alertas por webhook.
  - Identificado vía búsqueda en el Apify MCP server (2026-06-22).
  - Tier **FREE**, modelo *pay-per-event* (~$0.0002 por página revisada →
    céntimos al mes con frecuencia diaria).
  - Campos de entrada relevantes: `startUrls` (requerido),
    `enableChangeDetection`, `enableSemanticDiff`, `enableAISummary`,
    `sensitivityLevel`.
  - Nota: la portada `iva.aw` bloquea fetches simples (HTTP 403); el Actor
    renderiza como navegador real y sortea ese bloqueo. Esto justifica usar
    Apify en lugar de un script casero.
- **Opción B (a medida):** Actor propio (Node/Python) que:
  1. Hace `GET` de la URL oficial.
  2. Extrae solo el bloque de contenido relevante (selector CSS/XPath) para
     evitar falsos positivos por banners, fechas dinámicas o publicidad.
  3. Calcula un hash del contenido normalizado.
  4. Compara con el snapshot anterior guardado en el **Key-Value Store** del Actor.
  5. Si difiere, genera un resumen (texto + diff de secciones cambiadas).

### 3.2 Detección de cambios
- Guardar snapshot anterior en Key-Value Store (clave: `iva_last_snapshot`).
- Normalizar antes de comparar: quitar espacios redundantes, timestamps de
  render, tokens de sesión, contadores.
- **Umbral anti-ruido:** ignorar cambios < N caracteres o que solo afecten a
  elementos en una *denylist* de selectores (footer, fecha actual, cookies).

### 3.3 Notificación (MCP Connectors)
- **Slack connector:** mensaje a `#derr-regulatorio` con: título, fecha de
  detección, enlace a la fuente, y resumen de qué cambió.
- **Notion connector:** crear página en una base "Vigilancia Regulatoria IVA"
  con propiedades: `Fecha`, `Fuente`, `Resumen`, `Estado` (Nuevo/Revisado).
- Las credenciales de Slack/Notion **pasan por el proxy de Apify**; el Actor no
  las ve.

---

## 4. Configuración operativa

| Parámetro | Valor propuesto |
|---|---|
| Frecuencia (normal) | 1×/día |
| Frecuencia (ventana crítica: mayo) | 2×/día, hasta el 1 de junio |
| Reintentos | 3, con backoff |
| Timeout por run | 60–120 s |
| Destino por defecto | Slack (`#derr-regulatorio`) + Notion |
| Retención de snapshots | últimos 30 días |

---

## 5. Datos de entrada (estado actual)

- [x] **Fuente confirmada:** IVA = Inspectie Volksgezondheid Aruba. Portada:
      `https://www.iva.aw/`. Sección vista: `https://www.iva.aw/sectornan-di-cuido`
      ("Sectornan di Cuido" — sectores de cuido que IVA monitorea).
- [ ] **URL(s) exacta(s) a vigilar.** Estructura del sitio descubierta
      (2026-06-22). Páginas recomendadas para el monitor:
      - `https://www.iva.aw/kwaliteitsthemas` — **Temas de calidad** (6 temas
        para el ciclo de 3 años). Alta prioridad: encaja con el ciclo trianual.
      - `https://www.iva.aw/geneesmiddelen` — **Medicamentos** (seguridad/calidad,
        farmacovigilancia, retiros).
      - `https://www.iva.aw/` — **portada**, capta nuevas publicaciones mensuales
        y avisos.
      - `https://www.iva.aw/sectornan-di-cuido` — sectores de cuido (manejo y
        reportes por sector).
      - Informes anuales (Jaarverslag), p.ej. `_flysystem/media/jaarverslag-AAAA.pdf`.
      *Recomendación de arranque:* `kwaliteitsthemas` + `geneesmiddelen` + portada.
- [x] **Actor elegido:** `muhammad-bilal/web-drift-detector` (ver 3.1).
- [ ] Selector(es) CSS/XPath del bloque relevante (o usar detección semántica
      del Actor con `sensitivityLevel` ajustado para reducir ruido del banner de
      cookies "Inspectie Volksgezondheid Aruba uses cookies").
- [ ] Workspace/canal de Slack (`#derr-regulatorio`) y permisos.
- [ ] Base de datos de Notion destino (ID) y esquema de propiedades.
- [x] **Apify conectado:** vía MCP server (app de escritorio, OAuth). Saldo
      disponible ~$5. Permisos en "Needs approval".
- [ ] Confirmar presupuesto mensual aceptable para el Actor.

---

## 6. Criterios de aceptación

- [ ] Detecta una actualización real publicada en la fuente.
- [ ] **Cero falsos positivos** por cambios cosméticos en 2 semanas de prueba.
- [ ] La notificación incluye resumen claro + fecha + enlace funcional.
- [ ] **Cero PHI** en cualquier punto (verificado por inspección del flujo).
- [ ] Coste mensual dentro del presupuesto definido.

---

## 7. Plan de pruebas

1. **Baseline:** primera ejecución guarda snapshot, no notifica.
2. **Cambio simulado:** alterar localmente el contenido esperado (o apuntar a
   una copia de prueba) y verificar que dispara alerta correcta.
3. **No-cambio:** ejecutar varias veces sin cambios → no debe notificar.
4. **Cambio cosmético:** modificar solo footer/fecha → no debe notificar.
5. **Resiliencia:** simular fuente caída (HTTP 5xx) → reintenta y no crashea ni
   manda falsa alerta.

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Falsos positivos por contenido dinámico | Selector específico + normalización + denylist |
| La fuente cambia su estructura HTML | Alerta de "no pude extraer contenido" en vez de silencio |
| Fuga accidental de datos sensibles | Regla dura: el Actor solo consume URLs públicas de IVA |
| Coste creciente | Frecuencia baja + límite de presupuesto en Apify |
| Dependencia de un único canal | Configurar Slack **y** Notion como respaldo |

---

## 9. Siguientes pasos

1. Reunir los datos de la Sección 5.
2. Decidir Opción A (Actor del Store) vs. B (a medida).
3. Implementar, conectar los MCP Connectors y correr el plan de pruebas (Sección 7).
4. Operar en sombra 2 semanas; luego confiar en las alertas de cara al 1 de junio.

---

*Relacionado: `DERR-Apify-Plan-de-Accion.md` (decisión y contexto) y
`DERR-Apify-MCP-Server-Setup.md` (palanca de dev).*
