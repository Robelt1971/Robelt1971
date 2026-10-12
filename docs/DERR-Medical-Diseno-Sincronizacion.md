# DERR Medical — Diseño: copia en el navegador más sincronización con el servidor

> Decisión del propietario (2026-10-08): la historia clínica se guarda en el navegador para
> trabajar sin conexión **y** se sincroniza con el servidor.
> Este documento es el diseño previo a programar. Se hizo leyendo solo código y
> configuración, sin abrir datos reales.
> Estado: **En construcción. Respuestas del propietario del 2026-10-08 en la sección 8; las
> de los pasos 15, 16 y 17, en `DERR-Medical-Pasos-15-16-Vinculos.md`, sección 6.
> Al 2026-10-12 están fusionados del todo 16 de los 19 pasos, 2 en parte (15 y 16) y 1
> pendiente (17) (sección 6). La sincronización viene apagada en cada institución y solo se
> enciende con su interruptor (sección 9)**

## 0. Problemas actuales que condicionan el diseño

- **El almacén local guarda colecciones enteras, no registros.** Hay una sola tabla Dexie
  (`kv`, `src/services/database.js:78`); cada clave, por ejemplo `patients`, guarda todo el
  array como un único bloque cifrado. Las pantallas reescriben el array completo, así que la
  sincronización tiene que calcular las diferencias por registro dentro de la capa de base de
  datos.
- **La llave local apenas protege.** Se genera una vez y se guarda en la misma base de datos
  (`database.js:104`). Además, si el cifrado falla, `_writeCommitted` escribe **en claro**
  (`database.js:490-497`). *La escritura en claro está corregida (Medical#16). Desde
  Medical#38 cada PC tiene además una llave propia, guardada solo envuelta; volver a cifrar
  los datos con ella está fusionado pero apagado (Medical#40, `vault_mode`). La llave antigua
  sigue en la misma base de datos hasta el paso 15d.*
- **La llave de los archivos `.enc` la puede reconstruir cualquiera** (sal fija, parte del
  user agent y el origen; `external-storage.js:111,126`). Una actualización del navegador
  puede dejar los archivos ilegibles.
- **La lista de claves con datos de pacientes no coincide con las que usa el código**
  (`external-storage.js:42`). Faltan, entre otras, `intakeRecords`, `medical_orders`,
  `lab_results`, `imaging_studies`, `vaccine_records`, `referrals`. La mayor parte de los
  datos clínicos nunca llega a la capa protegida. *Corregido (Medical#15): la lista sale
  del registro `collections.ts`.*
- **La única sincronización existente (compras) nunca funciona:** envía cookies pero no el
  token que exige el servidor, recibe 401 y se queda en local sin avisar
  (`procurementServerSync.ts:17,29`). *Corregido (Medical#18).*
- **Dentro de DERR Justice los datos quedan separados.** El navegador aísla el
  almacenamiento de un iframe de otro sitio. En un mismo PC, lo que se registra en el
  Departamento Médico de Justice y lo que se registra en medical.derrgroup.com están en
  **almacenes distintos**. La migración tiene que recoger ambos.
- **Hay datos de pacientes en claro en localStorage**, fuera de la capa de base de datos:
  `pf_meal_<fecha>_<mrn>`, `derrms_emergency_log`, `derrms_ama_audit`. *Corregido
  (Medical#16): pasados a la capa cifrada.*

## 1. Inventario (claves dentro de `derrms` → `kv`)

| Tipo | Claves | Enlace con el paciente |
|---|---|---|
| Identidad | `patients` | `{id,name,firstName,lastName,dob,sex,nationality,dept,cell,status,admDate}` |
| Clínicos | `consultations`, `nurseTasks`, `intakeRecords`, `medical_orders`, `lab_results`, `imaging_studies`, `psychologyRecords`, `psychiatryRecords`, `dentalRecords`, `physioRecords`, `optometryRecords`, `nurseVitalsLog`, `vaccine_records`, `referrals`, `telehealth_*`, `derrms_triage_results`, `ewsLog`, `bcmaAuditLog`, `externalPrescriptions`, `patient_profile_*`, `intake_*`, `studentConsults` | Inconsistente: `patientId`, `mrn`, `patientMrn` o solo el nombre |
| Administrativos con paciente | `appointments`, `billing`, `billing_claims`, `eclaims`, `patient_messages`, `patient_balances`, `patient_comm_log`, `hipaa_consent`, `cvtComplaints`, `transport_requests`, `vip_patients`, `incidentReports` | variable |
| Auditoría | `audit_trail`, `hipaaLog`, `derrms_ama_audit`, `compliance_access_log` | solo agregar |
| Sistema | `meds`, `materials`, `staff`, `adm_*`, `iva_*`, `portal_*` | no son datos de pacientes |

## 2. Arquitectura propuesta

**Servidor: un almacén genérico de documentos cifrados, una fila por registro.** Hay más de
120 colecciones con formas que cambian con cada versión; tablas tipadas obligarían a decenas
de migraciones.

```
clinical_records(tenant_id, collection, record_id, subject_id, version, server_seq,
  payload_ct /* AES-GCM con AAD */, content_hash, created_by, updated_by, updated_at,
  deleted_at, deleted_by)
subjects(tenant_id, subject_id, identity_ct /* llave de identidad separada */, mrn_bidx)
sync_devices, record_conflicts, import_staging, data_access_log,
tenant_settings(sync_mode, local_cache_policy, backup_target)
```

- Un único registro compartido (`collections.ts`) clasifica cada clave como paciente,
  sistema o local, la asocia a una sección de permisos y marca sus campos de identidad. Un
  test de CI falla si el código usa una clave que no está registrada.
- **En el navegador:** dos almacenes nuevos, `outbox` (cambios pendientes) y `shadow` (última
  copia confirmada por el servidor). Cada guardado escribe el dato y su entrada de `outbox` en
  una sola transacción.
- **Protocolo:** `POST /api/sync/push` en lotes de hasta 200, con resultado por registro; el
  navegador borra una entrada pendiente solo cuando el servidor responde `ok`.
  `GET /api/sync/changes?since=<seq>` para traer cambios, incluidos los borrados.
  `GET /api/sync/manifest` para verificar. **No habrá un endpoint que devuelva la clínica
  entera de golpe.** El orden nunca depende del reloj de los PCs.
- **Conflictos entre dos PCs:** fusión campo a campo. Si los dos cambiaron el mismo campo,
  gana el servidor y el valor perdedor va a un panel de conflictos para que lo resuelva una
  persona. Nada se descarta en silencio.
- **Borrados:** marcas de borrado conservadas según la política de retención; borrar exige
  permiso completo.
- **Sin conexión:** la cola sobrevive a recargas y se envía al recuperar la red y cada 60 s.
- **Permisos:** cada registro se comprueba contra la matriz de roles; todas las consultas
  pasan por RLS con un rol de base de datos que no puede saltárselo.
- **Auditoría:** cada envío o lectura deja una fila en `data_access_log` en la misma
  transacción; si la auditoría falla, la operación falla.

## 3. Cifrado en el navegador

- Una llave de datos por usuario y por PC, guardada envuelta dos veces: con una llave
  derivada de la contraseña (PBKDF2, 600 000 iteraciones o más), que permite abrirla sin
  conexión, y con una llave del servidor, para recuperarla tras un cambio de contraseña.
- **Política por institución para PCs compartidos:**
  - `personal`: la copia local se conserva entre sesiones.
  - `shared_persist`: al cerrar sesión se olvida la llave; la copia se borra tras N días sin uso.
  - `shared_wipe` (propuesto por defecto para KIA): al cerrar sesión, al cerrarse por
    inactividad o al arrancar tras un cierre incorrecto, se borra la copia local.
- **Nunca se borra trabajo sin sincronizar:** si hay cambios pendientes, la copia sigue
  cifrada hasta que el mismo usuario, o un administrador, los envíe.
- Se elimina toda escritura en claro.

## 4. Migración de los datos existentes

1. **Inventario sin datos personales:** cada navegador informa cuántos registros tiene por
   colección. Así se sabe qué PCs guardan datos. El personal debe abrir la app en cada PC
   **directamente y dentro de Justice**.
2. **Subida en paralelo:** cada navegador sube todos sus registros, y lo que pueda importar de
   los `.enc`, a una zona de espera cifrada. **La base de datos local actual no se toca.**
3. **Eliminar duplicados:** mismos registros se unen; versiones distintas del mismo registro
   se guardan todas para revisión; pacientes posiblemente repetidos se **marcan, nunca se
   fusionan solos**. Un administrador aprueba el paso a producción.
4. **Verificación:** cada PC compara su inventario con el del servidor antes de darse por
   migrado.
5. **Activación por institución:** `off → shadow → bidireccional`, con interruptor por PC. Si
   algo falla, se vuelve a `off` y la copia local sigue siendo la válida.

## 5. Arreglos previos necesarios

- ~~El contexto de RLS se monta antes de la autenticación y nunca se rellena
  (`server/src/index.ts:139`).~~ Hecho (Medical#14).
- El rol de base de datos de Railway es superusuario y se salta RLS: crear un rol
  `derrms_app` sin ese privilegio. Hecho (Medical#19), **pendiente de activar** con
  `DB_APP_ROLE_PASSWORD`.
- ~~Aplicar la matriz de roles (`requireAccess`) en las rutas.~~ Hecho (Medical#21); los
  permisos del propietario se guardan en el servidor (Medical#30).
- Versionar el cifrado del servidor: identificador de llave, AAD y llave por institución.
  Hecho (Medical#22), **pendiente de activar** con `CRYPTO_WRITE_VERSION=v2`; la
  sincronización ya usa siempre la versión 2.
- ~~Un cliente de API común con el token y la renovación de sesión; arreglar compras; cookie
  `Partitioned` para que la sesión sobreviva dentro del iframe de Justice.~~ Hecho
  (Medical#18). La IA todavía no usa ese cliente y recibe 401.
- Los respaldos se guardan en el disco temporal de Railway y no incluyen las tablas
  clínicas. Sustituidos (Medical#25) por respaldos completos cifrados a S3, **pendientes de
  activar**. Los logs tampoco usan ya esa ruta (Medical#26, #29).

## 6. Plan por fases (pull requests independientes)

Cómo se lee el estado:

- **Activo al desplegar:** fusionado y sin interruptor; funciona en cuanto se despliega.
- **Fusionado, pendiente de activar:** en el código, apagado hasta poner una variable en
  Railway o encender el interruptor de la institución (`sync_mode`, `vault_mode`).
- **PR abierto** o **pendiente:** no fusionado. El 2026-10-12, el único pull request abierto
  en DERR Medical era el #43, que no es un paso de este plan.

No se comprobó qué versión está desplegada. Los enlaces son a `Robelt1971/DERR-Medical-System`.

| # | Cambio | Riesgo | Tamaño | Estado (2026-10-12) |
|---|---|---|---|---|
| 1 | Orden correcto del contexto RLS | bajo | S | activo al desplegar, [#14](https://github.com/Robelt1971/DERR-Medical-System/pull/14) |
| 2 | Quitar la escritura en claro; aviso si falla el cifrado | bajo | S | activo al desplegar, [#16](https://github.com/Robelt1971/DERR-Medical-System/pull/16) |
| 3 | Rol `derrms_app` sin bypass de RLS y separación de conexiones | medio (configuración de Railway) | M | fusionado, pendiente de activar (`DB_APP_ROLE_PASSWORD`), [#19](https://github.com/Robelt1971/DERR-Medical-System/pull/19); las rutas antiguas lo usan desde [#35](https://github.com/Robelt1971/DERR-Medical-System/pull/35) |
| 4 | Aplicar la matriz de roles en las rutas | medio (puede bloquear a usuarios) | S | activo al desplegar, [#21](https://github.com/Robelt1971/DERR-Medical-System/pull/21) y [#30](https://github.com/Robelt1971/DERR-Medical-System/pull/30) |
| 5 | Auditoría que falla cerrada y `data_access_log` | bajo | S | fusionado, [#17](https://github.com/Robelt1971/DERR-Medical-System/pull/17). Activo al desplegar en las rutas antiguas con datos de pacientes ([#35](https://github.com/Robelt1971/DERR-Medical-System/pull/35)) y en la bóveda; en la sincronización, cuando se encienda |
| 6 | Cifrado del servidor versión 2 | medio | M | fusionado, [#22](https://github.com/Robelt1971/DERR-Medical-System/pull/22); pendiente de activar para las tablas antiguas (`CRYPTO_WRITE_VERSION=v2`); siempre activo en sincronización, importación y bóveda |
| 7 | Cliente de API común, arreglo de compras, cookie particionada | bajo | S | activo al desplegar, [#18](https://github.com/Robelt1971/DERR-Medical-System/pull/18); cierre de sesión sin servidor corregido en [#41](https://github.com/Robelt1971/DERR-Medical-System/pull/41) |
| 8 | Tablas de sincronización con RLS | bajo | M | fusionado, [#20](https://github.com/Robelt1971/DERR-Medical-System/pull/20); vacías mientras `sync_mode = off` |
| 9 | Registro `collections.ts` y control en CI | bajo | S | activo al desplegar, [#15](https://github.com/Robelt1971/DERR-Medical-System/pull/15) |
| 10 | Rutas `/api/sync` en el servidor | alto | L | fusionado, pendiente de activar (`sync_mode`), [#24](https://github.com/Robelt1971/DERR-Medical-System/pull/24) |
| 11 | Diferencias y cola de envío en el navegador | medio | M | fusionado, pendiente de activar (`sync_mode`), [#23](https://github.com/Robelt1971/DERR-Medical-System/pull/23) |
| 12 | Motor de sincronización e indicador de estado | medio | M | fusionado, pendiente de activar (`sync_mode`), [#28](https://github.com/Robelt1971/DERR-Medical-System/pull/28); el modo bidireccional aplica los cambios de otros PCs desde [#39](https://github.com/Robelt1971/DERR-Medical-System/pull/39) |
| 13 | Subida de datos antiguos, zona de espera, duplicados, verificación | alto | L | fusionado, pendiente de activar (`sync_mode` y campaña abierta por un administrador), [#37](https://github.com/Robelt1971/DERR-Medical-System/pull/37) |
| 14 | Fusión por campos y panel de conflictos | medio | M | fusionado, pendiente de activar (`sync_mode`), [#27](https://github.com/Robelt1971/DERR-Medical-System/pull/27) |
| 15 | Bóveda local, llaves, apertura sin conexión | alto | L | **en parte.** 15a y 15b activos al desplegar ([#34](https://github.com/Robelt1971/DERR-Medical-System/pull/34), [#38](https://github.com/Robelt1971/DERR-Medical-System/pull/38)); 15c fusionado, pendiente de activar (`vault_mode`, [#40](https://github.com/Robelt1971/DERR-Medical-System/pull/40)); 15d pendiente |
| 16 | Políticas de PCs compartidos y borrado | alto | M | **en parte.** Primera parte fusionada ([#36](https://github.com/Robelt1971/DERR-Medical-System/pull/36)): aviso al cerrar sesión, reglas de borrado seguro sin borrar nada, lista de PCs (con la sincronización); bloqueo de pantalla activo al desplegar ([#38](https://github.com/Robelt1971/DERR-Medical-System/pull/38)). Segunda parte (borrado y envío por un administrador) pendiente |
| 17 | `.enc` solo importación; retirar su escritura | medio | S | pendiente. Plazo decidido: 90 días después de pasar a `bidirectional` |
| 18 | Exportar respaldos al destino de la institución | medio | M | fusionado, pendiente de activar (`BACKUP_TARGET`, `BACKUP_ENCRYPTION_KEY`, `BACKUP_S3_*`), [#25](https://github.com/Robelt1971/DERR-Medical-System/pull/25) |
| 19 | Seudonimización: identidad separada en `subjects` | medio | M | fusionado, pendiente de activar (`sync_mode`), [#31](https://github.com/Robelt1971/DERR-Medical-System/pull/31); los cuatro módulos que solo guardaban el nombre guardan el MRN desde [#33](https://github.com/Robelt1971/DERR-Medical-System/pull/33) |

Fuera del plan, también fusionados: 2FA obligatoria de verdad para propietario y
administrador ([#32](https://github.com/Robelt1971/DERR-Medical-System/pull/32)) y códigos
2FA no reutilizables ([#42](https://github.com/Robelt1971/DERR-Medical-System/pull/42)),
activos al desplegar.

## 7. Preguntas para el propietario

1. Los médicos tienen permiso `own` en consultas. ¿En el servidor un médico debe ver solo sus
   propias consultas? Aplicarlo tal cual ocultaría las notas de sus colegas.
2. ¿Hace falta poder **iniciar sesión** sin conexión al empezar el turno, o basta con seguir
   trabajando sin conexión tras entrar con conexión?
3. ¿Los PCs de KIA usan por defecto la política `shared_wipe`? ¿Qué roles tienen portátil
   personal?
4. ¿Quién resuelve los conflictos y los posibles pacientes duplicados?
5. ¿Cuánto tiempo se conservan los registros borrados y la auditoría? (Ley de Aruba.)
6. ¿Las citas (`appointments`) se tratan como datos de pacientes?
7. ¿El servidor puede guardar celda y departamento sin cifrar para las estadísticas?
8. ¿Está definida en producción la variable `REQUEST_SIGNING_SECRET`? (Sigue sin confirmar.)
9. ¿Se acepta una fecha límite para dejar de usar los archivos `.enc`?

Respondidas: 1, 2, 4 (en parte), 6 (sección 8); 2, 3 y 9 también en
`DERR-Medical-Pasos-15-16-Vinculos.md`, sección 6. Siguen abiertas: 5, 7 y 8.

## 8. Respuestas del propietario (2026-10-08) y propuestas

1. **Acceso entre compañeros:** médicos, dentistas, psicólogos y enfermeros ven y amplían
   los registros de todos sus compañeros de la misma institución, porque asumen sus
   pacientes cuando faltan. En DERR Dental ya era así por clínica. Los enfermeros también
   dan citas cuando falta la secretaria. Aplicado en Robelt1971/DERR-Medical-System#11.
   En el servidor, la sincronización usará `write` para estos roles, no `own`.
2. **Trabajo sin conexión:** deseado. Se diseña como en la sección 2: cada PC guarda su
   copia, envía cada cambio al servidor en cuanto hay red y recibe los cambios de los demás
   PCs cada pocos segundos. Propuesta: permitir seguir trabajando sin conexión después de un
   primer inicio de sesión con conexión en ese PC. El inicio de sesión sin conexión al
   empezar el turno solo es posible si ese usuario ya entró antes en ese PC y la política
   del PC no borra la copia local.
3. **Política de PCs en KIA:** pendiente hasta el piloto en KIA. Mientras tanto, por
   defecto `shared_persist`: al cerrar sesión se olvida la llave, la copia sigue cifrada y se
   borra tras N días sin uso. Se elige por institución en la ficha de opciones.
4. **Quién resuelve conflictos y duplicados.** Propuesta:
   - **Conflicto** (dos PCs cambiaron el mismo campo del mismo registro sin conexión): se
     guarda la versión que llegó primero al servidor y la otra no se pierde. Aparece un
     aviso al profesional que hizo el segundo cambio, que elige cuál queda o las combina.
     Si en 48 horas no lo resuelve, pasa al jefe del servicio: jefe médico, de enfermería o
     de psicología. Todo queda en la auditoría.
   - **Para reducir conflictos:** cuando alguien abre un registro que otra persona está
     editando, la app lo indica, por ejemplo "Dra. X está editando esta consulta".
   - **Paciente posiblemente duplicado** (mismo nombre y fecha de nacimiento, o mismo
     número de registro): nunca se fusiona solo. Lo revisa el personal de admisión o la
     secretaría, comparando cédula, fecha de nacimiento y foto. Al fusionar se conserva
     todo el historial de ambos, queda registrado y se puede deshacer.
5. **Citas:** son datos de pacientes. Se cifran, se sincronizan con permisos y se auditan
   como el resto. Reclasificadas en `CLAUDE.md` en Robelt1971/DERR-Medical-System#11.

## 9. Estado de la implementación (2026-10-12)

**Qué hace por defecto la versión fusionada:** nada de la sincronización está encendido.
Cada institución tiene `sync_mode = off` mientras no exista su fila en `tenant_settings`;
con `off`, todas las rutas `/api/sync` y `/api/sync/import` responden 409 `SYNC_OFF` y no
escriben nada, y el navegador no abre su cola de cambios. El propietario o un
administrador lo cambia en Administración → Configuración.

Sí funcionan sin interruptor, en cuanto se despliega: la llave por PC, la entrada sin
conexión y el bloqueo de pantalla (15a, 15b); el aviso de trabajo pendiente al cerrar
sesión (16, primera parte); el vínculo por MRN en los cuatro módulos (#33); y el registro
de accesos en las rutas antiguas con datos de pacientes (#35).

**Qué queda por hacer o activar antes de encenderlo en una institución:**

- **Rol `derrms_app` activado** (`DB_APP_ROLE_PASSWORD`). Sin él, el servidor usa el usuario
  principal de Railway y RLS no protege nada.
- **Paso 13:** abrir la campaña de subida, que cada PC suba sus datos (directamente y dentro
  de Justice, en sus dos direcciones), revisar duplicados y variantes, promover y verificar.
  Un PC solo aplica cambios de otros en modo bidireccional si pasó esa verificación.
- **Paso 15:** `vault_mode = encrypt` exige la sincronización encendida y que todos los PCs
  activos tengan la versión con la bóveda; está pendiente la respuesta A8 (portal de
  pacientes). 15d (borrar la llave antigua) no está construido.
- **Paso 16, segunda parte:** el borrado en PCs compartidos y el envío del trabajo de otro
  usuario por un administrador no están construidos. Hoy nada se borra (`canWipe()` nunca lo
  permite).
- **Paso 17:** los `.enc` se siguen escribiendo.
- **Sin red al recargar:** la entrada sin conexión solo funciona en una pestaña ya abierta;
  la app no queda guardada para arrancar sin red.
- **Límites:** las peticiones de sincronización comparten el límite general de 100 por
  minuto por IP, que varios PCs de KIA detrás de una misma salida a internet alcanzan; un
  registro de más de 512 KB, por ejemplo con imágenes incrustadas, se rechaza. Ambos
  necesitan decisión del propietario.
- **Seudónimos (paso 19):** los registros antiguos de psicología, psiquiatría, fisioterapia y
  optometría que solo tienen el nombre no se enlazan con su paciente hasta que una persona
  los vincula en "Vincular registros". La llave de los seudónimos sale de
  `ENCRYPTION_MASTER_KEY`: esa variable no debe cambiarse nunca.
- **Conflictos (paso 14):** el aviso "Dra. X está editando esta consulta" no está hecho. Los
  conflictos sin resolver pasan a los administradores a las 48 horas
  (`SYNC_CONFLICT_ESCALATION_HOURS`); no hay todavía un reparto por servicio.

**Qué aprende el servidor cuando esté encendido:** un volcado de la base de datos sin
`ENCRYPTION_MASTER_KEY` no muestra MRN ni nombres, ni en identificadores, ni en índices, ni
en la auditoría, ni en los logs. El servidor en marcha sí ve el contenido al recibirlo, y
puede contar cuántos pacientes distintos hay y cuántos registros tiene cada uno.
