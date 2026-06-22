# DERR — Spec técnica del piloto: Monitor de IVA → Slack/Notion

> Especificación de implementación del primer caso piloto de Apify para el
> ecosistema DERR. **Sin PHI.** Caso aislado, no toca el core clínico.
> Fecha: 2026-06-22 · Estado: borrador para implementar

---

## 1. Objetivo y alcance

**Objetivo:** detectar cambios en la normativa/guía oficial de **IVA** y notificar
de forma automática, para no perder actualizaciones antes del deadline anual del
**1 de junio**.

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
- **Opción A (rápida):** usar un Actor genérico de *website content monitoring*
  del Apify Store, configurando la URL de IVA.
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

## 5. Datos de entrada (a completar antes de arrancar)

- [ ] **URL(s) oficial(es) exacta(s)** de la guía/normativa de IVA a vigilar.
- [ ] Selector(es) CSS/XPath del bloque de contenido relevante.
- [ ] Workspace/canal de Slack (`#derr-regulatorio`) y permisos.
- [ ] Base de datos de Notion destino (ID) y esquema de propiedades.
- [ ] Token de Apify y presupuesto mensual aceptable para el Actor.

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
