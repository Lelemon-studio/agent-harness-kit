Consolida y limpia la memoria del harness: agrupa por tema, detecta contradicciones y duplicados, propone fusiones / supersesiones / borrados, y mantiene el indice MEMORY.md sano. Es el equivalente simple del "reflection pass" — correr cada cierto tiempo, no en cada sesion.

En $ARGUMENTS se puede pasar un tema para acotar la auditoria (ejemplo: `/memory-gc lelemon-app`). Sin argumento, audita toda la memoria.

La memoria vive en el directorio de memoria del proyecto actual (`~/.claude/projects/<project-id>/memory/`), cuyo indice de una linea por memoria es `MEMORY.md`. El harness inyecta esa ruta al inicio de sesion; usar esa, no inventar.

## Regla de seguridad (no negociable)

La memoria es data del usuario. NUNCA borrar, fusionar ni sobrescribir un archivo sin haber mostrado la propuesta y recibido OK explicito. El flujo es: auditar (solo lectura) -> proponer -> confirmar -> aplicar. El usuario puede aprobar todo, parte o nada.

## Pasos

1. **Cargar (solo lectura)**
   - Leer `MEMORY.md` (el indice) y listar todos los topic files del directorio de memoria.
   - Si hay argumento, acotar a las memorias cuyo nombre, descripcion o contenido toquen ese tema.
   - No modificar nada en este paso.

2. **Auditar** — buscar, sin tocar:
   - **Duplicados / solapamiento:** dos o mas archivos que cubren el mismo hecho. Candidatos a fusion.
   - **Contradicciones:** hechos del mismo tema con valores distintos (ej. un dato que cambio). Para cada par en conflicto, identificar cual es mas reciente y cual tiene mas autoridad (`directo` = conversacion con el usuario > `docs` > `inferido` de copy/web). No actuar sobre lo inferido sin confirmar.
   - **Punteros rotos:** lineas en `MEMORY.md` que apuntan a archivos inexistentes, y archivos sin linea en el indice.
   - **Higiene del indice:** tamano total de `MEMORY.md` (debe quedar < 24.4KB o se carga parcial), lineas de mas de ~200 chars (el detalle va en el topic file, no en el indice), y que sea una linea por memoria.
   - **Fechas relativas** sin convertir a absolutas, y memorias marcadas para verificar que no se chequearon.

3. **Presentar el reporte** con propuestas numeradas, agrupadas por tipo:
   - `FUSIONAR`: A + B -> C, con la razon y como queda el archivo destino (con `[[wikilinks]]` a lo relacionado).
   - `SUPERSEDER`: A queda obsoleta por B. Preferir marcar A como superada (anadir nota `Superada por [[B]] el <fecha> — <por que>` + procedencia) antes que borrar, salvo que A sea claramente falsa.
   - `BORRAR`: solo lo claramente falso o muerto.
   - `ARREGLAR INDICE`: punteros rotos, lineas largas, entradas faltantes.
   - Si no hay nada que hacer, decirlo y terminar.

4. **Pedir confirmacion.** Esperar el OK. No aplicar nada destructivo antes.

5. **Aplicar lo aprobado**, respetando las convenciones del harness:
   - Un hecho = un archivo, con frontmatter (`name`, `description`, `metadata.type` ∈ user | feedback | project | reference).
   - `feedback` y `project` llevan lineas `**Why:**` y `**How to apply:**`.
   - Linkear lo relacionado con `[[name]]`.
   - Fechas relativas -> absolutas.
   - Al fusionar: escribir el archivo destino, borrar los fuentes, actualizar las lineas en `MEMORY.md` (una linea por memoria).

6. **Verificar al cierre:**
   - `MEMORY.md` sin punteros rotos y < 24.4KB.
   - Cada topic file tiene su linea en el indice y viceversa.
   - Reportar en una linea que se hizo (cuantas fusiones, supersesiones, borrados, fixes de indice).

## Notas

- Esto NO es un sistema de retrieval: la memoria se recuerda porque `MEMORY.md` se inyecta al inicio. No agregar ranking, embeddings ni scripts — el valor esta en consolidar y resolver conflictos, no en maquinaria.
- Correr periodicamente o cuando la memoria se sienta desordenada, no en cada sesion.
- Ante la duda entre fusionar o dejar separado, dejar separado: dos memorias claras valen mas que una mezclada confusa.
