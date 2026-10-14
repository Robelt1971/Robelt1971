# DERR — Ficha de opciones de datos para cada institución

> Se rellena con la institución **antes de firmar** y se adjunta al contrato de encargado
> como Anexo D (`DERR-Contrato-Encargado-Tratamiento.md`). Cada respuesta cambia cómo se
> configura su instalación, así que no se deja ninguna en blanco.
> Fecha de la plantilla: 2026-10-08 · Revisada el 2026-10-11 (respaldos y equipos compartidos)

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

**Estado (2026-10-11).** En DERR Medical el respaldo ya existe en el código (Robelt1971/DERR-Medical-System#25):
copia diaria de **todas** las tablas del servidor a las 03:00 de Aruba, cifrada con una
llave propia distinta de la de los datos, enviada a un almacenamiento compatible con S3,
comprobada después de subirla y con herramienta de restauración. Está **lista, pendiente de
activar**: no funciona hasta que DERR configure el destino y la llave en el servidor. En
DERR Dental los respaldos se cifran y la copia externa a S3 está lista, pendiente de
configurar. DERR Justice no tiene respaldos propios todavía.

Límites que la institución debe conocer:

- El respaldo de Medical solo cubre lo que está en el servidor. Mientras la sincronización
  esté apagada, la historia clínica que vive en los navegadores no entra en él.
- Hoy un servidor envía todos sus respaldos a un solo destino. Para elegir un destino
  distinto por institución en un servidor compartido falta conectar el ajuste
  `backup_target` (en curso); con instalación local no hay ese límite.
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

**Estado (2026-10-11):** la elección ya se guarda, pero **todavía no se aplica**. El borrado
y el olvido de la llave al cerrar sesión están en curso (paso 16 del diseño de
sincronización). Hasta entonces, la copia sigue en el PC, cifrada, después de cerrar sesión.

| Opción | Qué implica | Elegida |
|---|---|---|
| **`personal`: conservar la copia local cifrada** | Permite trabajar sin conexión. Solo para PCs de uso personal | ☐ |
| **`shared_persist`: olvidar la llave al cerrar sesión** (por defecto) | La copia sigue cifrada en el PC y se borra tras [N] días sin uso | ☐ |
| **`shared_wipe`: borrar la copia local al cerrar sesión** | Recomendado si varias personas usan el mismo PC. También se borra al cerrarse por inactividad. Requiere conexión para volver a cargar los datos | ☐ |

En los tres casos, lo que no se haya enviado al servidor no se borra hasta que se envíe.
Para KIA la elección queda pendiente hasta después del piloto.

## 5. Funciones que envían datos a terceros

| Función | Opción | Elegida |
|---|---|---|
| **IA clínica** (DERR Medical, Anthropic, EE. UU.). Hoy inactiva en producción | Activada: se quita el nombre del paciente antes de enviar | ☐ |
| | IA local con modelo abierto (Qwen 3.5 o gpt-oss, Apache 2.0) en un servidor de la institución o de DERR: el texto clínico no sale de ese servidor. Pendiente de fusionar en Medical | ☐ |
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
