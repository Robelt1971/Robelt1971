# DERR — Política de privacidad, apartado 6: dónde se almacenan los datos y cómo se protegen

> Propuesta de redacción y plan de medidas que la respaldan.
> Fecha: 2026-10-07 · Estado: **Borrador, pendiente de revisión legal en Aruba**

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
| Cifrado de campos sensibles en la aplicación, con llaves custodiadas por DERR o por la institución, nunca por Railway | Railway solo guarda texto cifrado. Responde al argumento CLOUD Act: el proveedor podría entregar datos, pero ilegibles | pendiente |
| Región Railway **EU West (Ámsterdam)** para servicio, base de datos y volúmenes | Datos dentro del Reino de los Países Bajos, bajo régimen GDPR, en vez de California. Cambio de configuración, no de código | hecho (2026-10-08) |
| Seudonimización: tabla de identidad separada de la tabla clínica o judicial, enlazadas por identificador interno | Un acceso indebido a una tabla no revela a quién pertenece el dato | pendiente |
| Copia de respaldo cifrada periódica en Aruba, bajo control de la institución | "¿Y si Railway desaparece o nos corta el servicio?" | pendiente |
| Autenticación de dos factores, roles por perfil, registro inalterable de accesos, acceso administrativo de DERR limitado y registrado | Trazabilidad y mínimo privilegio | pendiente |
| TLS en todo el recorrido, incluido aplicación ↔ base de datos dentro de Railway | Cifrado en tránsito | pendiente |

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
reposo. Los campos sensibles se cifran además en la propia aplicación con
llaves que no están en poder de los proveedores de infraestructura, de modo
que estos nunca tienen acceso a información legible. Los datos de identidad
se almacenan separados de los datos clínicos o judiciales.

Cada institución recibe una copia de respaldo cifrada en Aruba bajo su
propio control, puede auditar el tratamiento, es notificada de cualquier
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

Orden sugerido: (1) cambiar la región de Railway a Ámsterdam, (2) firmar los
DPA de Railway y Cloudflare, (3) respaldo cifrado en Aruba, (4) cifrado de
campos en la aplicación y seudonimización, (5) revisión legal, (6) publicar
el nuevo apartado 6 y actualizar la tabla de estado de este documento.
