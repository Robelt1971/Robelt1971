# DERR Medical — Pasos 15 y 16 y vínculo por número de registro (MRN)

> Propuesta para decidir **antes** de programar. Se hizo leyendo solo código y el historial de
> git (`origin/master`, commit `9dd7efb`), sin abrir datos reales.
> Estado: **respondida en parte.** Las respuestas del propietario están en la sección 6.

## 0. Resumen en una página

| Tema | Qué se propone | Tamaño | ¿Se puede hacer ya? |
|---|---|---|---|
| A. Paso 15: bóveda local y entrada sin conexión | Una llave nueva por PC, guardada "envuelta" con la contraseña de cada usuario y con una llave de recuperación en el servidor. Los datos se vuelven a cifrar poco a poco. **La llave actual no se toca ni se borra** hasta que usted lo apruebe por separado. | L (4 entregas) | Sí, por fases, una tras otra |
| B. Paso 16: PCs compartidos | Tres políticas (`personal`, `shared_persist`, `shared_wipe`). **Nunca se borra nada hasta que la sincronización en ambos sentidos funcione de verdad y el PC esté verificado.** | M | La mitad ya; la otra mitad después de A |
| C. Psicología, psiquiatría, fisioterapia y optometría vinculadas por MRN | Elegir al paciente de la lista (como en Odontología) y guardar el MRN junto al nombre. Los registros antiguos se vinculan solos solo si no hay duda; los demás los revisa una persona. | M | Sí, en paralelo, ya |

**Orden:** C puede empezar ya, sin esperar a nadie. En A, primero 15a y luego 15b → 15c → 15d.
La primera mitad de B (avisos, lectura de la política, la regla de "no borrar") va en paralelo con 15a/15b.
La segunda mitad (olvidar la llave, bloqueo, borrado) va después de 15b/15c y de que la sincronización en ambos sentidos aplique los cambios en el PC.

---

## 1. Tema A — Paso 15: bóveda local y entrada sin conexión

### 1.1 Cómo funciona hoy

- **La llave del navegador se crea sola** la primera vez que se abre la app en ese PC y se guarda **en la misma base de datos**, en una tabla interna `_meta`, con el nombre `_aes_key` (`src/services/database.js:69`, `:79-83`, `:170-187`).
  Se crea como "no exportable" (`database.js:180`): ningún programa puede copiarla fuera del navegador. **Pero cualquiera que abra ese navegador en ese PC puede usarla.**
- **Los datos se abren antes de iniciar sesión.** Al cargar la app, `init()` abre la base, toma la llave y descifra todo en memoria (`database.js:950-973`, se ejecuta al importar el módulo, `:1029`). El inicio de sesión solo oculta las pantallas; no protege los datos guardados en el PC.
- **Toda la base es una sola para todos los usuarios del PC.** Médico, enfermera y secretaria comparten la misma copia y la misma llave.
- **La cola de sincronización** (`derrms_sync`, `src/services/syncOutbox.ts:8-23`, `:239-246`) usa **la misma llave**, que le presta `database.js` (`database.js:242-256`). Ahí está el trabajo todavía no enviado, también cifrado con la llave actual.
- **`localPhiStore.ts`** no usa la llave directamente. Pasa por `DB` (`localPhiStore.ts:17`, `:72-80`). Lo que se haga en `database.js` lo cubre automáticamente.
- **Hoy no existe la entrada sin conexión.** El inicio de sesión siempre pregunta al servidor (`src/auth/AuthContext.tsx:250-303`). Sin red solo se puede seguir si se recarga una pestaña que ya tenía la sesión abierta (`AuthContext.tsx:212-234`). Una ventana nueva, o el navegador reiniciado sin red, no deja entrar.
- **El servidor exige doble factor (2FA)** al propietario y al administrador (`server/src/routes/auth.ts:254`). El cambio de contraseña existe y exige la contraseña actual (`auth.ts:700-779`). **No existe** una ruta para que un administrador restablezca la contraseña de otra persona; solo se crean contraseñas temporales al dar de alta (`server/src/routes/onboarding.ts:171-177`).
- **El portal de pacientes** lee la lista local de pacientes **antes** de que entre alguien del personal (`src/modules/patient-portal/PatientLogin.tsx:241`).

**Consecuencia importante:** la llave actual **no se puede "envolver"**. Para envolver una llave, el navegador exige que sea exportable, y la actual no lo es (`database.js:180`). Por eso no existe una opción que "envuelva la llave existente". Hay que crear una llave nueva y volver a cifrar los datos con ella.

### 1.2 Opciones

**Opción A1: llave nueva por PC + volver a cifrar poco a poco (recomendada).**
- Se crea **una llave de datos por PC** (en cada almacén: directo y dentro de Justice, ver 1.4).
- Se guarda **envuelta** dos veces:
  1. con la contraseña de **cada usuario** que entra en ese PC (PBKDF2, 600 000 vueltas, sal aleatoria), para abrirla sin conexión;
  2. con una **llave de recuperación de ese PC** que guarda el servidor, para recuperarla tras un cambio de contraseña.
- Los datos se vuelven a cifrar con la llave nueva de a poco, registro por registro. Cada uno se comprueba antes de seguir.
- **La llave antigua `_aes_key` queda intacta** en `_meta` mientras exista. Gracias a eso se puede volver atrás en cualquier momento.
- Pros: protección real (sin contraseña o servidor no se lee nada); entrada sin conexión; se puede deshacer.
- Contras: es el cambio más grande; hay que cuidar el orden de despliegue (ver "Riesgos").

**Opción A2: solo "puerta" con contraseña, sin volver a cifrar.**
- Se crean las envolturas y la entrada sin conexión, pero los datos siguen con la llave antigua.
- Pros: riesgo casi nulo para los datos; rápido.
- Contras: **no protege nada**. La llave antigua sigue a la vista en el PC.
- Sirve **como primera fase** de A1 (es la entrega 15b).

**Opción A3: doble capa (la llave antigua sigue cifrando y se añade otra capa encima).**
- Es la lectura más estricta de `CLAUDE.md`: la llave y su uso no cambian nada.
- Contras: más complejo y más lento, y la llave antigua nunca se podría retirar. No se recomienda, salvo que usted prefiera no cambiar nunca la llave actual.

**Por qué una llave por PC y no una por usuario (cambio respecto a la sección 3 del diseño).**
Hoy todos los usuarios de un PC comparten la misma copia. Además, usted decidió que los compañeros se vean y amplíen los registros entre sí (diseño, 8.1).
Una llave por usuario obligaría a tener **una copia separada por usuario** en cada PC. ¿A quién pertenecería la copia actual? Ese reparto podría dejar a alguien sin sus datos.
Con una llave por PC envuelta para cada usuario, cada uno abre **la misma copia** con **su propia contraseña**. **Esto cambia lo que decía el diseño y necesita su aprobación (pregunta A1).**

### 1.3 Recomendación: A1, en 4 entregas

| Entrega | Qué hace | ¿Se puede volver atrás? |
|---|---|---|
| **15a: solo lectura** | La app aprende a **leer** el formato nuevo, pero no lo escribe. Crea una base aparte `derrms_vault` (como se hizo con `derrms_sync`, `syncOutbox.ts:12-15`) que las versiones viejas ignoran. Añade una protección: **una colección que no se pudo leer nunca se sobrescribe**. Hoy `DB.get` devuelve vacío si no puede descifrar (`database.js:475-477`). `push` y `update` ya se protegen (`database.js:538-548`), pero las pantallas que rehacen la colección con `DB.set` no. | Sí, a cualquier versión |
| **15b: envolturas y entrada sin conexión (= A2)** | Se crea la llave nueva y sus envolturas. Desde aquí se puede entrar sin conexión. Los datos **todavía no** cambian de llave. | Sí, a cualquier versión desde 15a |
| **15c: volver a cifrar** | Se activa **por institución**, con un interruptor (apagado por defecto). Vuelve a cifrar `derrms` y `derrms_sync` con la llave nueva. Desde aquí los datos solo se abren tras iniciar sesión. Trae una rutina para **regresar al formato antiguo** mientras la llave antigua exista. | Sí, a 15a o posterior, con la rutina de regreso. **Nunca a una versión anterior a 15a.** |
| **15d: retirar la llave antigua** | Se borra `_aes_key`, solo cuando todos los PC estén migrados, verificados y sin trabajo pendiente. | **No.** Es el punto sin retorno. **Necesita su aprobación aparte (pregunta A3).** |

#### Cómo se pasa una instalación existente (nadie pierde el acceso)

1. Tras la actualización, el usuario entra **con conexión**, como hoy. La contraseña la comprueba el servidor.
2. En ese momento, y con la contraseña que acaba de escribir (no se guarda), la app:
   - crea la llave nueva del PC;
   - la envuelve con la contraseña;
   - pide al servidor la llave de recuperación de ese PC y guarda la segunda envoltura.
3. Con 15c activo, la app vuelve a cifrar los datos en segundo plano. Comprueba cada registro antes de seguir. Si algo falla, ese registro se queda con la llave antigua y se reintenta. **Nada se borra.**
4. Si nadie entra con conexión, el PC sigue funcionando **exactamente como hoy**.

#### Qué pasa en cada caso

- **Cambio de contraseña en este PC:** la pantalla de cambio ya pide la contraseña actual y la nueva (`WelcomeSetup.tsx:132`, `OwnerPortalPage.tsx:6033`). Se reenvuelve la llave con la nueva al momento.
- **Cambio de contraseña desde otro PC:** en este PC la contraseña vieja **sigue abriendo sin conexión** hasta la próxima entrada con conexión. Entonces el servidor acepta la nueva, la app recupera la llave con la llave de recuperación, la reenvuelve con la nueva y borra la envoltura vieja. Es una limitación conocida: sin red, el PC no puede enterarse del cambio.
- **Contraseña restablecida por un administrador:** igual que el caso anterior. **Hoy esa función no existe en el servidor** (pregunta A9).
- **Contraseña olvidada sin conexión:** ese usuario no puede abrir la copia de ese PC. Así está diseñado; si se pudiera, cualquiera podría.
  - Otro compañero con acceso a ese PC sí puede entrar y seguir trabajando (es la misma copia).
  - El trabajo pendiente de quien olvidó su contraseña **sigue guardado y cifrado**.
  - Al volver la red, se restablece la contraseña y el acceso vuelve. **Nunca se borra nada por esto.**
- **Contraseña equivocada sin conexión:** espera creciente tras 5 intentos. Un ladrón con una copia del disco podría probar contraseñas sin límite. Las 600 000 vueltas lo frenan, pero una contraseña de 8 caracteres no aguanta mucho. Por eso se propone exigir 12 caracteres a quien use la entrada sin conexión (pregunta A6).
- **Doble factor sin conexión:** el código 2FA no se puede comprobar sin el servidor. Propuesta: sin conexión basta la contraseña, durante un plazo máximo desde la última entrada con conexión en ese PC (7 días, preguntas A4 y A5). El plazo se calcula con el reloj del PC, que alguien podría cambiar. Es una barrera razonable, no absoluta.
- **Varios usuarios en un PC:** cada uno tiene su envoltura. El primero que entra **con conexión** en un PC donde nunca había entrado obtiene la llave mediante la llave de recuperación del servidor y crea su propia envoltura. Sin conexión, solo entran quienes ya tienen envoltura en ese PC.
- **Varias pestañas:** la pestaña que ya abrió la llave se la pasa a las demás del mismo sitio. **Al recargar la página** en un PC compartido se vuelve a pedir la contraseña (no el 2FA). Esto es nuevo respecto a hoy.
- **Dentro de DERR Justice:** el navegador guarda los datos del iframe aparte. Además hay **dos direcciones de Justice** (`justice.derrgroup.com` y la de Railway), y cada una tiene su propio almacén. Un PC puede tener hasta **3 copias**, y cada una es un "PC" distinto con su propia llave, sus envolturas y su número de dispositivo (`sync_devices.framed`, `server/src/db/migrations/017_sync_tables.sql:126-136`). Hay que probar la entrada sin conexión dentro del iframe a mano, en cada navegador.
- **Portal de pacientes:** con 15c, el portal no puede leer la lista local de pacientes sin que alguien del personal haya abierto el PC (pregunta A8).
- **PC perdido o robado:** el administrador revoca su llave de recuperación. Las envolturas de contraseña que ya están en ese PC siguen funcionando sin conexión hasta que venza el plazo de A5. No hay forma de impedirlo a distancia.

#### Cómo se respeta `CLAUDE.md` ("no modificar llaves ni parámetros de derivación")

- **15a y 15b no tocan** la llave actual, ni su uso, ni los parámetros de los `.enc` (`external-storage.js:69-75`).
- **La llave nueva y su PBKDF2 son algo nuevo.** No modifican nada existente, pero sí cambian la forma de cifrar los datos. Por eso **se pide su aprobación explícita** (pregunta A2) antes de construir 15c.
- **Borrar `_aes_key` (15d)** sí es modificar una llave existente: **aprobación aparte** (pregunta A3), y solo cuando el panel muestre todos los PC migrados.

### 1.4 Riesgos

- **Volver a una versión anterior a 15a con 15c activo:** esa versión no entiende el formato nuevo, vería colecciones vacías y podría sobrescribirlas. Cómo se evita:
  - 15a se despliega primero y se espera a que **todos** los PC lo hayan cargado (la versión se informa al registrar el dispositivo);
  - el interruptor de 15c está apagado por defecto;
  - regla escrita en el manual: nunca volver a una versión anterior a 15a.
- **Entrada algo más lenta:** las 600 000 vueltas añaden entre 0,5 y 1,5 segundos.
- **Trabajo pendiente cifrado con la llave antigua:** la cola también se vuelve a cifrar. La llave antigua no se retira mientras quede algo en la cola.
- **Navegadores que borran solos el almacén del iframe** (Safari, a veces Firefox): es un riesgo que ya existe hoy, no lo crea este cambio. Se pide al navegador que conserve los datos (`navigator.storage.persist()`).

### 1.5 Lo que usted debe decidir (sí/no)

- **A1.** ¿Acepta **una llave por PC**, abierta con la contraseña de cada usuario, en lugar de una llave por usuario?
- **A2.** ¿Autoriza la llave nueva (PBKDF2 600 000) y volver a cifrar los datos locales con ella, dejando intacta la llave actual?
- **A3.** ¿Autoriza **más adelante, por separado**, borrar la llave antigua cuando todos los PC estén migrados y verificados?
- **A4.** ¿Se permite entrar sin conexión **sin** el 2FA? ¿También al propietario y al administrador?
- **A5.** ¿Acepta un **máximo de 7 días** sin conexión antes de exigir entrar con conexión?
- **A6.** ¿Exigir **12 caracteres** como mínimo a quien use la entrada sin conexión?
- **A7.** ¿Acepta que el servidor guarde una **llave de recuperación por PC** y la entregue a cualquier usuario activo de la institución que entre con conexión en ese PC, quedando registrado?
- **A8.** ¿Acepta que el **portal de pacientes** deje de funcionar en un PC cerrado, hasta que pase a usar el servidor?
- **A9.** ¿Se construye la función de **restablecer la contraseña** por un administrador (hoy no existe)?

### 1.6 Tamaño y pruebas

- **Tamaño: L.** 15a S, 15b M, 15c M, 15d S.
- **Pruebas automáticas** (vitest con `fake-indexeddb` y el WebCrypto real, `src/tests/helpers/realWebCrypto.ts`):
  - envolver y desenvolver;
  - contraseña equivocada;
  - cambio de contraseña en este PC y en otro;
  - recuperación por el servidor;
  - migración interrumpida a mitad y reanudada;
  - regreso al formato antiguo;
  - "colección ilegible nunca se sobrescribe";
  - la cola cifrada con la llave antigua sigue enviándose;
  - una versión 15a lee lo escrito por 15c.
- **Pruebas manuales** en Chrome, Edge y Firefox, directo y dentro de Justice (en las dos direcciones):
  - entrar sin red;
  - recargar;
  - varias pestañas;
  - dos usuarios en el mismo PC.
- **Piloto:** primero en un PC de prueba con datos ficticios, luego en un PC real con el interruptor 15c apagado.

---

## 2. Tema B — Paso 16: políticas de PCs compartidos

### 2.1 Cómo funciona hoy

- El servidor ya guarda la política por institución, con `shared_persist` por defecto (`017_sync_tables.sql:189-198`). La ruta `GET/PUT /api/sync/settings` ya existe (`server/src/routes/sync.ts:11`, `:292-383`).
- **La app del navegador todavía no la lee** (ningún archivo de `src/` usa `local_cache_policy`).
- **No hay cierre por inactividad, por decisión suya:** "Logout is USER-INITIATED ONLY" (`src/components/layout/AppShell.tsx:119-123`). El aviso de inactividad está apagado.
- Al cerrar sesión, la sincronización se detiene y **el trabajo pendiente se queda en la cola** (`syncEngine.ts:275-289`).
- La sincronización está **apagada por defecto**. Y el modo "en ambos sentidos" **todavía funciona igual que el modo sombra**: los cambios de otros PCs no se aplican a la copia local (`syncEngine.ts:30-33`). **Hoy el servidor no puede reconstruir una copia local borrada.**
- La cola puede **contar** cuántos cambios pendientes hay sin abrir la llave (`syncOutbox.ts:1010-1028`). Así se puede aplicar la regla "no borrar trabajo sin enviar" incluso con el PC cerrado.

### 2.2 La regla que manda sobre todo: "borrado seguro"

La copia local solo se borra si se cumplen **todas** estas condiciones. Si falta una, **no se borra**: la copia sigue cifrada y aparece un aviso.

1. La institución está en sincronización **en ambos sentidos real**, es decir, cuando el TODO de `syncEngine.ts:30-33` esté hecho.
2. Este PC ya pasó la **verificación de la migración** (paso 13).
3. **La cola está vacía**, no hay cambios guardados solo en memoria (`getUnsavedSecureCount()`, `database.js:157-160`) y no hay seguimiento degradado.
4. La última comparación con el servidor (manifiesto) coincidió.

**Cómo se borra:** primero se destruyen la llave del PC y sus envolturas. Así, aunque quede algo en el disco, ya no se puede leer. Después se borran las colecciones de pacientes y la copia `shadow`. Los datos del sistema (catálogo de farmacia, personal) se conservan.

### 2.3 Qué pasa en cada política

| Momento | `personal` | `shared_persist` (por defecto hasta el piloto) | `shared_wipe` |
|---|---|---|---|
| **Cerrar sesión** | La llave se olvida de la memoria. La copia se queda. | La llave se olvida. La copia se queda cifrada. | Borrado seguro. Si no se puede, la copia se queda cifrada y aparece un aviso. |
| **Inactividad** | Nada (como hoy). | **Bloqueo de pantalla** tras 15 min: se pide la contraseña del mismo usuario y no se pierde lo escrito. O "Cambiar de usuario", que cierra la sesión. | Bloqueo a los 15 min. Si sigue inactivo 30 min más, cierre de sesión y borrado seguro. |
| **Cierre del navegador o fallo** | Al volver, pide la contraseña (también sin conexión). | Igual. | Al volver: borrado seguro si se puede. Si no, pide la contraseña y avisa. |
| **N días sin usar el PC** | Nada. | A los **30 días** sin que nadie lo abra: borrado seguro si se puede. Si no, se queda y avisa al administrador. | No aplica (ya se borra antes). |
| **Trabajo sin enviar** | Se queda. | Se queda. | Se queda. **Nunca se borra.** |

**Lo que ve el usuario:**
- Al cerrar sesión con trabajo pendiente: "Tiene 3 cambios sin enviar. Quedan guardados y cifrados en este PC y se enviarán cuando usted, o un administrador, vuelva a entrar con conexión." Con un botón "Intentar enviar ahora".
- En el bloqueo de pantalla: el nombre del usuario, un campo de contraseña y "Cambiar de usuario".
- En `shared_wipe`, al entrar: "Descargando la copia de este PC…". La primera entrada de cada turno tarda más.
- El administrador ve una lista de PCs con trabajo pendiente o borrado no posible. Solo números, nunca nombres de pacientes.

**Trabajo pendiente de otro usuario:** con la llave por PC (A1), si un administrador entra en ese PC, técnicamente podría enviarlo. Propuesta:
- normalmente, cada usuario envía solo lo suyo;
- un administrador puede usar "Enviar trabajo pendiente de otros", que queda registrado como "enviado por X en nombre de Y" (pregunta B4).

### 2.4 Qué depende del paso 15

- **Ya se puede hacer, sin el paso 15:**
  - leer la política en el navegador;
  - el aviso de trabajo pendiente al cerrar sesión;
  - la función de "borrado seguro" (solo comprobaciones, sin borrar);
  - el panel del administrador;
  - que cada PC informe sus números al servidor;
  - pedir al navegador que conserve los datos.
- **Necesita el paso 15:**
  - "olvidar la llave" al cerrar sesión (15b/15c);
  - el bloqueo con contraseña local (15b);
  - borrar destruyendo la llave (15c);
  - entrar tras un fallo sin conexión (15b).
- **Necesita además:** la sincronización en ambos sentidos real (TODO del paso 12) y el paso 13, para cualquier borrado.

### 2.5 Riesgos

- Con `shared_wipe`, cerrar la ventana sin cerrar sesión (lo más común) provoca un borrado y una descarga completa en la siguiente entrada. Hay que medir cuánto tarda en KIA.
- El bloqueo por inactividad **cambia su decisión actual** de no cerrar sesión. No cierra la sesión ni pierde lo escrito, pero necesita su aprobación (pregunta B1).
- Dentro de Justice, el navegador puede borrar el almacén por su cuenta. Mientras no haya sincronización en ambos sentidos, ese trabajo podría perderse. Es un riesgo que ya existe hoy.

### 2.6 Lo que usted debe decidir (sí/no)

- **B1.** ¿Acepta un **bloqueo de pantalla** (no cierre de sesión) por inactividad de **15 minutos** en PCs compartidos?
- **B2.** ¿Acepta **N = 30 días** para `shared_persist`?
- **B3.** ¿Confirma que **ningún borrado** se activa hasta que la sincronización en ambos sentidos sea real y el PC esté verificado?
- **B4.** ¿Puede un administrador enviar el trabajo pendiente de otro usuario, quedando registrado?
- **B5.** ¿Se mantiene `shared_persist` por defecto hasta el piloto en KIA?
- **B6.** ¿Pone usted una fecha límite para dejar de trabajar sin conexión **dentro de Justice** hasta que la sincronización sea completa?

### 2.7 Tamaño y pruebas

- **Tamaño: M.**
- **Pruebas automáticas:** cada condición del borrado seguro, por separado, impide el borrado; cola con 1 cambio → no se borra; el contador funciona con el PC cerrado; caída a mitad del borrado → al volver se termina o se conserva, nunca queda a medias y legible.
- **Manuales:** cierre de sesión, bloqueo y fallo simulado (matar el proceso del navegador) en cada política, directo y dentro de Justice.

---

## 3. Tema C — Vincular psicología, psiquiatría, fisioterapia y optometría por MRN

### 3.1 Cómo funciona hoy

- En el registro de colecciones, las cuatro están vinculadas **por nombre** (`src/services/collections.ts:136`, `:137`, `:139`, `:140`, con `patientLink: 'patientName'`).
- Por eso el paso 19 **no puede** unirlas a un paciente del servidor (`src/services/syncPseudonym.ts:121-132`, `:151-161`). Una prueba lo confirma (`src/tests/sync-engine.test.ts:776-792`).
- **El nombre se escribe a mano, en un campo de texto libre**, sin elegir de la lista de pacientes:

| Módulo | Campo de nombre | Guardar (único que escribe) | Leer |
|---|---|---|---|
| Psicología | `PsychologyPage.tsx:535`, campo `:951-956` | `DB.push('psychologyRecords', { patientName, … })` `:735-770` | `:592-596`, `:769` |
| Psiquiatría | `PsychiatryPage.tsx:150`, campo `:654-658` | `DB.push('psychiatryRecords', { patientName, … })` `:330-363` | `:235-239`, `:393`; trayectoria filtrada por nombre `:1281-1284` (con `normName` `:53-54`) |
| Fisioterapia | `PhysioPage.tsx:207`, campo `:422-426` | `DB.push('physioRecords', { patientName, … })` `:282-317` | `:251-255`, `:316` |
| Optometría | `OptometryPage.tsx:147`, campo `:443-447` | `DB.push('optometryRecords', { patientName, … })` `:265-297` | `:247-251`, `:296` |
| Pacientes ("Vistos hoy") | — | — | lee las cuatro y **ya busca `patientId`** (`PatientsPage.tsx:276-300`) |

- **En total:** 4 lugares que escriben, 8 que leen dentro de los módulos, 4 en Pacientes y 1 filtro de trayectoria. **Ningún módulo edita registros antiguos; solo crea nuevos.**
- **Además:** psiquiatría crea **tareas de enfermería** con el nombre pero **sin MRN** (`PsychiatryPage.tsx:370-386`).
- El aviso temprano (Q-Engine) usa el nombre como si fuera el identificador (`PsychologyPage.tsx:903`, `PsychiatryPage.tsx:567`).
- **Odontología ya lo hace bien:** se elige al paciente de una lista, se guarda `patientId` (el MRN) y se copia el nombre (`DentalPage.tsx:187-188`, `:258-262`, `:291-296`, `:702-708`).
- **En el servidor:** un vínculo se puede **cambiar** a otro paciente, pero **no quitar** (`server/src/routes/sync.ts:496`, `COALESCE`).

### 3.2 Opciones

**Opción C1: el cambio mínimo (recomendada).**
1. En los cuatro módulos, **elegir al paciente de la lista**, como en Odontología. Se guarda `patientId` (el MRN) **junto al** nombre, que no cambia. Se elige `patientId` porque ya lo usan Odontología, Pacientes y el paso 19.
2. Si el paciente no está registrado: se permite seguir con nombre libre, y el registro queda marcado "sin vincular" (pregunta C2).
3. Se actualiza el registro de colecciones: `patientLink: 'patientId'` en las cuatro. **No hay que tocar el servidor** (`server/src/sync/collections.ts:44-48` solo indica la sección).
4. **Vinculación de los registros antiguos, en cada PC, una sola vez:**
   - se compara el nombre normalizado (sin acentos ni espacios dobles, igual que `normName`) con la lista de pacientes de ese PC;
   - **exactamente un paciente coincide** y la edad o el sexo guardados no lo contradicen → se vincula y se marca "automático", con fecha;
   - **ninguno o varios coinciden** → **no se toca**; va a la lista "Por revisar";
   - **nunca se adivina:** no hay comparación aproximada automática. Los nombres parecidos solo se muestran como sugerencia a la persona que revisa.
5. Pantalla **"Vincular registros"**: lista los registros sin vincular (nombre escrito, fecha, profesional, **sin el contenido clínico**) con los pacientes candidatos. Una persona elige; queda registrado "manual, por X, fecha". Los vínculos automáticos también aparecen allí para poder corregirlos.

**Opción C2: solo vincular lo nuevo.** Se hace el punto 1 y se dejan los registros antiguos sin vincular.
- Pros: lo mínimo.
- Contras: el historial antiguo de psicología y psiquiatría nunca se une al paciente en el servidor.

**Opción C3: vincular en el servidor tras la subida.**
- Contras: el servidor tendría que manejar nombres, lo que va contra el paso 19. No se recomienda.

### 3.3 Cómo trata la sincronización los registros sin vínculo

- Se siguen enviando y guardando **sin paciente**, como ya pasa hoy (`sync-engine.test.ts:792`). No se rechazan.
- Al vincularlos más tarde, el cambio se envía como una modificación normal del campo `patientId`, y el servidor los une al paciente.
- Si dos PCs vinculan el mismo registro a pacientes **distintos**, aparece en el **panel de conflictos** (paso 14) para que lo resuelva una persona.
- El servidor cuenta cuántos registros siguen sin vincular por colección (solo el número).

### 3.4 Riesgos

- **Vincular un registro de psicología al paciente equivocado es grave.** Por eso solo se vincula solo cuando hay un único candidato, todo queda marcado como automático, se revisa y se puede corregir.
- Si la lista de pacientes de un PC está incompleta, es posible que **un único candidato** no sea el correcto. La comprobación de edad y sexo reduce ese riesgo, pero no lo elimina. Por eso la pregunta C3 ofrece "que una persona confirme todo".
- Cambiar el nombre del paciente en la ficha no cambia el nombre copiado en los registros antiguos. Ya pasa hoy en Odontología.

### 3.5 Lo que usted debe aprobar (`CLAUDE.md`: "si un módulo toca datos de pacientes, parar y confirmar")

- **C1.** ¿Autoriza cambiar psicología, psiquiatría, fisioterapia y optometría para **elegir al paciente de la lista**, guardando el MRN junto al nombre?
- **C2.** ¿Se permite seguir guardando con nombre libre a un paciente no registrado, marcado "sin vincular"?
- **C3.** ¿Vinculación automática de los registros antiguos **solo** cuando hay un único paciente con ese nombre y la edad y el sexo no lo contradicen? (Si dice no: una persona confirma todos, también los únicos.)
- **C4.** ¿Confirman los casos dudosos el profesional de esa especialidad o su jefe de servicio?
- **C5.** ¿Incluimos también las tareas de enfermería creadas desde psiquiatría, que hoy no tienen MRN?
- **C6.** ¿Se permite **"deshacer vínculo"**? Necesita un cambio pequeño en el servidor.
- **C7.** ¿Quién puede ver la pantalla "Vincular registros"? Propuesta: los roles de cada especialidad más el administrador.

### 3.6 Tamaño y pruebas

- **Tamaño: M** (S el selector y el registro; M la vinculación de lo antiguo y la pantalla de revisión).
- **Pruebas automáticas** (solo nombres ficticios, "Test Patient 001"):
  - un candidato → vinculado y marcado;
  - dos con el mismo nombre → no se toca;
  - ninguno → no se toca;
  - acentos y espacios;
  - edad o sexo que contradicen → no se toca;
  - ejecutar dos veces no cambia nada la segunda;
  - `subjectMrnOf` devuelve el MRN en las cuatro colecciones;
  - el registro de colecciones sigue pasando su control.
- **Manuales:** guardar en cada módulo, comprobar "Vistos hoy" y la trayectoria de psiquiatría, y revisar un caso dudoso de principio a fin.

---

## 4. Qué se puede hacer en paralelo

1. **Ya, en paralelo:** C completo · 15a · B parte 1 (aviso de pendientes, lectura de la política, función de borrado seguro sin borrar, panel).
2. **Después de 15a:** 15b (envolturas y entrada sin conexión).
3. **Después de 15b:** el bloqueo de pantalla y "olvidar la llave" de B.
4. **Después de 15b y de su aprobación A2:** 15c (volver a cifrar).
5. **Después de 15c, de la sincronización en ambos sentidos real y del paso 13:** el borrado de B (`shared_persist` a los N días y `shared_wipe`).
6. **Al final, con aprobación aparte (A3):** 15d.

## 5. Todas las preguntas, juntas

A1–A9 (sección 1.5) · B1–B6 (sección 2.6) · C1–C7 (sección 3.5).

## 6. Respuestas del propietario

| Pregunta | Respuesta | Fecha |
|---|---|---|
| A1 · una llave por PC, una envoltura por usuario | **Sí** | octubre 2026 |
| A2 · llave nueva PBKDF2 600 000 y volver a cifrar, conservando la llave actual | **Sí** | octubre 2026 |
| A4 · entrar sin conexión sin 2FA, también propietario y administrador | **Sí** | octubre 2026 |
| A5 · máximo 7 días sin conexión | **Sí** | octubre 2026 |
| A6 · 12 caracteres para entrar sin conexión | **Sí** | octubre 2026 |
| A7 · llave de recuperación por PC en el servidor, registrada | **Sí** | octubre 2026 |
| B1 · bloqueo de pantalla a los 15 minutos en PCs compartidos | **Sí** | octubre 2026 |
| B2 · N = 30 días para `shared_persist` | **Sí** | 2026-10-12 |
| B3 · ningún borrado hasta que la sincronización en ambos sentidos sea real y el PC esté verificado | **Sí** | 2026-10-12 |
| B4 · un administrador puede enviar el trabajo pendiente de otro usuario, registrado como "enviado por X en nombre de Y" | **Sí** | 2026-10-12 |
| B5 · `shared_persist` por defecto hasta el piloto en KIA | **Sí** | 2026-10-12 |
| C1 · psicología, psiquiatría, fisioterapia y optometría eligen al paciente de la lista y guardan el MRN | **Sí** | octubre 2026 |

**Aplicado por defecto, a falta de respuesta** (se puede cambiar):

- C2: se puede seguir guardando con nombre libre, marcado "sin vincular".
- C3: no hay vinculación automática; una persona confirma cada vínculo, también los únicos.
- C5: las tareas de enfermería creadas desde psiquiatría guardan también el paciente.
- C6: no hay "deshacer vínculo".

**Sin responder, y por eso no se construye:** A3 (borrar la llave antigua, 15d), A8 (portal de
pacientes con 15c activo), A9 (restablecer la contraseña por un administrador), B6 (fecha límite
para trabajar sin conexión dentro de Justice), C4 (quién confirma los casos dudosos) y C7 (quién ve
"Vincular registros").

**Qué significa B2–B5 en la práctica:** con `shared_persist`, cerrar sesión, la inactividad o un
cierre del navegador **nunca borran nada**: la llave se olvida o la pantalla se bloquea. Solo un PC
compartido que nadie abre durante 30 días se borra, y solo si se cumplen las cuatro condiciones de
la sección 2.2. Se borran primero la llave del PC y sus envolturas, y después la copia local de los
datos de pacientes y la copia `shadow`. Nunca se borran el servidor, el trabajo sin enviar, los
datos del sistema ni los PCs `personal`.

---

## Technical appendix (English, for the implementer)

### A. Step 15 — vault

**Facts.**
- `_meta._aes_key` is generated non-extractable (database.js:178-185), so `wrapKey` is impossible.
- `init()` decrypts all of `kv` at import time (database.js:950-1029).
- `configureSyncStore` shares `aesEncrypt`/`aesDecrypt` with `derrms_sync` (database.js:242-256).
- `get()` returns null on decrypt failure (database.js:458-478). `update()` aborts instead (database.js:527-548). `set()` overwrites blindly.

**Storage.**
- New Dexie DB `derrms_vault` v1, kept separate so `derrms` needs no version bump (same reasoning as syncOutbox.ts:12-15).
- Stores:
  - `state`: `device_id` (source of truth, mirrored to `LS_DEVICE_ID`), `format`, `migration` counters, `last_online_at`;
  - `wraps`: key = SHA-256(tenantId|userId); value `{v:1, kdf:'PBKDF2-SHA256', iter:600000, salt:16B, iv:12B, ct}`;
  - `device_wrap`: `{v:1, iv, ct}` under the server KEK.
- AAD = `derrms-vault/v1|<tenantId>|<deviceId>|<userKey|'device'>`.

**Keys.**
- DEK = AES-GCM-256.
- Generate it extractable once: wrap it (`wrapKey('raw', dek, kek, {name:'AES-GCM', iv, additionalData})`), then keep only a non-extractable working handle (unwrap again with `extractable:false`).
- Re-wraps (password change, new user) unwrap transiently with `extractable:true` from a wrap you can open right then (old password or device KEK), and never keep it.
- Share the handle across tabs over `BroadcastChannel`; CryptoKey is structured-cloneable.

**Row format v2.**
- `kv.value = {k:2, ct: ArrayBuffer}` (object, so it can't be confused with legacy `ArrayBuffer` or plaintext string).
- The reader dispatches on shape: string → plaintext legacy, ArrayBuffer → legacy key, `{k:2}` → DEK.
- Outbox and shadow rows get the same envelope.

**Phases.**
- **15a** (no new writes):
  - v2 reader;
  - `_unreadableKeys` set: `set()`/`update()` refuse to write a key whose committed row exists but failed to decrypt, and surface a banner;
  - create `derrms_vault`;
  - report `client_version` on `/api/sync/devices/register`.
- **15b:**
  - hook `AuthContext.login` and `verify2FA` success paths (AuthContext.tsx:288-294, :324-332) to hand the typed password to `vault.enroll()` (PBKDF2 in a worker if UI jank shows);
  - offline login path: if `navigator.onLine === false` or fetch fails, try `vault.unlockOffline(username, password)`; on success, restore the cached profile, sealed under the DEK in `state`, with AAD;
  - enforce `now - last_online_at <= maxOfflineDays`;
  - local back-off.
- **15c:**
  - tenant switch (new column `tenant_settings.vault_mode TEXT CHECK IN ('off','wrap','encrypt') DEFAULT 'off'`, new migration 025, not an edit to 017);
  - `DB.ready` gains an "awaiting unlock" phase;
  - background re-encrypt per key inside `_enqueueWrite`: decrypt legacy → encrypt DEK → read back and compare SHA-256 → put;
  - same for `derrms_sync` under `withOutboxLock`;
  - reverse routine `vault.downgrade()` while `_aes_key` exists.
- **15d:** delete `_meta._aes_key` only when `state.migration.legacyRows === 0`, the outbox is re-sealed, and an owner-approved flag is set.

**Server.**
- Migration 025:
  - `vault_device_keys(tenant_id, device_id, kek_ct /* v2 envelope, AAD table/column/device */, created_by, created_at, revoked_at, revoked_by, PRIMARY KEY(tenant_id, device_id))`, forced RLS like 017;
  - plus `vault_mode`.
- Routes `/api/vault`:
  - `POST /device-key` (idempotent create; returns the KEK);
  - `GET /device-key?device_id=` (requireAuth, same tenant, not revoked, 2FA-complete session; `data_access_log` row in the same tx, fail-closed);
  - `POST /device-key/revoke` (owner/admin).
- Add the routes to the log-path allow-list (`server/src/utils/logRedaction.ts`).
- Optional (A9): admin password reset route, which sets `mustChangePassword`.

**Pitfalls.**
- Two Justice origins mean two partitions (plus top-level) on one PC.
- Patient portal (`PatientLogin.tsx:241`) reads `patients` pre-staff-login.
- Owner and admin always need 2FA online (auth.ts:254).
- PBKDF2 at 600k is about 0.5-1.5 s on older PCs.

**Tests.**
- `src/tests/vault-*.test.ts` with `fake-indexeddb` plus `realWebCrypto` (extend the helper with `deriveKey`/`deriveBits`/`wrapKey`/`unwrapKey`).
- Cases:
  - enroll and unlock;
  - wrong password;
  - change password locally and remotely (device-KEK recovery);
  - new user on an enrolled PC;
  - kill mid-migration and resume;
  - downgrade;
  - 15a reads a 15c store;
  - unreadable key is never overwritten by `set()`;
  - outbox sealed under the legacy key still pushes during migration.
- Server: pg tests for RLS on `vault_device_keys` and audit fail-closed.

### B. Step 16 — cache policies

**Client.**
- Read `local_cache_policy` from the existing `GET /api/sync/settings` in `SyncEngine.boot()` (syncEngine.ts:419-426) and cache it in `derrms_vault.state`, so it's known offline.

**`canWipe()`.** Returns true only when all hold:
- `mode === 'bidirectional'` and pull-apply is implemented (resolve the TODO at syncEngine.ts:30-33 first);
- step-13 verification is recorded for this device;
- `syncDb().outbox.count() === 0` (no key needed);
- `getUnsavedSecureCount() === 0`;
- `!isDegraded()`;
- the last manifest matched.

**Wipe.**
- Crypto-erase first: delete `wraps` and `device_wrap`, revoke the device KEK server-side.
- Then `kv` rows whose `collections.ts` class is `patient`, plus `derrms_sync.shadow`.
- Keep `system` keys.

**Other client pieces.**
- Dirty-shutdown marker: a `state` flag set on unlock, cleared on clean logout.
- Idle lock: re-use `src/hooks/useSessionTimeout.ts`, which currently isn't wired (AppShell.tsx:119-123). Lock means hide the UI and drop the DEK handle (shared policies), then re-unlock locally; don't call `logout()` (keeps form state).
- Heartbeat: extend device register/heartbeat with `{pending, degraded, policy, client_version}` counts. Never ids.
- Outbox entries carry a sealed `user_id`. To let "push only own entries" work without the key, add a clear `owner` column holding SHA-256(tenant|user) to the outbox row (`derrms_sync` version bump: the separate DB, safe to bump).

**Tests.**
- Each `canWipe` precondition blocks individually.
- Wipe is atomic (crash after crypto-erase leaves unreadable data, never half-readable).
- Idle lock keeps unsaved form state.
- Manual: each policy × logout / idle / kill-process, top-level and framed.

### C. MRN link

**Changes.**
- Each of the four pages: replace the free-text input with the Dental pattern (DentalPage.tsx:258-262, :702-708). Keep free text as a "not registered" fallback if C2 = yes.
- Add `patientId` to the `DB.push` payload.
- Psychiatry: also add `patientId` to the `nurseTasks` push (:370-386) if C5 = yes.
- Pass the MRN instead of the name to `QEarlyWarningBanner`, only if the Q-Engine owner agrees. That's a separate change.
- `collections.ts:136-140`: set `patientLink: 'patientId'`.
- Update `sync-engine.test.ts:776-792` and `sync-pseudonym.test.ts:169` expectations, adding the name-only case as "no bidx".

**Backfill** (`src/services/patientLinkBackfill.ts`, run once per device after `DB.ready`, guarded by a device flag):
- For each record lacking `patientId`, use `DB.update(key, fn)`; it's atomic and aborts on unreadable rows (database.js:527-548).
- Normalize like `normName` (PsychiatryPage.tsx:53-54).
- Candidates = patients whose normalized `name` or `firstName + ' ' + lastName` equals it.
- Exactly 1 candidate, and no contradiction on `age` (vs dob at `dateTime`, ±1 year) or `gender` (vs `sex`) → set `patientId`, `patientLinkMethod: 'auto-name'`, `patientLinkedAt`.
- Otherwise leave the record untouched. The review UI recomputes candidates on the fly (no stored flags).
- Manual link sets `patientLinkMethod: 'manual'`, `patientLinkedBy`, and appends to `audit_trail`.
- Changes flow through `trackWrite` as normal field updates.

**Server.**
- No change for linking.
- For C6 (unlink), allow an explicit `subject_bidx: null` with a flag to clear `subject_id` (sync.ts:494-498 currently `COALESCE`s).
- Optional: count unlinked records per collection in the manifest.

**Tests.** Vitest with fictional names:
- unique, duplicate and zero matches;
- accent and whitespace normalization;
- age/sex contradiction;
- idempotent re-run;
- unreadable key skipped;
- `subjectMrnOf` returns the MRN for all four;
- `collections-registry` test passes.
- Smoke-test each page's save and PatientsPage "Seen Today".

### Critical files
- `src/services/database.js`
- `src/services/syncOutbox.ts`
- `src/auth/AuthContext.tsx`
- `src/services/syncEngine.ts`
- `src/services/collections.ts`
- `src/modules/psychiatry/PsychiatryPage.tsx` (plus `PsychologyPage.tsx`, `PhysioPage.tsx`, `OptometryPage.tsx`; pattern in `DentalPage.tsx`)
- `server/src/db/migrations/017_sync_tables.sql` (do not edit; add 025)
