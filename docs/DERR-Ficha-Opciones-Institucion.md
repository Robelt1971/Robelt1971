# DERR — Ficha de opciones de datos para cada institución

> Se rellena con la institución **antes de firmar** y se adjunta al contrato de encargado
> como Anexo D (`DERR-Contrato-Encargado-Tratamiento.md`). Cada respuesta cambia cómo se
> configura su instalación, así que no se deja ninguna en blanco.
> Fecha de la plantilla: 2026-10-08 · Revisada el 2026-10-11 (respaldos y equipos compartidos)
> y el 2026-10-12 (equipos compartidos y ajustes de DERR Medical por institución, sección 5)

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

**Estado (2026-10-12, sin cambios desde el 2026-10-11).** En DERR Medical el respaldo ya existe en el código (Robelt1971/DERR-Medical-System#25):
copia diaria de **todas** las tablas del servidor a las 03:00 de Aruba, cifrada con una
llave propia distinta de la de los datos, enviada a un almacenamiento compatible con S3,
comprobada después de subirla y con herramienta de restauración. Está **fusionada, pendiente
de activar**: no funciona hasta que DERR la despliegue y configure el destino y la llave en
el servidor (`BACKUP_TARGET`, `BACKUP_ENCRYPTION_KEY`, `BACKUP_S3_*`). En
DERR Dental los respaldos se cifran y la copia externa a S3 está lista, pendiente de
configurar. DERR Justice no tiene respaldos propios todavía.

Límites que la institución debe conocer:

- El respaldo de Medical solo cubre lo que está en el servidor. Mientras la sincronización
  esté apagada, la historia clínica que vive en los navegadores no entra en él.
- Hoy un servidor envía todos sus respaldos a un solo destino, y ese destino se fija con
  variables del servidor. Para elegir un destino distinto por institución en un servidor
  compartido falta conectar el ajuste `backup_target` (pendiente, sin pull request); con
  instalación local no hay ese límite.
- El respaldo de Medical incluye las cuentas de usuario (hashes de contraseñas, secretos
  2FA). Está pendiente de decidir si se quitan, como ya hace Dental.

| Opción | Qué implica | Elegida |
|---|---|---|
| **Solo en la nube DERR** | Copias diarias en un almacenamiento compatible con S3 contratado por DERR, separado de la base de datos. No protege si cae el proveedor de DERR | ☐ |
| **Servidor propio de la institución en Aruba** | Copia diaria enviada a un servidor de la institución compatible con S3 (por ejemplo MinIO), publicado por HTTPS. La institución lo compra y lo mantiene | ☐ |
| **Almacenamiento en la nube de la institución** | Copia diaria a un bucket de la institución (AWS S3, Cloudflare R2, Backblaze B2 u otro compatible con S3), en la región que elija | ☐ |

- **Región del almacenamiento elegido:** [país / región]
- **Copias que se conservan:** [14 diarias por defecto / otro]
- **¿El servidor puede borrar copias viejas?** ☐ sí, borra las que pasan del número
  elegido ☐ no, las borra una regla del propio almacenamiento
- **Quién guarda la llave de los respaldos:** ☐ la institución (recomendado) ☐ DERR.
  Quien la guarda puede abrir los respaldos; sin ella nadie, tampoco DERR, puede
  recuperarlos. Se anota en el acta de entrega. Con instalación local, la institución pone
  su propia llave y DERR no necesita conocerla.
- **Prueba de restauración:** ☐ anual ☐ semestral. Se restaura una copia en una base de
  datos de prueba, se comparan los conteos de cada tabla con los del registro del respaldo
  y DERR entrega un acta firmada por ambos responsables, con el informe de la prueba (solo
  conteos, nunca datos).

## 3. Llave de cifrado de los datos

| Opción | Qué implica | Elegida |
|---|---|---|
| **Estándar** (incluida) | La llave está en la configuración del servidor de DERR, separada de la base de datos. Protege si se roba la base de datos o un respaldo | ☐ |
| **Llave en un servicio aparte** (opción de pago) | La llave vive en un servicio de llaves de otra empresa o en un servidor de la institución. El alojamiento solo ve datos cifrados. Si ese servicio cae, la app no puede leer los datos | ☐ |

## 4. Equipos compartidos

Se aplica a la copia de la historia clínica que DERR Medical guarda en el navegador. El
valor elegido se guarda en la configuración de la institución (`local_cache_policy`, en
Administración → Configuración).

**Estado (2026-10-12).** La elección se guarda y cada PC la conoce, también sin conexión.
De lo que implica cada opción, hoy funciona solo una parte:

- **Activo al desplegar la versión fusionada:** con `shared_persist` o `shared_wipe`, la
  pantalla se bloquea tras 15 minutos sin uso (no cierra la sesión ni pierde lo escrito, y
  la llave del PC se olvida de la memoria). Con `personal` no hay bloqueo. Al cerrar sesión,
  la app avisa si queda trabajo sin enviar.
- **En desarrollo:** el borrado de la copia local. Hoy nada se borra con ninguna opción. Por
  decisión del propietario, nada se borrará hasta que la sincronización en ambos sentidos
  funcione en la institución y el PC esté verificado.

| Opción | Qué implica | Elegida |
|---|---|---|
| **`personal`: conservar la copia local cifrada** | Permite trabajar sin conexión. Sin bloqueo de pantalla. Solo para PCs de uso personal | ☐ |
| **`shared_persist`: conservar la copia, cifrada** (por defecto) | Bloqueo de pantalla a los 15 minutos. Cerrar sesión, la inactividad o cerrar el navegador nunca borran nada. Un PC que nadie abre durante **30 días** se borra (cuando el borrado esté construido) | ☐ |
| **`shared_wipe`: borrar la copia local al cerrar sesión** | Recomendado si varias personas usan el mismo PC. Bloqueo de pantalla a los 15 minutos. El borrado al cerrar sesión está en desarrollo. Requiere conexión para volver a cargar los datos | ☐ |

En los tres casos, lo que no se haya enviado al servidor no se borra hasta que se envíe.
Para KIA se usa `shared_persist` hasta después del piloto.

Dentro de DERR Justice, cada dirección de Justice guarda una copia aparte en el navegador.
Para la política, cada una cuenta como un PC distinto.

## 5. Ajustes de DERR Medical por institución

Ajustes que DERR Medical guarda por institución en el servidor. Los cambia el propietario o
un administrador en Administración → Configuración, y cada cambio queda en el registro de
accesos. Todo lo nuevo viene **apagado**. Se anota aquí el valor acordado para el arranque.

| Ajuste | Valores | Por defecto | Qué hace | Elegido |
|---|---|---|---|---|
| **Sincronización** (`sync_mode`) | `off`, `shadow` (copia en el servidor sin tocar los PCs), `bidirectional` (cada PC recibe además los cambios de los demás) | `off` | Con `off`, el servidor no guarda nada de la historia clínica de los navegadores. Antes de encenderla, DERR activa el rol de base de datos con RLS. En `bidirectional`, un PC solo aplica cambios de otros si pasó la verificación de su subida; cada PC puede desactivarlo para sí mismo | ☐ |
| **Política de PCs compartidos** (`local_cache_policy`) | `personal`, `shared_persist`, `shared_wipe` | `shared_persist` | Sección 4 | Sección 4 |
| **Cifrado de la copia local con la llave de cada PC** (`vault_mode`) | `off`, `wrap`, `encrypt` | `off` | Con `encrypt`, cada PC vuelve a cifrar su copia con su propia llave, que se abre con la contraseña de cada usuario. Exige la sincronización encendida y que todos los PCs tengan la versión nueva. Mientras esté activo, el portal de pacientes no puede leer la lista de pacientes de un PC hasta que alguien del personal lo abra (pregunta A8, sin responder) | ☐ |
| **Subida de los datos que ya hay en cada PC** | Campaña abierta o cerrada | Cerrada | La abre el propietario o un administrador. Cada usuario sube su PC a mano; los duplicados de pacientes nunca se fusionan solos | [fecha] |
| **Fin de los archivos `.enc`** | Fecha | 90 días después de pasar a `bidirectional` | Después solo sirven para importar (en desarrollo) | [fecha] |

Valores fijos para todas las instituciones (decisiones del propietario, no se eligen aquí):

- **Bloqueo de pantalla:** 15 minutos sin uso, en PCs `shared_persist` y `shared_wipe`.
- **Entrada sin conexión:** solo quien ya entró con conexión en ese PC, con contraseña de
  **12 caracteres o más**, como máximo **7 días** desde su última entrada con conexión en ese
  PC, y sin 2FA. Con contraseñas más cortas todo funciona, pero solo con conexión.
- **2FA:** obligatoria para propietario y administrador. Para otros roles se puede exigir por
  institución y rol; hoy se marca en la base de datos, sin pantalla.
- **Conflictos sin resolver:** pasan a los administradores a las 48 horas. Es un ajuste del
  servidor (`SYNC_CONFLICT_ESCALATION_HOURS`), igual para todas las instituciones del mismo
  servidor.

Ajustes del servidor que pone DERR (una instalación = un valor para todas sus
instituciones): rol de base de datos con RLS (`DB_APP_ROLE_PASSWORD`), cifrado versión 2
de las tablas antiguas (`CRYPTO_WRITE_VERSION`) y respaldos (sección 2).

## 6. Funciones que envían datos a terceros

| Función | Opción | Elegida |
|---|---|---|
| **IA clínica** (DERR Medical, Anthropic, EE. UU.). Hoy inactiva en producción | Activada: se quita el nombre del paciente antes de enviar | ☐ |
| | Desactivada | ☐ |
| **Dictado por voz** | Navegador Chrome (el audio pasa por Google) | ☐ |
| | Dictado local, sin enviar audio fuera (cuando esté disponible) | ☐ |
| | Desactivado | ☐ |
| **Alertas de seguridad** | Correo y WhatsApp al responsable de DERR (IP y usuario) | ☐ |
| | Solo correo | ☐ |

## 7. Fin del contrato

- **Formato de entrega de los datos:** ☐ JSON ☐ CSV ☐ otro: [ ]
- **Plazo de conservación de historias clínicas o expedientes exigido por la ley** (lo confirma la institución): [años]

---

**Firmas**

Por la institución: ____________________ Por DERR: ____________________
