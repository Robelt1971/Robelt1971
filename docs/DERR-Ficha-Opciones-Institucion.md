# DERR — Ficha de opciones de datos para cada institución

> Se rellena con la institución **antes de firmar** y se adjunta al contrato de encargado
> como Anexo D (`DERR-Contrato-Encargado-Tratamiento.md`). Cada respuesta cambia cómo se
> configura su instalación, así que no se deja ninguna en blanco.
> Fecha de la plantilla: 2026-10-08

**Institución:** [nombre] · **App(s):** [Medical / Dental / Justice] · **Fecha:** [fecha]
**Responsable por la institución:** [nombre y cargo] · **Por DERR:** [nombre]

---

## 1. Dónde funciona la aplicación

| Opción | Qué implica | Elegida |
|---|---|---|
| **Nube DERR** (Railway, Ámsterdam) | DERR opera los servidores. Datos en los Países Bajos | ☐ |
| **Instalación local** en servidores de la institución o en un centro de datos en Aruba | Los datos no salen de Aruba. La institución aporta el servidor; DERR instala y mantiene | ☐ |

## 2. Dónde se guardan los respaldos

Los respaldos siempre van **cifrados**. La institución elige el destino.

| Opción | Qué implica | Elegida |
|---|---|---|
| **Solo en la nube DERR** | Copias diarias dentro de la plataforma de DERR. No protege si la plataforma entera falla | ☐ |
| **Servidor propio de la institución en Aruba** | Copia diaria enviada a un servidor de la institución compatible con S3 (por ejemplo MinIO). La institución lo compra y lo mantiene | ☐ |
| **Almacenamiento en la nube de la institución** | Copia diaria a un bucket de la institución (AWS S3, Cloudflare R2, Backblaze B2 u otro compatible con S3), en la región que elija | ☐ |

- **Región del almacenamiento elegido:** [país / región]
- **Copias que se conservan:** [14 diarias por defecto / otro]
- **Quién guarda la llave de los respaldos:** ☐ la institución (recomendado) ☐ DERR
- **Prueba de restauración:** ☐ anual ☐ semestral — DERR entrega un acta de cada prueba

## 3. Llave de cifrado de los datos

| Opción | Qué implica | Elegida |
|---|---|---|
| **Estándar** | La llave está en la configuración del servidor de DERR, separada de la base de datos | ☐ |
| **Llave en un servicio aparte** | La llave vive en un servicio de llaves distinto del alojamiento. Más protección, coste adicional | ☐ |

## 4. Equipos compartidos

| Opción | Qué implica | Elegida |
|---|---|---|
| **Borrar la copia local al cerrar sesión** | Recomendado si varias personas usan el mismo PC. Requiere conexión para volver a cargar los datos | ☐ |
| **Conservar la copia local cifrada** | Permite trabajar sin conexión. Solo para PCs de uso personal | ☐ |

## 5. Funciones que envían datos a terceros

| Función | Opción | Elegida |
|---|---|---|
| **IA clínica** (DERR Medical, Anthropic, EE. UU.) | Activada: se quita el nombre del paciente antes de enviar | ☐ |
| | Desactivada | ☐ |
| **Dictado por voz** | Navegador Chrome (el audio pasa por Google) | ☐ |
| | Dictado local, sin enviar audio fuera (cuando esté disponible) | ☐ |
| | Desactivado | ☐ |
| **Alertas de seguridad** | Correo y WhatsApp al responsable de DERR (IP y usuario) | ☐ |
| | Solo correo | ☐ |

## 6. Fin del contrato

- **Formato de entrega de los datos:** ☐ JSON ☐ CSV ☐ otro: [ ]
- **Plazo de conservación de historias clínicas o expedientes exigido por la ley** (lo confirma la institución): [años]

---

**Firmas**

Por la institución: ____________________ Por DERR: ____________________
