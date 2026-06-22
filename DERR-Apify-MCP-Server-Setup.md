# DERR — Setup del Apify MCP server en Claude Code

> Guía para conectar el **Apify MCP server** a Claude Code y darle acceso a
> scrapers de Apify durante el desarrollo. **Esto es la palanca de dev**, distinta
> de los MCP Connectors del piloto de IVA.
> Fecha: 2026-06-22

---

## 0. Importante: qué es y qué no es

- **Apify MCP server** = expone los Actors de Apify como **herramientas para tu
  LLM** (Claude Code). Dirección: `Claude Code → Actors`. Lo usas tú, como dev.
- **MCP Connectors** (los del piloto de IVA) = dan a los Actors brazos para
  escribir en Slack/Notion. Dirección: `Actor → apps`. Eso es otra cosa.

**Regla de seguridad DERR:** este MCP server vive en tu entorno de desarrollo.
**No lo conectes a flujos que toquen PHI.** Úsalo para tareas de dev sin datos de
pacientes (scrapeo de fuentes públicas, pruebas, investigación).

---

## 1. Requisitos

- Token de API de Apify → Apify Console, sección **API & Integrations**.
  Trátalo como secreto; rótalo si se filtra.
- Claude Code instalado.
- Node.js (solo si eliges la opción local con `npx`).

---

## 2. Endpoints disponibles

| Modo | Endpoint / comando | Auth |
|---|---|---|
| Remoto (recomendado) | `https://mcp.apify.com` (HTTP streamable) | OAuth o `Authorization: Bearer <APIFY_TOKEN>` |
| Remoto (legacy) | `https://mcp.apify.com/sse` (SSE) | igual |
| Local (stdio) | `npx -y @apify/actors-mcp-server` | env `APIFY_TOKEN` |

---

## 3. Opción A — Remoto vía OAuth (más simple)

```bash
claude mcp add --transport http apify https://mcp.apify.com
```

Al primer uso, Claude Code abrirá el flujo de **OAuth** para autorizar con tu
cuenta de Apify. No tienes que pegar el token a mano.

## 4. Opción B — Remoto con token en cabecera

Si prefieres token explícito en vez de OAuth:

```bash
claude mcp add --transport http apify https://mcp.apify.com \
  --header "Authorization: Bearer $APIFY_TOKEN"
```

> Exporta el token antes (`export APIFY_TOKEN=...`) o, mejor, guárdalo en tu
> gestor de secretos y no lo escribas en claro en scripts versionados.

## 5. Opción C — Local con npx (stdio)

Útil si quieres correrlo en tu máquina sin depender del endpoint remoto.
Config en el archivo MCP del proyecto (`.mcp.json`) o de usuario:

```json
{
  "mcpServers": {
    "actors-mcp-server": {
      "command": "npx",
      "args": ["-y", "@apify/actors-mcp-server"],
      "env": {
        "APIFY_TOKEN": "YOUR_APIFY_TOKEN"
      }
    }
  }
}
```

El paquete se descarga solo en el primer uso y conecta con tu token.

---

## 6. Acotar qué Actors expone (recomendado)

Por defecto el server puede exponer muchas herramientas. Puedes limitarlo con el
parámetro `tools` en la URL, p.ej.:

```
https://mcp.apify.com?tools=actors,docs,apify/rag-web-browser
```

o seleccionar Actors concretos:

```
https://mcp.apify.com?tools=apify/google-search-scraper,apify/instagram-scraper
```

Para DERR-dev, empieza acotado (p.ej. solo `apify/rag-web-browser` y
`apify/google-search-scraper`) y amplía según necesites. Menos superficie = menos
ruido y menos riesgo.

---

## 7. Verificación

```bash
claude mcp list          # debe aparecer "apify" / "actors-mcp-server"
```

Luego, dentro de una sesión de Claude Code, pídele que use una herramienta de
Apify (p.ej. una búsqueda con `google-search-scraper`) y confirma que responde.

---

## 8. Buenas prácticas de seguridad

- **Token como secreto:** nunca lo commitees. Si usas `.mcp.json` con token en
  claro, añádelo a `.gitignore`. Prefiere OAuth (Opción A).
- **Aislamiento de PHI:** este server es para dev sin datos de pacientes. No lo
  mezcles con el core clínico de DERR.
- **Mínimo privilegio:** acota `tools=` a lo que realmente uses (Sección 6).
- **Rotación:** rota el token periódicamente y de inmediato si se expone.

---

## 9. ¿Quieres que lo deje configurado?

El archivo de configuración de Claude Code vive en **tu máquina local**, no en
este repo remoto. Cuando quieras, dime y te guío paso a paso (o, si me das acceso
en tu entorno local, lo dejo listo). Lo único que necesitas a mano es el token de
Apify o usar OAuth.

---

## Fuentes

- [Apify MCP server | Apify Documentation](https://docs.apify.com/platform/integrations/mcp)
- [@apify/actors-mcp-server (npm)](https://www.npmjs.com/package/@apify/actors-mcp-server)
- [apify/apify-mcp-server (GitHub)](https://github.com/apify/apify-mcp-server)
- [Apify MCP server (Apify Store)](https://apify.com/apify/actors-mcp-server)

---

*Relacionado: `DERR-Apify-Plan-de-Accion.md` y `DERR-Apify-Piloto-IVA-Spec.md`.*
