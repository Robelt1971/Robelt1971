# DERR — Subencargados y terceros que reciben datos

> Lista de los proveedores que intervienen en el tratamiento, verificada contra el código
> de las tres apps el 2026-10-08. Es el Anexo B del contrato de encargado
> (`DERR-Contrato-Encargado-Tratamiento.md`).
> Estado: **Borrador.** Las filas marcadas "por confirmar" necesitan una comprobación en el
> panel del proveedor.

## Subencargados

Proveedores con los que DERR tiene relación y que tratan datos por cuenta de la institución.

| Proveedor | Qué hace | Apps | Qué datos ve | Dónde | Acuerdo de tratamiento (DPA) |
|---|---|---|---|---|---|
| **Railway** (EE. UU.) | Aloja las apps y sus bases de datos | Las tres | Todo lo que guarda el servidor. Lo que está cifrado en la app lo ve cifrado, pero la llave está en sus variables de entorno | Países Bajos (Ámsterdam) desde el 2026-10-08 | Pendiente de firmar |
| **Cloudflare** (EE. UU.) | DNS del dominio, sitio web, correo; recursos de cdnjs | Las tres | Si el proxy está activo en los subdominios de las apps, todo el tráfico pasa descifrado por su red. Por confirmar en el panel de Cloudflare | Red global | Pendiente de firmar |
| **Anthropic** (EE. UU.) | Funciones de IA clínica | Medical | Texto clínico que el usuario envía a la IA, documentos y fotos en la extracción de documentos. Solo algunas funciones quitan el nombre antes de enviar | EE. UU. | Pendiente de firmar. La API de Anthropic no usa estos datos para entrenar modelos por defecto; confirmar en el contrato |
| **Resend** (EE. UU.) | Correo de alertas de seguridad | Las tres | Dirección IP y nombre de usuario de intentos de acceso | EE. UU. | Pendiente |
| **CallMeBot** | Alertas de seguridad por WhatsApp | Dental y Justice; Medical por configuración | Dirección IP y nombre de usuario | Por confirmar | No ofrece. **Recomendación:** sustituir |
| **Sentry** (EE. UU.) | Registro de errores, si está configurado | Medical y Dental | Trazas de error; configurado para no enviar datos personales por defecto | Por confirmar (Sentry ofrece región UE) | Pendiente, si se usa |

## Terceros por diseño del navegador o del usuario

No son subencargados de DERR, pero reciben datos y la institución debe saberlo.

| Tercero | Cuándo | Qué recibe | Recomendación |
|---|---|---|---|
| **Google**, mediante el reconocimiento de voz de Chrome | Al usar dictado o comandos de voz en las tres apps | El audio de lo que se dicta, incluidos datos clínicos | Usar el dictado local con whisper.cpp propuesto en el pull request Robelt1971/Robelt1971#30 (pendiente de revisión), o avisar al usuario antes de activar el micrófono |
| **api.qrserver.com** | Al configurar el 2FA en Dental | El secreto de 2FA del usuario | **Se elimina** en la corrección en curso; el código QR pasará a generarse en el navegador |
| **WhatsApp / Meta**, mediante enlaces `wa.me` | Al enviar recordatorios a pacientes desde Medical o Dental | Teléfono del paciente y texto del mensaje, enviado por el usuario desde su propio WhatsApp | Avisar en la política; evitar datos clínicos en el texto |
| **Google Fonts** y **cdnjs** | Al cargar las páginas | Dirección IP del navegador | Servir fuentes y librerías desde la propia app |
| **Dentalink** (Healthatom) | Integración de Dental, si la clínica la activa | Dental recibe datos de pacientes desde Dentalink | Es proveedor de la clínica, no de DERR; mencionarlo en el contrato con la clínica que la use |

## Mantenimiento

- Cualquier proveedor nuevo se añade aquí antes de activarlo, y se avisa a las instituciones
  con 30 días de antelación (cláusula 7 del contrato).
- Revisar esta lista cada vez que se añada una integración o una llamada a un servicio
  externo en cualquiera de las tres apps.
