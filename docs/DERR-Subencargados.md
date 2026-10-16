# DERR — Subencargados y terceros que reciben datos

> Lista de los proveedores que intervienen en el tratamiento, verificada contra el código
> de las tres apps el 2026-10-08 y revisada el 2026-10-11. Es el Anexo B del contrato de encargado
> (`DERR-Contrato-Encargado-Tratamiento.md`).
> Estado: **Borrador.** Las filas marcadas "por confirmar" necesitan una comprobación en el
> panel del proveedor.

## Subencargados

Proveedores con los que DERR tiene relación y que tratan datos por cuenta de la institución.

| Proveedor | Qué hace | Apps | Qué datos ve | Dónde | Acuerdo de tratamiento (DPA) |
|---|---|---|---|---|---|
| **Railway** (EE. UU.) | Aloja las apps y sus bases de datos; desde Robelt1971/DERR-Medical-System#26 guarda también los registros (logs) del servidor de Medical | Las tres | Todo lo que guarda el servidor. Lo que está cifrado en la app lo ve cifrado, pero la llave está en sus variables de entorno. Los logs de Medical van sin nombres, MRN ni búsquedas (Robelt1971/DERR-Medical-System#26, #29) | Países Bajos (Ámsterdam) desde el 2026-10-08 | Pendiente de firmar |
| **Cloudflare** (EE. UU.) | DNS del dominio, sitio web, correo; recursos de cdnjs | Las tres | Si el proxy está activo en los subdominios de las apps, todo el tráfico pasa descifrado por su red. Por confirmar en el panel de Cloudflare | Red global | Pendiente de firmar |
| **Anthropic** (EE. UU.) | Funciones de IA clínica, si la institución las activa | Medical | Texto clínico sin el nombre del paciente: desde Robelt1971/DERR-Medical-System#12 todas las llamadas pasan por un único punto que quita los nombres y no envía nada si no puede; el servidor quita además MRN y fecha de nacimiento etiquetados. **Hoy no está activa:** Railway no tiene `ANTHROPIC_API_KEY` ni `CLAUDE_API_KEY`, así que no se envía nada. El error que rechazaba las llamadas con 401 se corrigió en Robelt1971/DERR-Medical-System#51 (2026-10-16): añadir la clave activaría el envío | EE. UU. | Pendiente de firmar. La API de Anthropic no usa estos datos para entrenar modelos por defecto; confirmar en el contrato. **Alternativa:** con la IA local (`AI_PROVIDER=local`, Robelt1971/DERR-Medical-System#49, fusionado el 2026-10-14) Anthropic no recibe nada; si el modelo corre en un servidor alquilado, ese proveedor entra en esta lista |
| **Resend** (EE. UU.) | Correo de alertas de seguridad | Las tres | Dirección IP y nombre de usuario de intentos de acceso | EE. UU. | Pendiente |
| **CallMeBot** | Alertas de seguridad por WhatsApp | Dental y Justice; Medical por configuración | Dirección IP y nombre de usuario | Por confirmar | No ofrece. **Recomendación:** sustituir |
| **Almacenamiento de respaldos compatible con S3** (proveedor por elegir) | Guarda los respaldos cifrados de Medical (Robelt1971/DERR-Medical-System#25) y la copia externa de Dental (Robelt1971/DERR-Dental-System#6), cuando se activen | Medical y Dental | Solo archivos cifrados; la llave de los respaldos no está en el proveedor. Si la institución pone su propio almacenamiento (su MinIO, su S3), el proveedor es suyo y no de DERR | Según el destino elegido en la ficha | Por firmar con el proveedor que elija DERR para la opción "nube DERR". **Aún no activo** |
| **Sentry** (EE. UU.) | Registro de errores, si está configurado | Medical y Dental | Trazas de error; configurado para no enviar datos personales por defecto | Por confirmar (Sentry ofrece región UE) | Pendiente, si se usa |

## Terceros por diseño del navegador o del usuario

No son subencargados de DERR, pero reciben datos y la institución debe saberlo.

| Tercero | Cuándo | Qué recibe | Recomendación |
|---|---|---|---|
| **Google**, mediante el reconocimiento de voz de Chrome | Al usar dictado o comandos de voz en las tres apps | El audio de lo que se dicta, incluidos datos clínicos | Usar el dictado local con whisper.cpp propuesto en el pull request Robelt1971/Robelt1971#30 (pendiente de revisión), o avisar al usuario antes de activar el micrófono |
| **api.qrserver.com** | Ya no se usa | Nada | **Eliminado** el 2026-10-08 (Robelt1971/DERR-Dental-System#5): el código QR se genera en el navegador |
| **WhatsApp / Meta**, mediante enlaces `wa.me` | Al enviar recordatorios a pacientes desde Medical o Dental | Teléfono del paciente y texto del mensaje, enviado por el usuario desde su propio WhatsApp | Avisar en la política; evitar datos clínicos en el texto |
| **Google Fonts** y **cdnjs** | Al cargar las páginas | Dirección IP del navegador | Servir fuentes y librerías desde la propia app |
| **Dentalink** (Healthatom) | Integración de Dental, si la clínica la activa | Dental recibe datos de pacientes desde Dentalink | Es proveedor de la clínica, no de DERR; mencionarlo en el contrato con la clínica que la use |

## Mantenimiento

- Cualquier proveedor nuevo se añade aquí antes de activarlo, y se avisa a las instituciones
  con 30 días de antelación (cláusula 7 del contrato).
- Revisar esta lista cada vez que se añada una integración o una llamada a un servicio
  externo en cualquiera de las tres apps.
