# DERR — Política de privacidad, apartado 6: dónde se almacenan los datos y cómo se protegen

> Propuesta de redacción y plan de medidas que la respaldan.
> Fecha: 2026-10-07 · Actualizado: 2026-10-08 con la auditoría del código de las tres apps;
> 2026-10-11 con lo fusionado en DERR Medical (pull requests #14 a #31) y en Dental y Justice;
> 2026-10-12 con lo fusionado en DERR Medical hasta el pull request #42 y en Justice#9
> Estado: **Borrador, pendiente de revisión legal en Aruba**

## Problema

El texto vigente del apartado 6 dice que las tres aplicaciones (DERR Medical,
DERR Dental y DERR Justice) y sus bases de datos se alojan en Railway, en
California, y que el sitio, el dominio y el correo pasan por Cloudflare, por lo
que los datos pueden procesarse fuera de Aruba. Es honesto, pero describe un
riesgo sin decir qué se hace al respecto. Una institución que lee solo eso
tiene motivos para no comprar.

La respuesta tiene tres capas: medidas técnicas que hagan que la ubicación
importe menos, compromisos contractuales verificables y una opción de
despliegue local para quien no acepte datos fuera de Aruba. La política debe
reflejar las tres.

---

## 1. Medidas técnicas

| Medida | Qué resuelve | Estado |
|---|---|---|
| Cifrado de campos sensibles en la aplicación, con la llave separada de la base de datos (opción A; llave en servicio aparte como opción de pago) | Railway solo guarda texto cifrado. Responde al argumento CLOUD Act: el proveedor podría entregar datos, pero ilegibles | parcial: Medical y Dental cifran algunos campos, con la llave en Railway; Justice no cifra nada. En Medical, el cifrado con llave por institución está **fusionado, pendiente de activar** para las tablas antiguas; los datos de sincronización y las llaves de recuperación de los PCs ya lo usan siempre (§1.1) |
| Región Railway **EU West (Ámsterdam)** para servicio, base de datos y volúmenes | Datos dentro del Reino de los Países Bajos, bajo régimen GDPR, en vez de California. Cambio de configuración, no de código | hecho (2026-10-08) |
| Seudonimización: tabla de identidad separada de la tabla clínica o judicial, enlazadas por identificador interno | Un acceso indebido a una tabla no revela a quién pertenece el dato | Medical: **fusionada, pendiente de activar**, solo para los datos sincronizados (la sincronización está apagada). Dental y Justice: no (§1.1) |
| Copia de respaldo cifrada periódica en el destino que elija la institución al contratar (su servidor en Aruba, su nube o la nube DERR) | "¿Y si Railway desaparece o nos corta el servicio?" | Medical: **fusionada, pendiente de activar**. Dental: cifrada, copia externa por configurar. Justice: no hay (§1.1) |
| Autenticación de dos factores, roles por perfil, registro inalterable de accesos, acceso administrativo de DERR limitado y registrado | Trazabilidad y mínimo privilegio | parcial: roles en el servidor en las tres apps. Medical: 2FA obligatoria de verdad para propietario y administrador, y registro inalterable en todas las rutas del servidor que tocan datos de pacientes, **activos al desplegar**; el rol de base de datos sin privilegios está **fusionado, pendiente de activar** (§1.1) |
| TLS en todo el recorrido, incluido aplicación ↔ base de datos dentro de Railway | Cifrado en tránsito | parcial: navegador ↔ app sí; app ↔ base de datos sin TLS o sin verificar certificado (§1.1) |

### 1.1 Estado verificado por aplicación (auditoría del código, 2026-10-08; actualizado el 2026-10-11 y el 2026-10-12)

Auditoría de solo lectura del código y la configuración de las tres apps. No se abrió
ningún dato real. Las actualizaciones del 2026-10-11 y del 2026-10-12 se hicieron leyendo el
código de la rama principal y el historial de los pull requests fusionados. **No se comprobó
qué versión está desplegada ni qué variables hay en Railway.**

Cómo se lee el estado. Hay tres niveles, y solo el primero protege algo sin que nadie haga
nada más:

- **Activo al desplegar:** fusionado y sin interruptor. Funciona en cuanto esa versión está
  desplegada en producción.
- **Fusionado, pendiente de activar:** está en el código, pero apagado hasta que se ponga una
  variable en Railway o el propietario o un administrador encienda un interruptor de la
  institución. La mayor parte de lo nuevo está así, apagado por defecto.
- **En desarrollo:** todavía no está fusionado. Se indica si hay un pull request abierto.

Hasta el 2026-10-11 este documento llamaba "implementado" a lo fusionado y activo por
defecto, como si estuviera en producción. Eso no se puede afirmar sin comprobar el
despliegue; por eso ahora se dice "activo al desplegar".

"Medical#N" es el pull request N de `Robelt1971/DERR-Medical-System`; igual para Dental y
Justice.

| Medida | DERR Medical | DERR Dental | DERR Justice |
|---|---|---|---|
| Cifrado de campos en el servidor | Parcial. AES-256-GCM en nombre, MRN, fecha de nacimiento, diagnóstico y notas. Sin cifrar: celda, departamento, archivos subidos. Versión 2, con una llave por institución y cada valor atado a su institución, tabla, columna y fila: **pendiente de activar** para las tablas antiguas (`CRYPTO_WRITE_VERSION=v2`, Medical#22). Usan siempre la versión 2, sin variable: los datos de sincronización, la zona de espera de la importación y las llaves de recuperación de los PCs (Medical#24, #37, #38) | Parcial. AES-256-GCM en historia clínica y formulario de ingreso. Sin cifrar: nombre, cédula, fecha de nacimiento, contacto, notas de citas, recetas, archivos subidos | No hay. Todo se guarda en claro |
| Dónde está la llave | Variable de entorno en Railway (`ENCRYPTION_MASTER_KEY`). En la versión 2, la llave de cada institución se guarda en la base de datos envuelta con una llave derivada de la de Railway. La llave de la bóveda de cada PC no sale del PC sin envolver (§1.2) | Variable de entorno en Railway | No aplica |
| Rotación de llave | Versión 2: se puede rotar la llave de una institución (sin pantalla todavía). La llave principal no debe cambiarse nunca: de ella dependen los datos actuales, los seudónimos y las llaves de recuperación de los PCs | No | No aplica |
| Datos en el navegador | **La mayor parte de la historia clínica vive solo en el navegador** (IndexedDB), cifrada. **Activo al desplegar:** nada se guarda en claro (Medical#16); un dato que no se puede abrir nunca se sobrescribe (Medical#34); cada PC tiene una llave propia, guardada solo envuelta con la contraseña de cada usuario y con una llave de recuperación que guarda el servidor; entrada sin conexión y bloqueo de pantalla (Medical#38, #41; §1.2). **Pendiente de activar:** volver a cifrar los datos con la llave del PC (`vault_mode = encrypt`, Medical#40). Hasta entonces los datos siguen cifrados con la llave antigua, que está en el mismo navegador. **En desarrollo:** borrado seguro en PCs compartidos y retirar la llave antigua | Copia completa de la clínica en claro en el navegador; no se borra al cerrar sesión | Expedientes completos, con fotos y huellas, en claro en el navegador; no se borran al cerrar sesión |
| Seudonimización | Las tablas antiguas siguen repitiendo el nombre. En la sincronización, ningún MRN ni nombre llega al servidor como identificador; la identidad se guarda cifrada aparte y se enlaza por un índice ciego (Medical#31). Psicología, psiquiatría, fisioterapia y optometría guardan ya el MRN del paciente elegido de la lista, así que sus registros nuevos también se enlazan (Medical#33). Todo esto, **pendiente de activar** con la sincronización | No | No |
| Respaldo | Respaldo de **todas** las tablas del servidor, cifrado con una llave propia, enviado a un almacenamiento compatible con S3, verificado y con herramienta de restauración (Medical#25): **pendiente de activar** (`BACKUP_TARGET`, `BACKUP_ENCRYPTION_KEY`, `BACKUP_S3_*`). El respaldo antiguo se retiró, así que hoy solo existen los que ofrezca Railway. Incluye las cuentas de usuario. No incluye la historia clínica que vive solo en los navegadores | Diario, 14 copias, dentro de la misma base de datos. Desde Dental#6, cifrado (con llave propia si se define `BACKUP_ENCRYPTION_KEY`; si no, con una derivada de la principal) y sin contraseñas ni secretos 2FA; copia externa a S3 **lista, pendiente de configurar** | No hay, salvo los respaldos que ofrece Railway |
| 2FA | **Activo al desplegar:** obligatoria para propietario y administrador. Una cuenta sin secreto ya no recibe sesión: tiene que inscribirse primero (Medical#32). Un mismo código no se acepta dos veces (Medical#42). La entrada **sin conexión** no pide 2FA, por decisión del propietario (A4) | Corregido (Dental#5): verifica de verdad y el QR se genera en el navegador. Obligatorio para todo el personal, controlado en el servidor (2026-10-10, commit `d618866`, sin pull request) | No hay |
| Roles (RBAC) | **Activo al desplegar:** la matriz del navegador y la del servidor son idénticas y un test lo comprueba; se aplica en las rutas que solo pedían sesión (Medical#21). Los permisos personalizados del propietario se guardan en el servidor, valen en todos los PCs y cada cambio queda auditado (Medical#30). Falta controlar por sección la ruta de IA | Sí, en el servidor | Sí, en el servidor |
| Aislamiento por fila (RLS) | El contexto se rellena en cada petición (Medical#14). El rol de base de datos `derrms_app`, que no puede saltarse RLS, está **pendiente de activar** (`DB_APP_ROLE_PASSWORD`, Medical#19). Con él funcionan la sincronización, la importación, la bóveda, los permisos y, desde Medical#35, las rutas antiguas con datos de pacientes (`/api/v1` y archivos subidos). El inicio de sesión y los respaldos siguen con el usuario principal. Sin la variable, todo usa el usuario principal de Railway, que es superusuario y se salta RLS | Definido; varias rutas lo saltan | No hay |
| Registro de auditoría | Registro de accesos `data_access_log`: cadena de hashes, nadie puede editarlo ni borrarlo, y si no se escribe la operación falla (Medical#17). Solo guarda identificadores, conteos y códigos, nunca nombres ni contenido. **Activo al desplegar** en las rutas antiguas con datos de pacientes (Medical#35) y en cada entrega de la llave de recuperación de un PC (Medical#38). En la sincronización y la importación se escribe cuando estén encendidas. El registro antiguo `audit_log` sigue además, solo agregable | Bloquea edición al rol de la app, sin cadena de hashes; no registra lecturas de historias clínicas | Editable; los cambios los informa el navegador y pueden falsificarse; no registra lecturas |
| Sesión | **Activo al desplegar:** la sesión funciona dentro del iframe de Justice (cookie particionada, Medical#18). Cerrar sesión la revoca en el servidor; si el servidor no responde, la app lo recuerda y la cierra en el servidor antes de abrir otra (Medical#41). Antes, en ese caso, recargar la página volvía a abrir la sesión anterior | Sin revisar en esta actualización | Sin revisar en esta actualización |
| Registros del servidor (logs) | **Activo al desplegar:** van a la salida de Railway, sin la ruta de Windows (Medical#26). La ruta de cada petición solo conserva las palabras de una lista permitida; cualquier otra (MRN, nombre, identificador) sale como `:id`. No se guardan el cuerpo ni los valores de la búsqueda, y los campos sensibles salen como `[REDACTED]` (Medical#29) | Sin revisar en esta actualización | Sin revisar en esta actualización |
| TLS app ↔ base de datos | Activado por defecto, depende de variables en Railway | Sin configurar | Desactivado en la red interna; sin verificar certificado en la pública |
| Cabeceras de seguridad (HSTS, CSP) | Sí. La CSP bloquea; `frame-ancestors` solo admite los orígenes de Justice | Sí | HSTS sí (Justice#7). La CSP completa va en modo informe salvo que se defina `CSP_ENFORCE=true` (Justice#9): **pendiente de activar** |

### 1.2 Dónde están los datos de DERR Medical (2026-10-12)

| Lugar | Qué guarda | Cómo se protege | Nivel |
|---|---|---|---|
| **Servidor:** Postgres en Railway, Ámsterdam. Tablas antiguas | Pacientes, citas y resultados que llegan por `/api/v1`, archivos subidos, usuarios, auditoría | Campos sensibles cifrados con la versión 1; registro de accesos que falla cerrado; RLS solo con el rol `derrms_app` | Cifrado v1 y registro: activos al desplegar. Versión 2 y RLS real: pendientes de activar |
| **Servidor:** tablas de sincronización (`clinical_records`, `subjects`, `record_conflicts`, `import_staging` y otras) | Una fila por registro sincronizado. **Vacías** mientras la institución tenga `sync_mode = off` (por defecto): todas las rutas responden `SYNC_OFF` y no escriben nada | Contenido cifrado con la versión 2 y la llave de la institución; identificadores seudónimos e índice ciego del MRN; RLS forzado; sin borrado físico; registro de accesos que falla cerrado | Pendiente de activar (`sync_mode`) |
| **Servidor:** `vault_device_keys` | Una llave de recuperación por PC, para recuperar la llave local tras un cambio de contraseña | Cifrada con la versión 2; nunca cambia; revocar es definitivo; cada entrega queda en el registro | Activo al desplegar (se crea en cada entrada con conexión) |
| **Navegador de cada PC** (IndexedDB `derrms`, cola `derrms_sync`, bóveda `derrms_vault`) | Casi toda la historia clínica, la cola de cambios pendientes y las llaves envueltas | Nada en claro. Hoy los datos van cifrados con una llave guardada en el mismo navegador. La llave nueva del PC solo existe envuelta: con la contraseña de cada usuario (PBKDF2, 600 000 vueltas, solo contraseñas de 12 caracteres o más) y con la llave de recuperación del servidor. Entrada sin conexión hasta 7 días desde la última entrada con conexión de ese usuario en ese PC, sin 2FA. Bloqueo de pantalla a los 15 minutos en PCs `shared_persist` (por defecto) o `shared_wipe`; no cierra la sesión ni pierde lo escrito | Llave del PC, entrada sin conexión y bloqueo: activos al desplegar. Volver a cifrar los datos con la llave del PC: pendiente de activar (`vault_mode = encrypt`). Borrado al cerrar sesión o tras 30 días: en desarrollo |
| **Dentro de DERR Justice** | Una copia aparte por cada dirección de Justice (`justice.derrgroup.com` y la dirección de Railway) | El navegador separa el almacenamiento de un iframe de otro sitio. Cada copia es un "PC" distinto, con su propia llave, su propia política y su propia llave de recuperación. La sesión usa una cookie particionada | Activo al desplegar |
| **Archivos `.enc`** en la carpeta protegida del PC, si está conectada | Copia de las colecciones con datos de pacientes | Cifrados, pero con una llave que se puede reconstruir (diseño de sincronización, §0) | Se siguen escribiendo. Decisión del propietario: dejan de escribirse 90 días después de activar la sincronización en ambos sentidos en la institución y pasan a servir solo para importar. En desarrollo |
| **Respaldos** | Todas las tablas del servidor, incluidas las cuentas de usuario | Cifrados con una llave propia, distinta de la de los datos; verificados tras subirlos | Solo si se configuran: pendiente de activar |
| **Logs del servidor** | Peticiones y errores, en la salida de Railway | Lista de palabras permitidas en las rutas; solo conteos y códigos, sin nombres, MRN, búsquedas ni contenido | Activo al desplegar |

**Qué sigue en desarrollo** (en Medical, el 2026-10-12 solo había un pull request abierto,
el #43; el resto no tiene todavía pull request):

- **Medical#43 (abierto):** las consultas a las bases públicas de medicamentos (FDA y NLM,
  Estados Unidos) pasan por el servidor y solo cuando se abre la pantalla de alertas
  clínicas. Envían solo nombres de medicamentos fijos en el código, nunca datos de un
  paciente. Hoy la CSP las bloquea, así que no sale nada.
- **Paso 16, segunda parte:** borrado seguro de la copia local en PCs compartidos
  (`shared_wipe` al cerrar sesión; `shared_persist` tras 30 días sin uso) y que un
  administrador pueda enviar el trabajo pendiente de otro usuario (B4). Hoy nada se borra:
  la comprobación `canWipe()` nunca lo permite.
- **App disponible sin red al recargar:** hoy la entrada sin conexión solo funciona en una
  pestaña que ya estaba abierta.
- **Paso 15d:** borrar la llave antigua de cada PC, solo cuando ese PC esté migrado,
  verificado y sin trabajo pendiente (A3).
- **Restablecer la contraseña de un usuario por un administrador** (A9).
- **Paso 17:** `.enc` solo para importar, con el plazo de 90 días.

**Otros hallazgos que afectan a la política:**

- **Terceros que reciben datos.** Medical envía texto clínico a la API de Anthropic
  (Estados Unidos) desde las funciones de IA. Desde Medical#12 todas las llamadas pasan por
  un único punto que quita el nombre del paciente y no envía nada si no puede quitarlo; los
  documentos con imagen piden confirmación. **Hoy la IA no funciona en producción:** el
  navegador llama al servidor sin el token de sesión y recibe 401
  (`src/services/claudeClient.ts`), así que Anthropic no recibe nada. Dental usa el
  reconocimiento de voz del navegador, que en Chrome envía el audio a Google. Las alertas de
  seguridad de las tres apps envían IP y usuarios a Resend y a una pasarela de WhatsApp. Las
  consultas de Medical a bases públicas de medicamentos están bloqueadas por la CSP; Medical#43
  (abierto) las haría pasar por el servidor, sin datos de pacientes (§1.2). La lista completa
  está en `DERR-Subencargados.md`.
- **Medical guarda la historia clínica en los equipos de la institución,** no en Railway.
  Eso significa que gran parte de los datos ya está físicamente en Aruba, protegida por el
  cifrado del navegador y la seguridad de cada equipo. Mientras la llave antigua siga en el
  mismo navegador (hasta activar `vault_mode = encrypt` y, después, el paso 15d), quien copie
  el perfil del navegador puede abrir esos datos. Mientras la sincronización esté apagada,
  esos datos no están en el servidor ni en sus respaldos.
- **Justice ya no publica los hashes de la contraseña del propietario** ni permite su inicio
  de sesión sin servidor (Justice#8). La cuenta de demostración "test" se mantiene por
  decisión del propietario.

**Correcciones:**

| Corrección | App | Estado |
|---|---|---|
| 2FA que verifica de verdad, QR generado en el navegador, límite de intentos sin atajos, nombres de pacientes fuera de los logs | Dental | hecho, Robelt1971/DERR-Dental-System#5 |
| Modo desarrollo solo explícito, límite de intentos activo, telemetría privada, sin MRN en la auditoría | Medical | hecho, Robelt1971/DERR-Medical-System#10 |
| Cabeceras de seguridad, auditoría de cada guardado en el servidor, health sin errores internos, token del monitor por cabecera | Justice | hecho, Robelt1971/DERR-Justice-System#7 |
| Quitar el nombre del paciente en todo envío a Anthropic | Medical | hecho, Robelt1971/DERR-Medical-System#12. La IA está inactiva en producción (ver arriba) |
| Respaldos cifrados con llave propia, sin secretos de usuarios, copia al destino que elija la institución | Dental | hecho, Robelt1971/DERR-Dental-System#6. Copia externa pendiente de configurar |
| Diseño de copia en el navegador más sincronización con el servidor | Medical | 16 de 19 pasos fusionados del todo, 2 en parte (15 y 16) y 1 pendiente (17), `DERR-Medical-Diseno-Sincronizacion.md` §6 |
| Quitar hashes del propietario del navegador en Justice; un intento de contraseña de propietario por conexión | Las tres | hecho: Robelt1971/DERR-Justice-System#8, Robelt1971/DERR-Medical-System#13, Robelt1971/DERR-Dental-System#7 |
| Acceso entre compañeros (médicos, dentistas, psicólogos, enfermería) y agenda completa para enfermería | Medical | hecho, Robelt1971/DERR-Medical-System#11 |
| 2FA obligatorio para todo el personal y contraseña propia, controlados en el servidor | Dental | hecho, commit `d618866` en Robelt1971/DERR-Dental-System (2026-10-10) |
| Contexto de RLS en cada petición | Medical | hecho, Robelt1971/DERR-Medical-System#14 |
| Rol de base de datos `derrms_app` sin bypass de RLS | Medical | fusionado, pendiente de activar (`DB_APP_ROLE_PASSWORD`), Robelt1971/DERR-Medical-System#19 |
| Nada en claro en el navegador; aviso si falla el cifrado | Medical | hecho, Robelt1971/DERR-Medical-System#16 |
| Registro de colecciones y control en CI; carpeta protegida con todas las claves de pacientes | Medical | hecho, Robelt1971/DERR-Medical-System#15 |
| Matriz de roles aplicada en el servidor; permisos del propietario guardados en el servidor y auditados | Medical | hecho, Robelt1971/DERR-Medical-System#21 y #30 |
| Registro de accesos con cadena de hashes que falla cerrado | Medical | Robelt1971/DERR-Medical-System#17. Activo al desplegar en las rutas antiguas con datos de pacientes y en la bóveda (#35, #38); en la sincronización, cuando se encienda |
| Cifrado del servidor versión 2 con llave por institución | Medical | fusionado, pendiente de activar (`CRYPTO_WRITE_VERSION=v2`), Robelt1971/DERR-Medical-System#22 |
| Sesión dentro de Justice, cierre de sesión real, sincronización de compras | Medical | hecho, Robelt1971/DERR-Medical-System#18. El cierre de sesión sin servidor se corrigió en #41 |
| Respaldo completo cifrado al destino S3 de la institución, con verificación, retención y prueba de restauración | Medical | fusionado, pendiente de activar (`BACKUP_TARGET`, `BACKUP_ENCRYPTION_KEY`), Robelt1971/DERR-Medical-System#25 |
| Logs del servidor en Railway, sin ruta de Windows y sin datos de pacientes | Medical | hecho, Robelt1971/DERR-Medical-System#26 y #29 |
| Sincronización: tablas con RLS forzado, rutas, cola en el navegador, motor en modo sombra, panel de conflictos con escalado a 48 h, identificadores seudónimos | Medical | fusionado, apagado por defecto en cada institución: Robelt1971/DERR-Medical-System#20, #23, #24, #28, #27, #31 |
| Sincronización: subida de los datos que ya hay en cada PC (zona de espera, duplicados, verificación) y modo bidireccional que aplica en el PC los cambios de los demás | Medical | fusionado, apagado por defecto: Robelt1971/DERR-Medical-System#37 y #39 |
| 2FA obligatoria para propietario y administrador sin atajos; códigos no reutilizables | Medical | activo al desplegar, Robelt1971/DERR-Medical-System#32 y #42 |
| Rutas antiguas con datos de pacientes bajo RLS y con registro de accesos que falla cerrado | Medical | registro activo al desplegar; RLS real con `DB_APP_ROLE_PASSWORD`, Robelt1971/DERR-Medical-System#35 |
| Psicología, psiquiatría, fisioterapia y optometría eligen al paciente y guardan su MRN; página para vincular registros antiguos | Medical | activo al desplegar, Robelt1971/DERR-Medical-System#33 |
| Bóveda local: llave por PC envuelta con la contraseña y con una llave de recuperación; entrada sin conexión; bloqueo de pantalla | Medical | activo al desplegar, Robelt1971/DERR-Medical-System#34, #38 y #41 |
| Volver a cifrar los datos locales con la llave del PC | Medical | fusionado, pendiente de activar (`vault_mode = encrypt`), Robelt1971/DERR-Medical-System#40 |
| PCs compartidos, primera parte: aviso de trabajo pendiente al cerrar sesión, lista de PCs con conteos, reglas de borrado seguro (sin borrar nada) | Medical | aviso: activo al desplegar; lista de PCs: con la sincronización, Robelt1971/DERR-Medical-System#36 |
| CSP de Justice que bloquea | Justice | fusionado, pendiente de activar (`CSP_ENFORCE=true`), Robelt1971/DERR-Justice-System#9 |

**Decisiones del propietario (2026-10-08):**

- **Medical:** la historia clínica se guarda en el navegador para trabajar sin conexión **y** se sincroniza con el servidor.
- **Justice:** la cuenta de demostración "test" se mantiene.
- **Respaldos:** cada institución decide al contratar dónde se guardan. Se concreta en la
  ficha `DERR-Ficha-Opciones-Institucion.md`, que se firma con el contrato.
- **IA de Medical:** siempre se quita el nombre del paciente antes de enviar a Anthropic.
- **Llave de cifrado (opción A):** la llave se guarda en la configuración del servidor,
  separada de la base de datos. La política lo dice así, sin prometer que el proveedor no
  pueda acceder. La llave en un servicio aparte queda como opción de pago en la ficha.
- **Contraseña de propietario:** se quitan sus hashes del código de Justice que descarga el
  navegador, y en las tres apps se permite **un solo intento** por conexión cada 15 minutos.
  Aplicado en las tres (Justice#8, Medical#13, Dental#7): tras un intento fallido, esa
  dirección IP queda bloqueada 15 minutos para el inicio del propietario. El bloqueo vive
  en la memoria del servidor; un reinicio lo borra.

**Decisiones del propietario sobre los pasos 15, 16 y 17 (2026-10-11 y 2026-10-12):**

El detalle está en `DERR-Medical-Pasos-15-16-Vinculos.md`, sección 6. En resumen, y qué hay
construido de cada una:

| Decisión | Construido |
|---|---|
| A1 una llave por PC, una envoltura por usuario; A2 llave nueva (PBKDF2 600 000) y volver a cifrar, conservando la actual | Sí (#38, #40). Volver a cifrar está apagado por defecto |
| A3 borrar la llave antigua de cada PC cuando esté migrado, verificado y sin trabajo pendiente | No (paso 15d, en desarrollo) |
| A4 entrar sin conexión sin 2FA; A5 máximo 7 días; A6 12 caracteres o más; A7 llave de recuperación por PC en el servidor, registrada | Sí (#38) |
| A9 un administrador puede restablecer la contraseña de un usuario | No (en desarrollo) |
| B1 bloqueo de pantalla a los 15 minutos en PCs compartidos | Sí (#38) |
| B2 borrar tras 30 días sin uso con `shared_persist`; B3 ningún borrado hasta que la sincronización en ambos sentidos sea real y el PC esté verificado | La regla de B3 está en el código y hoy impide todo borrado (#36). El borrado no está construido |
| B4 un administrador envía el trabajo pendiente de otro usuario, registrado | No (en desarrollo) |
| B5 `shared_persist` por defecto hasta el piloto en KIA | Sí: es el valor por defecto (migración 017) |
| C1 psicología, psiquiatría, fisioterapia y optometría eligen al paciente y guardan el MRN | Sí (#33) |
| Paso 17: los `.enc` dejan de escribirse 90 días después de activar la sincronización en ambos sentidos | No (en desarrollo) |

Sin responder: A8 (portal de pacientes con la bóveda activa; por eso `vault_mode` sigue en
`off`), B6 (plazo para trabajar sin conexión dentro de Justice), C4 (quién confirma los
vínculos dudosos) y C7 (quién ve "Vincular registros"). Para C4 y C7 el código aplica por
ahora a quien escribe en cada sección, más administrador y propietario.

**Pendiente del propietario (2026-10-12):**

Nada de lo fusionado protege en producción hasta que se despliegue. Después, lo que está
"pendiente de activar" necesita además una de estas acciones.

Variables en Railway, en el servicio de cada app (no en el de Postgres):

- Medical, `DB_APP_ROLE_PASSWORD` (24 caracteres o más): activa el rol `derrms_app` y, con
  él, RLS real. Guía: `docs/runbooks/db-app-role.md` de DERR Medical.
- Medical, `CRYPTO_WRITE_VERSION=v2`: solo después de comprobar en producción que la
  versión 2 descifra bien.
- Medical, respaldos: `BACKUP_TARGET=s3`, `BACKUP_ENCRYPTION_KEY`,
  `BACKUP_ENCRYPTION_KEY_ID`, `BACKUP_S3_BUCKET`, `BACKUP_S3_ACCESS_KEY_ID`,
  `BACKUP_S3_SECRET_ACCESS_KEY`, y `BACKUP_S3_ENDPOINT` / `BACKUP_S3_REGION` según el
  proveedor. Guía: `docs/runbooks/backup-restore.md`.
- Dental, respaldos: `BACKUP_ENCRYPTION_KEY` propia (sin ella se usa una llave derivada de
  la principal) y `BACKUP_S3_*` para la copia externa.
- Justice, `CSP_ENFORCE=true`: después de revisar en modo informe que la CSP no bloquea nada
  legítimo. Guía: `docs/csp-enforce.md` de DERR Justice.
- Confirmar si `REQUEST_SIGNING_SECRET` está definida en Medical.

Interruptores de cada institución en Medical (Administración → Configuración, propietario o
administrador; cada cambio queda en el registro de accesos):

- `sync_mode`: `off` (por defecto) → `shadow` → `bidirectional`. Antes, `DB_APP_ROLE_PASSWORD`
  activado, y para el modo bidireccional, cada PC subido y verificado (paso 13).
- `vault_mode`: `off` (por defecto), `wrap` o `encrypt`. El servidor rechaza `encrypt` si la
  sincronización está apagada o si algún PC activo tiene una versión anterior a la bóveda.
  Esperar a la respuesta A8.
- La fecha de fin de escritura de los `.enc` se cuenta desde el día en que la institución pase
  a `bidirectional`.

Decisiones abiertas:

- **Respaldos con o sin credenciales.** El de Medical incluye usuarios, hashes de
  contraseñas, secretos 2FA y sesiones, como un volcado completo; el de Dental los quita.
- **Sincronización:** límite de peticiones propio (hoy 100 por minuto por IP; varios PCs de
  KIA detrás de una misma salida a internet lo alcanzan) y límite de 512 KB por registro,
  que rechaza registros con imágenes incrustadas.
- **IA de Medical:** activarla exige arreglar el envío del token de sesión, poner
  `ANTHROPIC_API_KEY`, firmar el DPA con Anthropic y que cada institución la elija en la ficha.
- **Modo de autenticación de Dental.**
- **Política de PCs compartidos de KIA** (`personal`, `shared_persist` o `shared_wipe`),
  después del piloto.

---

## 2. Compromisos contractuales

- **Contrato de encargado de tratamiento** entre DERR y cada institución, con
  ley aplicable y tribunales de Aruba. La institución es responsable del dato;
  DERR solo lo trata por instrucción suya.
- **Acuerdos de tratamiento de datos (DPA) con Railway y Cloudflare.** Ambos
  ofrecen un DPA estándar con cláusulas contractuales tipo de la UE. Firmarlos
  y mencionar en la política que existen y que la institución puede pedir copia.
- **Lista pública de subencargados** (Railway, Cloudflare y cualquier otro),
  con aviso previo a la institución si cambia.
- **Certificaciones de los proveedores.** Cloudflare: SOC 2, ISO 27001,
  ISO 27701. Railway publica su estado SOC 2; confirmar el estado vigente
  antes de citarlo y adjuntar los informes a la oferta comercial.
- **Plazos concretos:** notificación de incidentes a la institución en 72 horas
  como máximo, devolución y borrado certificado de los datos al terminar el
  contrato, derecho de la institución a auditar.
- **Revisión legal local.** Aruba tiene su propia ordenanza de registro de
  datos personales (Landsverordening persoonsregistratie), que no es el GDPR.
  Un abogado en Aruba debe confirmar qué exige para transferencias al exterior
  y para datos médicos y de personas privadas de libertad, antes de vender a
  una entidad de Gobierno.

---

## 3. Opción de despliegue local

Para DERR Justice en particular es probable que el Ministerio de Justicia o
KIA exijan que los datos no salgan del país o queden bajo control
gubernamental. Ofrecer una modalidad de instalación en servidores de la
institución o en un centro de datos en Aruba, con el mismo software. Aunque
cueste más, tener la opción en la lista de precios elimina la objeción de
plano y hace que la nube parezca la alternativa razonable para quien sí la
acepta.

---

## 4. Texto propuesto para el apartado 6

> **Aviso (2026-10-08, revisado el 2026-10-11 y el 2026-10-12):** según §1.1 y §1.2, hoy
> **no son ciertas** estas frases del texto propuesto:
>
> - que Railway y Cloudflare actúan bajo acuerdos de tratamiento firmados: los DPA están
>   pendientes de firmar (`DERR-Subencargados.md`), y el estado SOC 2 de Railway está por
>   confirmar;
> - que todo se cifra en tránsito: el TLS verificado entre la app y la base de datos está
>   pendiente en las tres (§5, punto 5);
> - que los campos sensibles se cifran en las tres apps: Justice no cifra;
> - que la identidad se guarda separada: solo en la sincronización de Medical, que está
>   apagada por defecto;
> - que los respaldos van cifrados al destino que elige la institución: en Medical está
>   fusionado pero sin activar; en Dental la copia externa está sin configurar; Justice no
>   tiene.
>
> Los párrafos sobre los equipos de la institución y los terceros describen lo que hace el
> código, siempre que la versión fusionada esté desplegada (las dos frases añadidas el
> 2026-10-12 sobre Justice y el bloqueo de pantalla también). Falta decir que Dental y
> Justice guardan en el navegador una copia en claro, y que la institución todavía no puede
> elegir que la copia de Medical se borre al cerrar sesión (la opción se guarda, pero el
> borrado no está construido). Tampoco se puede decir todavía que la copia de Medical se
> abre con la contraseña de cada usuario: eso solo es cierto con `vault_mode = encrypt`.
> No publicar este texto hasta que §1.1 lo respalde.

```
6. Dónde se almacenan los datos y cómo se protegen

Las aplicaciones DERR Medical, DERR Dental y DERR Justice se alojan en la
infraestructura de Railway, en la región de Ámsterdam (Países Bajos), dentro
del Reino de los Países Bajos y bajo el régimen de protección de datos de la
Unión Europea. El sitio web, el dominio y el correo se gestionan mediante
Cloudflare. Ambos proveedores actúan como subencargados bajo acuerdos de
tratamiento de datos con cláusulas contractuales tipo, y cuentan con
certificaciones de seguridad independientes (SOC 2, ISO 27001) disponibles
a solicitud.

Los datos de pacientes y de personas detenidas se cifran en tránsito y en
reposo. Los campos sensibles se cifran además en la propia aplicación, con
una llave que se guarda separada de la base de datos. Los datos de identidad
se almacenan separados de los datos clínicos o judiciales.

DERR Medical guarda además una copia cifrada de la historia clínica en el
navegador de los equipos de la institución, para poder trabajar sin conexión.
La copia que se usa dentro de DERR Justice es distinta de la que se usa al
abrir DERR Medical directamente. En los equipos compartidos, DERR Medical
bloquea la pantalla tras 15 minutos sin uso.

Algunas funciones envían datos fuera de la aplicación: la inteligencia
artificial clínica de DERR Medical, cuando está activada, envía texto a
Anthropic (Estados Unidos) después de quitar el nombre del paciente, y el
dictado por voz del navegador Chrome envía el audio a Google.

Cada institución elige al contratar dónde se guardan sus copias de respaldo
cifradas, incluido un servidor propio en Aruba, puede auditar el tratamiento, es notificada de cualquier
incidente de seguridad en un plazo máximo de 72 horas y recibe la devolución
y el borrado certificado de sus datos al finalizar el contrato. La relación
se rige por un contrato de encargado de tratamiento sujeto a la legislación
y los tribunales de Aruba.

Para las instituciones que requieran que los datos permanezcan físicamente
en Aruba, DERR ofrece una modalidad de instalación en servidores propios de
la institución o en un centro de datos local.
```

---

## 5. Regla antes de publicar

Solo se publica cada frase cuando sea cierta. Si todavía no hay cifrado a nivel
de aplicación, región en Ámsterdam ni respaldo local, se implementa eso primero
y luego se actualiza la política. Una política que promete más de lo que hace
el sistema es peor que la actual en una auditoría.

Orden revisado tras la auditoría:

1. ~~Cambiar la región de Railway a Ámsterdam~~ (hecho el 2026-10-08).
2. Corregir los fallos de seguridad de §1.1. Hecho: 2FA de Dental, roles en el servidor de
   Medical, hashes del propietario en Justice, 2FA obligatoria de verdad en Medical
   (Medical#32, #42). La cuenta "test" de Justice se mantiene por decisión del propietario.
3. Borrar los datos del navegador al cerrar sesión y cifrar lo que quede en él. Medical,
   activo al desplegar: nada se guarda en claro, llave por PC protegida por la contraseña,
   bloqueo de pantalla. Pendiente de activar: volver a cifrar los datos con esa llave
   (`vault_mode`). En desarrollo: borrado en PCs compartidos y retirar la llave antigua
   (pasos 15d y 16). Dental y Justice sin empezar.
4. Respaldo cifrado fuera de Railway, con prueba de restauración. Medical: fusionado,
   pendiente de activar. Dental: cifrado, copia externa por configurar. Justice: sin empezar.
5. TLS verificado entre app y base de datos (pendiente en las tres), y cabeceras de
   seguridad en Justice (HSTS hecho, Justice#7; CSP que bloquea, pendiente de activar con
   `CSP_ENFORCE`, Justice#9).
6. Registro de auditoría con lecturas y cadena de hashes. Medical: activo al desplegar en
   las rutas antiguas con datos de pacientes (Medical#35) y listo para la sincronización.
   Dental y Justice: pendiente.
7. Cifrado de campos con llave fuera de Railway (pendiente), y seudonimización (Medical:
   fusionada en la sincronización, pendiente de activar).
8. Firmar los DPA de los subencargados y revisión legal en Aruba.
9. Publicar el nuevo apartado 6 y actualizar este documento.
