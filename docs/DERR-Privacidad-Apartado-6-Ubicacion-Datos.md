# DERR — Política de privacidad, apartado 6: dónde se almacenan los datos y cómo se protegen

> Propuesta de redacción y plan de medidas que la respaldan.
> Fecha: 2026-10-07 · Actualizado: 2026-10-08 con la auditoría del código de las tres apps
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
| Cifrado de campos sensibles en la aplicación, con la llave separada de la base de datos (opción A; llave en servicio aparte como opción de pago) | Railway solo guarda texto cifrado. Responde al argumento CLOUD Act: el proveedor podría entregar datos, pero ilegibles | parcial: Medical y Dental cifran algunos campos, pero la llave está en Railway; Justice no cifra nada (§1.1) |
| Región Railway **EU West (Ámsterdam)** para servicio, base de datos y volúmenes | Datos dentro del Reino de los Países Bajos, bajo régimen GDPR, en vez de California. Cambio de configuración, no de código | hecho (2026-10-08) |
| Seudonimización: tabla de identidad separada de la tabla clínica o judicial, enlazadas por identificador interno | Un acceso indebido a una tabla no revela a quién pertenece el dato | no implementada en ninguna app (§1.1) |
| Copia de respaldo cifrada periódica en el destino que elija la institución al contratar (su servidor en Aruba, su nube o la nube DERR) | "¿Y si Railway desaparece o nos corta el servicio?" | parcial: Dental y Medical tienen copias incompletas o sin cifrar; ninguna sale de Railway (§1.1) |
| Autenticación de dos factores, roles por perfil, registro inalterable de accesos, acceso administrativo de DERR limitado y registrado | Trazabilidad y mínimo privilegio | parcial, con fallos de seguridad que se corrigen primero (§1.1) |
| TLS en todo el recorrido, incluido aplicación ↔ base de datos dentro de Railway | Cifrado en tránsito | parcial: navegador ↔ app sí; app ↔ base de datos sin TLS o sin verificar certificado (§1.1) |

### 1.1 Estado verificado por aplicación (auditoría del código, 2026-10-08)

Auditoría de solo lectura del código y la configuración de las tres apps. No se abrió
ningún dato real.

| Medida | DERR Medical | DERR Dental | DERR Justice |
|---|---|---|---|
| Cifrado de campos en el servidor | Parcial. AES-256-GCM en nombre, MRN, fecha de nacimiento, diagnóstico y notas. Sin cifrar: celda, departamento, archivos subidos, detalle del registro de auditoría (contiene MRN) | Parcial. AES-256-GCM en historia clínica y formulario de ingreso. Sin cifrar: nombre, cédula, fecha de nacimiento, contacto, notas de citas, recetas, archivos subidos | No hay. Todo se guarda en claro |
| Dónde está la llave | Variable de entorno en Railway | Variable de entorno en Railway | No aplica |
| Rotación de llave | No | No | No aplica |
| Datos en el navegador | **La mayor parte de la historia clínica vive solo en el navegador** (IndexedDB), cifrada con una llave guardada en el mismo navegador | Copia completa de la clínica en claro en el navegador; no se borra al cerrar sesión | Expedientes completos, con fotos y huellas, en claro en el navegador; no se borran al cerrar sesión |
| Seudonimización | No. Las tablas clínicas repiten el nombre del paciente | No | No |
| Respaldo | Solo tablas del sistema, no las de pacientes; destino en una ruta de Windows que en Railway no persiste | Diario, 14 copias, **dentro de la misma base de datos** y sin cifrar; incluye secretos de usuarios | No hay, salvo los respaldos que ofrece Railway |
| 2FA | Obligatorio para propietario y administrador, pero se salta si aún no tienen secreto | **No funciona**: la verificación siempre dice "correcto" y el alta falla. El secreto se envía a un servicio externo para dibujar el código QR | No hay |
| Roles (RBAC) | La matriz de 14 roles existe pero ninguna ruta del servidor la aplica | Sí, en el servidor | Sí, en el servidor |
| Aislamiento por fila (RLS) | Definido, probablemente no efectivo | Definido; varias rutas lo saltan | No hay |
| Registro de auditoría | Solo agregable, pero sin cadena de hashes; no registra lecturas | Bloquea edición al rol de la app, sin cadena de hashes; no registra lecturas de historias clínicas | Editable; los cambios los informa el navegador y pueden falsificarse; no registra lecturas |
| TLS app ↔ base de datos | Activado por defecto, depende de variables en Railway | Sin configurar | Desactivado en la red interna; sin verificar certificado en la pública |
| Cabeceras de seguridad (HSTS, CSP) | Sí | Sí | No |

**Otros hallazgos que afectan a la política:**

- **Terceros que reciben datos.** Medical envía texto clínico a la API de Anthropic
  (Estados Unidos) desde las funciones de IA, y solo algunas quitan antes el nombre del
  paciente. Dental usa el reconocimiento de voz del navegador, que en Chrome envía el audio
  a Google. Las alertas de seguridad de las tres apps envían IP y usuarios a Resend y a una
  pasarela de WhatsApp. La lista completa está en `DERR-Subencargados.md`.
- **Medical guarda la historia clínica en los equipos de la institución,** no en Railway.
  Eso significa que gran parte de los datos ya está físicamente en Aruba, pero protegida
  solo por la seguridad de cada equipo.
- **Justice publica en el código del navegador los hashes de la contraseña del
  propietario** y permite un inicio de sesión del propietario sin servidor. La cuenta de
  demostración "test" se crea en el navegador con rol de administrador.

**Correcciones:**

| Corrección | App | Estado |
|---|---|---|
| 2FA que verifica de verdad, QR generado en el navegador, límite de intentos sin atajos, nombres de pacientes fuera de los logs | Dental | hecho, Robelt1971/DERR-Dental-System#5 |
| Modo desarrollo solo explícito, límite de intentos activo, telemetría privada, sin MRN en la auditoría | Medical | hecho, Robelt1971/DERR-Medical-System#10 |
| Cabeceras de seguridad, auditoría de cada guardado en el servidor, health sin errores internos, token del monitor por cabecera | Justice | hecho, Robelt1971/DERR-Justice-System#7 |
| Quitar el nombre del paciente en todo envío a Anthropic | Medical | en curso |
| Respaldos cifrados con llave propia, sin secretos de usuarios, copia al destino que elija la institución | Dental | en curso |
| Diseño de copia en el navegador más sincronización con el servidor | Medical | diseño listo, `DERR-Medical-Diseno-Sincronizacion.md` |
| Quitar hashes del propietario del navegador en Justice; un intento de contraseña de propietario por conexión | Las tres | en curso |

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

> **Aviso (2026-10-08):** según la auditoría de §1.1, hoy **no son ciertas** estas
> frases del texto propuesto: que los campos sensibles se cifran en las tres apps (Justice
> no cifra); que la identidad se guarda separada; que los respaldos van cifrados al destino
> que elige la institución (en curso). Tampoco menciona que Medical guarda datos en los
> equipos de la institución ni que algunas funciones envían datos a Anthropic o Google.
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
2. Corregir los fallos de seguridad de §1.1: 2FA de Dental, roles sin aplicar y 2FA
   saltable en Medical, hashes del propietario y cuenta "test" en Justice.
3. Borrar los datos del navegador al cerrar sesión y cifrar lo que quede en él.
4. Respaldo cifrado fuera de Railway, con prueba de restauración.
5. TLS verificado entre app y base de datos, y cabeceras de seguridad en Justice.
6. Registro de auditoría con lecturas y cadena de hashes.
7. Cifrado de campos con llave fuera de Railway, y seudonimización.
8. Firmar los DPA de los subencargados y revisión legal en Aruba.
9. Publicar el nuevo apartado 6 y actualizar este documento.
