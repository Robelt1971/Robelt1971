# DERR — Política de privacidad, apartado 6: dónde se almacenan los datos y cómo se protegen

> Propuesta de redacción y plan de medidas que la respaldan.
> Fecha: 2026-10-07 · Actualizado: 2026-10-08 con la auditoría del código de las tres apps;
> 2026-10-11 con lo fusionado en DERR Medical (pull requests #14 a #31) y en Dental y Justice
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
| Cifrado de campos sensibles en la aplicación, con la llave separada de la base de datos (opción A; llave en servicio aparte como opción de pago) | Railway solo guarda texto cifrado. Responde al argumento CLOUD Act: el proveedor podría entregar datos, pero ilegibles | parcial: Medical y Dental cifran algunos campos, con la llave en Railway; Justice no cifra nada. En Medical, el cifrado con llave por institución está **listo, pendiente de activar** (§1.1) |
| Región Railway **EU West (Ámsterdam)** para servicio, base de datos y volúmenes | Datos dentro del Reino de los Países Bajos, bajo régimen GDPR, en vez de California. Cambio de configuración, no de código | hecho (2026-10-08) |
| Seudonimización: tabla de identidad separada de la tabla clínica o judicial, enlazadas por identificador interno | Un acceso indebido a una tabla no revela a quién pertenece el dato | Medical: **lista, pendiente de activar**, solo para los datos sincronizados. Dental y Justice: no (§1.1) |
| Copia de respaldo cifrada periódica en el destino que elija la institución al contratar (su servidor en Aruba, su nube o la nube DERR) | "¿Y si Railway desaparece o nos corta el servicio?" | Medical: **lista, pendiente de activar**. Dental: cifrada, copia externa por configurar. Justice: no hay (§1.1) |
| Autenticación de dos factores, roles por perfil, registro inalterable de accesos, acceso administrativo de DERR limitado y registrado | Trazabilidad y mínimo privilegio | parcial: roles en el servidor ya en las tres apps; en Medical el registro inalterable y el rol de base de datos sin privilegios están **listos, pendientes de activar** (§1.1) |
| TLS en todo el recorrido, incluido aplicación ↔ base de datos dentro de Railway | Cifrado en tránsito | parcial: navegador ↔ app sí; app ↔ base de datos sin TLS o sin verificar certificado (§1.1) |

### 1.1 Estado verificado por aplicación (auditoría del código, 2026-10-08; actualizado el 2026-10-11)

Auditoría de solo lectura del código y la configuración de las tres apps. No se abrió
ningún dato real. La actualización del 2026-10-11 se hizo leyendo el código y el
historial de los pull requests fusionados; no se comprobó la configuración de Railway.

Cómo se lee el estado:

- **Implementado:** fusionado y activo por defecto en producción.
- **Listo, pendiente de activar:** fusionado, pero apagado hasta que se ponga una variable
  en Railway o el propietario lo active.
- **En curso:** todavía no está hecho.

"Medical#N" es el pull request N de `Robelt1971/DERR-Medical-System`; igual para Dental y
Justice.

| Medida | DERR Medical | DERR Dental | DERR Justice |
|---|---|---|---|
| Cifrado de campos en el servidor | Parcial. AES-256-GCM en nombre, MRN, fecha de nacimiento, diagnóstico y notas. Sin cifrar: celda, departamento, archivos subidos. Versión 2, con una llave por institución y cada valor atado a su institución, tabla, columna y fila: **lista, pendiente de activar** (`CRYPTO_WRITE_VERSION`, Medical#22). Los datos de sincronización usan siempre la versión 2 | Parcial. AES-256-GCM en historia clínica y formulario de ingreso. Sin cifrar: nombre, cédula, fecha de nacimiento, contacto, notas de citas, recetas, archivos subidos | No hay. Todo se guarda en claro |
| Dónde está la llave | Variable de entorno en Railway. En la versión 2, la llave de cada institución se guarda en la base de datos envuelta con una llave derivada de la de Railway | Variable de entorno en Railway | No aplica |
| Rotación de llave | Versión 2: se puede rotar la llave de una institución (sin pantalla todavía). La llave principal no debe cambiarse nunca: de ella dependen los datos actuales y los seudónimos | No | No aplica |
| Datos en el navegador | **La mayor parte de la historia clínica vive solo en el navegador** (IndexedDB), cifrada con una llave guardada en el mismo navegador. **Implementado:** si el cifrado falla, ya no se guarda nada en claro; aparece un aviso y se reintenta (Medical#16). **En curso:** llave protegida por la contraseña y borrado al cerrar sesión | Copia completa de la clínica en claro en el navegador; no se borra al cerrar sesión | Expedientes completos, con fotos y huellas, en claro en el navegador; no se borran al cerrar sesión |
| Seudonimización | Las tablas antiguas siguen repitiendo el nombre. En la sincronización, ningún MRN ni nombre llega al servidor como identificador, y la identidad se guarda cifrada aparte: **lista, pendiente de activar** (Medical#31) | No | No |
| Respaldo | Respaldo de **todas** las tablas del servidor, cifrado con una llave propia, enviado a un almacenamiento compatible con S3, verificado y con herramienta de restauración (Medical#25): **listo, pendiente de activar** (`BACKUP_TARGET`, `BACKUP_ENCRYPTION_KEY`). El respaldo antiguo se retiró, así que hoy solo existen los que ofrezca Railway. No incluye la historia clínica que vive solo en los navegadores | Diario, 14 copias, dentro de la misma base de datos. Desde Dental#6, cifrado (con llave propia si se define `BACKUP_ENCRYPTION_KEY`; si no, con una derivada de la principal) y sin contraseñas ni secretos 2FA; copia externa a S3 **lista, pendiente de configurar** | No hay, salvo los respaldos que ofrece Railway |
| 2FA | Obligatorio para propietario y administrador, pero se salta si aún no tienen secreto | Corregido (Dental#5): verifica de verdad y el QR se genera en el navegador. Obligatorio para todo el personal, controlado en el servidor (2026-10-10, commit `d618866`, sin pull request) | No hay |
| Roles (RBAC) | **Implementado:** la matriz del navegador y la del servidor son idénticas y un test lo comprueba; se aplica en las rutas que solo pedían sesión (Medical#21). Los permisos personalizados del propietario se guardan en el servidor, valen en todos los PCs y cada cambio queda auditado (Medical#30). Falta controlar por sección la ruta de IA | Sí, en el servidor | Sí, en el servidor |
| Aislamiento por fila (RLS) | El contexto ya se rellena en cada petición (Medical#14). El rol de base de datos `derrms_app`, que no puede saltarse RLS, está **listo, pendiente de activar** (`DB_APP_ROLE_PASSWORD`, Medical#19). Hasta entonces el usuario de Railway es superusuario y se salta RLS. Aun activado, solo lo usan la sincronización y las rutas nuevas | Definido; varias rutas lo saltan | No hay |
| Registro de auditoría | Solo agregable; sus fallos ya no se ocultan. Nuevo registro de accesos con cadena de hashes, que nadie puede editar ni borrar y que hace fallar la operación si no se escribe (Medical#17): solo lo escriben las rutas de sincronización, así que está **listo, pendiente de activar**. Las rutas antiguas siguen sin registrar lecturas | Bloquea edición al rol de la app, sin cadena de hashes; no registra lecturas de historias clínicas | Editable; los cambios los informa el navegador y pueden falsificarse; no registra lecturas |
| Sesión | **Implementado:** la sesión funciona dentro del iframe de Justice (cookie particionada) y cerrar sesión la revoca en el servidor (Medical#18) | Sin revisar en esta actualización | Sin revisar en esta actualización |
| Registros del servidor (logs) | **Implementado:** van a la salida de Railway, sin la ruta de Windows; búsquedas, nombres, MRN e identificadores se enmascaran (Medical#26, Medical#29) | Sin revisar en esta actualización | Sin revisar en esta actualización |
| TLS app ↔ base de datos | Activado por defecto, depende de variables en Railway | Sin configurar | Desactivado en la red interna; sin verificar certificado en la pública |
| Cabeceras de seguridad (HSTS, CSP) | Sí | Sí | Desde Justice#7: HSTS sí; la CSP completa solo en modo informe, sin bloquear |

**Otros hallazgos que afectan a la política:**

- **Terceros que reciben datos.** Medical envía texto clínico a la API de Anthropic
  (Estados Unidos) desde las funciones de IA. Desde Medical#12 todas las llamadas pasan por
  un único punto que quita el nombre del paciente y no envía nada si no puede quitarlo; los
  documentos con imagen piden confirmación. **Hoy la IA no funciona en producción:** el
  navegador llama al servidor sin el token de sesión y recibe 401
  (`src/services/claudeClient.ts`), así que Anthropic no recibe nada. Dental usa el
  reconocimiento de voz del navegador, que en Chrome envía el audio a Google. Las alertas de
  seguridad de las tres apps envían IP y usuarios a Resend y a una pasarela de WhatsApp. La
  lista completa está en `DERR-Subencargados.md`.
- **Medical guarda la historia clínica en los equipos de la institución,** no en Railway.
  Eso significa que gran parte de los datos ya está físicamente en Aruba, pero protegida
  solo por la seguridad de cada equipo. Mientras la sincronización esté apagada, esos datos
  no están en el servidor ni en sus respaldos.
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
| Diseño de copia en el navegador más sincronización con el servidor | Medical | diseño listo y 15 de 19 pasos fusionados, `DERR-Medical-Diseno-Sincronizacion.md` |
| Quitar hashes del propietario del navegador en Justice; un intento de contraseña de propietario por conexión | Las tres | hecho: Robelt1971/DERR-Justice-System#8, Robelt1971/DERR-Medical-System#13, Robelt1971/DERR-Dental-System#7 |
| Acceso entre compañeros (médicos, dentistas, psicólogos, enfermería) y agenda completa para enfermería | Medical | hecho, Robelt1971/DERR-Medical-System#11 |
| 2FA obligatorio para todo el personal y contraseña propia, controlados en el servidor | Dental | hecho, commit `d618866` en Robelt1971/DERR-Dental-System (2026-10-10) |
| Contexto de RLS en cada petición | Medical | hecho, Robelt1971/DERR-Medical-System#14 |
| Rol de base de datos `derrms_app` sin bypass de RLS | Medical | listo, pendiente de activar (`DB_APP_ROLE_PASSWORD`), Robelt1971/DERR-Medical-System#19 |
| Nada en claro en el navegador; aviso si falla el cifrado | Medical | hecho, Robelt1971/DERR-Medical-System#16 |
| Registro de colecciones y control en CI; carpeta protegida con todas las claves de pacientes | Medical | hecho, Robelt1971/DERR-Medical-System#15 |
| Matriz de roles aplicada en el servidor; permisos del propietario guardados en el servidor y auditados | Medical | hecho, Robelt1971/DERR-Medical-System#21 y #30 |
| Registro de accesos con cadena de hashes que falla cerrado | Medical | listo; se activa con la sincronización, Robelt1971/DERR-Medical-System#17 |
| Cifrado del servidor versión 2 con llave por institución | Medical | listo, pendiente de activar (`CRYPTO_WRITE_VERSION=v2`), Robelt1971/DERR-Medical-System#22 |
| Sesión dentro de Justice, cierre de sesión real, sincronización de compras | Medical | hecho, Robelt1971/DERR-Medical-System#18 |
| Respaldo completo cifrado al destino S3 de la institución, con verificación, retención y prueba de restauración | Medical | listo, pendiente de activar (`BACKUP_TARGET`, `BACKUP_ENCRYPTION_KEY`), Robelt1971/DERR-Medical-System#25 |
| Logs del servidor en Railway, sin ruta de Windows y sin datos de pacientes | Medical | hecho, Robelt1971/DERR-Medical-System#26 y #29 |
| Sincronización: tablas con RLS forzado, rutas, cola en el navegador, motor en modo sombra, panel de conflictos con escalado a 48 h, identificadores seudónimos | Medical | listo, apagado por defecto en cada institución: Robelt1971/DERR-Medical-System#20, #23, #24, #28, #27, #31 |

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

**Pendiente del propietario (2026-10-11):**

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
- Confirmar si `REQUEST_SIGNING_SECRET` está definida en Medical.

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

> **Aviso (2026-10-08, revisado el 2026-10-11):** según §1.1, hoy **no son ciertas**
> estas frases del texto propuesto:
>
> - que los campos sensibles se cifran en las tres apps: Justice no cifra;
> - que la identidad se guarda separada: solo en la sincronización de Medical, que está
>   apagada;
> - que los respaldos van cifrados al destino que elige la institución: en Medical está
>   listo pero sin activar; en Dental la copia externa está sin configurar; Justice no
>   tiene.
>
> Los dos párrafos nuevos sobre los equipos de la institución y los terceros (añadidos el
> 2026-10-11) sí describen lo que hace el código. Falta decir que Dental y Justice guardan
> en el navegador una copia en claro, y que la institución todavía no puede elegir que
> la copia de Medical se borre al cerrar sesión (la opción se guarda, pero no se aplica).
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
   Medical, hashes del propietario en Justice. Queda: 2FA saltable en Medical. La cuenta
   "test" de Justice se mantiene por decisión del propietario.
3. Borrar los datos del navegador al cerrar sesión y cifrar lo que quede en él. Hecho en
   Medical: nada se guarda en claro. En curso: borrado al cerrar sesión y llave protegida
   por la contraseña (pasos 15 y 16 del diseño); Dental y Justice sin empezar.
4. Respaldo cifrado fuera de Railway, con prueba de restauración. Medical: listo, pendiente
   de activar. Dental: cifrado, copia externa por configurar. Justice: sin empezar.
5. TLS verificado entre app y base de datos (pendiente en las tres), y cabeceras de
   seguridad en Justice (hecho, Justice#7).
6. Registro de auditoría con lecturas y cadena de hashes. Medical: listo para la
   sincronización; las rutas antiguas siguen sin registrar lecturas.
7. Cifrado de campos con llave fuera de Railway (pendiente), y seudonimización (Medical:
   lista en la sincronización, pendiente de activar).
8. Firmar los DPA de los subencargados y revisión legal en Aruba.
9. Publicar el nuevo apartado 6 y actualizar este documento.
