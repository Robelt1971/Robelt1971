# Consulta a Z-Anatomy sobre la licencia de "Brainder" y "White matter"

Borrador para abrir un *issue* en <https://github.com/Z-Anatomy/The-blend/issues>
(en inglés, que es el idioma del proyecto). Mientras no haya respuesta, los
objetos siguen excluidos del módulo (`scripts/exclusiones.json`,
`LICENSES.md`). Si la respuesta es una licencia compatible con CC BY-SA 4.0,
se retiran esas entradas de la lista y se regenera `nervioso.glb`.

Estado: **sin enviar** (fecha de redacción: 2026-10-06). Quien lo envíe,
anote aquí el enlace del issue y la fecha.

---

**Title:** License of the "Brainder" and "White matter" models included in the atlas

Hello, and thank you for Z-Anatomy.

We are building a study module for nursing and medical students in Aruba on top
of the atlas (Startup.blend, commit `ded1a55`). We re-export each system to
glTF and redistribute the result under CC BY-SA 4.0 with your attribution, as
the README asks.

The README's attribution section lists two models as "used as
reference/included and adapted" without a license:

> "Brainder" and "White matter" from the University of Washington

The other third-party models (Dundee cranial nerves, Dundee inner ear, Cowley
kidney) do state one. For the two above we could not find the license, so we
currently exclude from our export every object that carries the `Brain`,
`Brain-Inner` or `White matter` material (174 objects: the cortical gyri and
sulci with Destrieux-atlas names, the white-matter tracts, commissures, fornix,
septum pellucidum, and a few brainstem and spinal-cord parts that share those
materials).

Could you tell us:

1. Which exact source these two models come from (URL), and under which
   license they were published?
2. Whether that license is compatible with redistributing derived meshes under
   CC BY-SA 4.0, as the rest of the atlas is?
3. Whether the material names are a reliable way to identify those objects, or
   whether some of them (for example `Pons`, `Medulla oblongata`,
   `Hypothalamus`, the spinal-cord horns) are in fact Z-Anatomy's own work?

If the license turns out to be compatible, we will put the objects back. In
return we are happy to contribute our Dutch and Papiamento name table once it
has been clinically reviewed.

Thanks again.
