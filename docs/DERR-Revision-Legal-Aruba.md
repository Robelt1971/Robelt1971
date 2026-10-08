# DERR — Informe para la revisión legal en Aruba

> Documento para entregar a un abogado en Aruba. Resume cómo funcionan las tres
> aplicaciones y qué preguntas legales necesitan respuesta antes de vender a instituciones.
> Fecha: 2026-10-08 · Estado: **Pendiente de enviar al abogado**

---

## 1. Qué es DERR

DERR Group desarrolla tres aplicaciones web para instituciones de Aruba:

| Aplicación | Usuario típico | Datos que trata |
|---|---|---|
| DERR Medical | Departamento médico de una institución penitenciaria (KIA) y clínicas | Historias clínicas, incluidas las de personas detenidas |
| DERR Dental | Clínicas dentales | Historias dentales |
| DERR Justice | Institución penitenciaria (KIA) | Expedientes de personas detenidas; incluye el módulo médico de DERR Medical |

**Dónde están los datos.** Desde el 2026-10-08, las aplicaciones y sus bases de datos se
alojan en Railway (empresa de Estados Unidos) en su centro de datos de **Ámsterdam,
Países Bajos**. Antes estaban en California. El dominio, el sitio web y el correo pasan por
Cloudflare (empresa de Estados Unidos, red global).

**Papel de DERR.** DERR presta el servicio y trata los datos por cuenta de cada
institución. La institución decide para qué se usan. El borrador de contrato está en
`DERR-Contrato-Encargado-Tratamiento.md`.

---

## 2. Marco legal identificado

Lo que sigue viene de fuentes secundarias. No pudimos leer el texto oficial completo. Le
pedimos que lo confirme o corrija.

- **Landsverordening persoonsregistratie**, de 19 de mayo de 2011, publicada en
  AB 2011 no. 37. Según las fuentes consultadas, es la norma general de protección de datos
  en Aruba. No hay autoridad de protección de datos; la supervisión corresponde a los
  tribunales, con un papel del Ministro de Justicia.
- **Artículo 8:** obligación del titular del registro de tomar medidas técnicas y
  organizativas contra pérdida, acceso, cambio o comunicación no autorizados.
- **Artículo 9:** los datos solo pueden darse a terceros según la finalidad del registro, y
  si la ley lo exige o la persona lo consiente.
- **Artículo 24:** según un extracto, regula a quien **desde Aruba accede a un registro
  situado fuera de Aruba** al que no se aplica la ordenanza, y le obliga a tomar las
  precauciones necesarias. Una fuente secundaria afirma además que el artículo permite al
  Ministro de Justicia declarar dañina para la privacidad una transferencia al extranjero y
  prohibirla. No pudimos confirmar esa segunda parte.
- **RGPD europeo:** no rige en Aruba como tal. Puede aplicarse a DERR o a sus proveedores
  por el lado neerlandés, porque los servidores están en los Países Bajos.

---

## 3. Preguntas

**Sobre la ubicación de los datos**

1. ¿Está vigente la Landsverordening persoonsregistratie (AB 2011 no. 37)? ¿Hay un proyecto
   de ley que la sustituya y que debamos anticipar?
2. ¿Qué dice exactamente el artículo 24? ¿Se aplica a una institución de Aruba que guarda
   sus registros en un servidor de los Países Bajos operado por una empresa de Estados
   Unidos? ¿Qué "precauciones necesarias" exige en la práctica?
3. ¿Existe alguna declaración del Ministro de Justicia que limite transferencias a los
   Países Bajos o a Estados Unidos? ¿Puede dictarse una en el futuro, y qué haríamos?
4. ¿Hay alguna norma específica para registros del Gobierno o del Ministerio de Justicia
   que exija que permanezcan en Aruba? Esto decide si DERR Justice puede ofrecerse en la
   nube o solo instalado localmente.
5. Al estar los servidores en los Países Bajos, ¿se aplica el RGPD a DERR, a Railway o a la
   institución? ¿Con qué consecuencias prácticas?

**Sobre datos de salud y datos penales**

6. ¿Qué normas de Aruba regulan la confidencialidad de la historia clínica (por ejemplo,
   secreto médico y derechos del paciente) y qué exigen al guardarla en la nube?
7. ¿Cuánto tiempo hay que conservar las historias clínicas y dentales, y los expedientes
   penitenciarios? ¿Qué pasa con ellos al terminar el contrato?
8. ¿Hay reglas especiales para datos de salud de personas detenidas?

**Sobre el contrato y la responsabilidad**

9. Revise el borrador de contrato de encargado (`DERR-Contrato-Encargado-Tratamiento.md`).
   ¿Qué términos neerlandeses corresponden a "responsable" y "encargado" en la ordenanza?
   ¿Falta alguna cláusula obligatoria?
10. Redacte la cláusula de responsabilidad (sección 12 del borrador): límites, seguros y
    exclusiones razonables para un proveedor pequeño.
11. ¿Cubre la cláusula de solicitudes de autoridades (sección 6) el riesgo de que una
    autoridad de Estados Unidos pida datos a Railway o a Cloudflare? ¿Hay algo más que
    podamos prometer?
12. ¿Es obligatorio notificar incidentes de seguridad a alguna autoridad en Aruba, o solo a
    la institución y a las personas afectadas?

**Sobre la política de privacidad**

13. Revise el texto propuesto del apartado 6 de la política de privacidad, en
    `DERR-Privacidad-Apartado-6-Ubicacion-Datos.md`, sección 4. ¿Es correcto y suficiente?

---

## 4. Documentos que se entregan

- `DERR-Privacidad-Apartado-6-Ubicacion-Datos.md`: medidas, estado de cada una y texto
  propuesto para la política.
- `DERR-Contrato-Encargado-Tratamiento.md`: borrador de contrato con las instituciones.
- `DERR-Subencargados.md`: proveedores que intervienen y qué datos ven.

## 5. Fuentes consultadas

- [Landsverordening persoonsregistratie, texto en la web del Gobierno de Aruba](https://cuatro.sim-cdn.nl/arubaoverheid2858bd/uploads/0208ab11.037.pdf) (no accesible desde nuestro entorno; confirmar)
- [DLA Piper, Data protection laws of the world: Aruba](https://www.dlapiperdataprotection.com/index.html?t=law&c=AW)
- [DLA Piper, transferencias en Aruba](https://www.dlapiperdataprotection.com/?t=transfer&c=AW)
- [DataGuidance: Aruba](https://www.dataguidance.com/jurisdiction/aruba)
- [Staatsblad 2023, 256](https://zoek.officielebekendmakingen.nl/stb-2023-256.html), sobre el nivel de protección de las ordenanzas de los países caribeños
- [Kamerstuk 34876, nr. 1](https://zoek.officielebekendmakingen.nl/kst-34876-1.html)
