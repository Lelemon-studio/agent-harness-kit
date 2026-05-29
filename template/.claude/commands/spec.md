Crea una nueva especificación de feature usando el sistema de planificación.

El nombre del feature se pasa en $ARGUMENTS (ejemplo: `/spec drizzle-validation`).

## Pasos

1. **Validar argumentos**
   - Si no se proporciona nombre, pedir uno al usuario
   - El nombre debe ser kebab-case (ej: `add-user-auth`, `fix-n1-queries`)

2. **Crear carpeta `specs/` si no existe**
   - Si el proyecto no tiene `specs/`, crearla en la raíz del proyecto

3. **Crear estructura**
   Crea la carpeta con formato `YYYYMMDD-HHMM-<nombre>` en `specs/`:
   ```
   specs/YYYYMMDD-HHMM-<nombre>/
   ├── SPEC.md
   ├── PHASES.md
   ├── SESSION.md
   └── DONE.md
   ```

4. **Generar archivos desde templates inline**
   Reemplaza en todos los archivos:
   - `{{FEATURE_NAME}}` → nombre del feature en Title Case
   - `{{DATETIME}}` → fecha y hora actual en formato `YYYY-MM-DD HH:mm`
   - `{{DATE}}` → fecha actual (YYYY-MM-DD)

### SPEC.md

```markdown
# {{FEATURE_NAME}}

> **Status:** `IN_PROGRESS`
> **Inicio:** {{DATETIME}}
> **Fin:** -

---

## Resumen

<!-- 2-3 oraciones que explican QUÉ es este cambio -->

## Problema

<!-- ¿Qué problema estamos resolviendo? ¿Por qué es importante ahora? -->

## Propuesta

<!-- Descripción de alto nivel de la solución -->

## Goals

<!-- ✅ Qué SÍ vamos a hacer -->
- [ ] Goal 1
- [ ] Goal 2

## Non-Goals

<!-- ❌ Qué NO vamos a hacer (y por qué) -->
- No haremos X porque...

## Contexto Técnico

<!-- Referencias a documentación, código existente, decisiones previas -->

| Recurso | Ubicación |
|---------|-----------|
| Doc relevante | `path/to/file.md` |
| Código relacionado | `src/modules/...` |

## Alternativas Consideradas

### Opción A: {{nombre}}
- **Pros:** ...
- **Cons:** ...

### Opción B: {{nombre}} (elegida)
- **Pros:** ...
- **Cons:** ...

**Decisión:** Elegimos B porque...

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| ... | Alta/Media/Baja | Alto/Medio/Bajo | ... |

## Referencias

- [Link a RFC/ADR relacionado]()
- [Link a issue/ticket]()
```

### PHASES.md

```markdown
# Fases - {{FEATURE_NAME}}

> Progreso: **0/N fases completadas**
> Última actualización: {{DATETIME}}

---

## Fase 1: {{Nombre de la fase}}

> **Estado:** `PENDIENTE`
> **Criterio de éxito:** {{Cómo sabemos que está completa}}

### Tareas

- [ ] Tarea 1.1 - Descripción
- [ ] Tarea 1.2 - Descripción
- [ ] Tarea 1.3 - Descripción

### Verificación

\`\`\`bash
# Comando(s) para verificar que la fase está completa
\`\`\`

### Notas

<!-- Observaciones durante la ejecución -->

---

## Fase 2: {{Nombre de la fase}}

> **Estado:** `PENDIENTE`
> **Criterio de éxito:** {{Cómo sabemos que está completa}}
> **Depende de:** Fase 1

### Tareas

- [ ] Tarea 2.1 - Descripción
- [ ] Tarea 2.2 - Descripción

### Verificación

\`\`\`bash
# Comando(s) para verificar
\`\`\`

### Notas

---

## Fase 3: {{Nombre de la fase}}

> **Estado:** `PENDIENTE`
> **Criterio de éxito:** {{Cómo sabemos que está completa}}
> **Depende de:** Fase 2

### Tareas

- [ ] Tarea 3.1 - Descripción

### Verificación

\`\`\`bash
# Comando(s) para verificar
\`\`\`

### Notas

---

## Resumen de Progreso

| Fase | Estado | Tareas | Verificado |
|------|--------|--------|------------|
| 1. {{nombre}} | ⏳ | 0/3 | - |
| 2. {{nombre}} | ⏳ | 0/2 | - |
| 3. {{nombre}} | ⏳ | 0/1 | - |
```

### SESSION.md

```markdown
# Contexto de Sesión - {{FEATURE_NAME}}

> **Propósito:** Información para retomar el trabajo rápidamente en cada sesión.
> Lee este archivo al inicio de cada sesión de trabajo.

---

## Estado Actual

**Fase actual:** 1 de N
**Fecha de inicio:** {{DATE}}
**Última tarea completada:** -
**Próxima tarea:** ...
**Fecha de cierre:** (pendiente)

## Archivos Clave

<!-- Archivos que debes tener en contexto para trabajar -->

| Archivo | Por qué es relevante |
|---------|---------------------|
| `path/to/file.ts` | Contiene... |

## Comandos Frecuentes

\`\`\`bash
# Ejecutar tests relacionados
pnpm test --grep "feature-name"

# Verificar tipos
pnpm typecheck
\`\`\`

## Decisiones Tomadas

<!-- Decisiones que se tomaron durante el desarrollo -->

| Fecha | Decisión | Razón |
|-------|----------|-------|
| {{DATE}} | ... | ... |

## Bloqueadores / Pendientes

- [ ] Pendiente: ...

## Notas de Sesiones Anteriores

### Sesión {{DATETIME}}
- Completamos: ...
- Próximos pasos: ...
```

### DONE.md

```markdown
# Checklist de Aceptación - {{FEATURE_NAME}}

> **Propósito:** Verificar que el feature cumple todos los criterios antes de considerarlo DONE.
> Todos los items deben estar marcados antes de cerrar.
>
> **Finalizado:** -

---

## Criterios Funcionales

- [ ] Criterio 1: ...
- [ ] Criterio 2: ...
- [ ] Criterio 3: ...

## Criterios Técnicos

### Calidad de Código
- [ ] Typecheck pasa sin errores
- [ ] Lint pasa sin errores
- [ ] No hay `any` explícitos
- [ ] No hay type assertions (`as`)

### Testing
- [ ] Tests unitarios escritos y pasando
- [ ] Tests de integración escritos y pasando
- [ ] Cobertura >= 70%

### Performance
- [ ] No hay N+1 queries
- [ ] Queries están paginadas donde aplica
- [ ] Tiempos de respuesta dentro de límites

### Seguridad
- [ ] Inputs validados con Zod
- [ ] Permisos verificados
- [ ] No hay datos sensibles en logs

## Documentación

- [ ] SPEC.md actualizado con decisiones finales
- [ ] PHASES.md con todas las fases completadas
- [ ] Código auto-documentado (nombres claros)
- [ ] API contracts actualizados (si aplica)

## Verificación Final

**Resultado:** ⏳ Pendiente

## Notas de Cierre

### Deuda Técnica Identificada
- [ ] TODO: ...

### Mejoras Futuras
- Idea para siguiente iteración: ...
```

5. **Mostrar resumen**
   Informa al usuario:
   - Ubicación de los archivos creados
   - Fecha/hora de inicio registrada
   - Próximos pasos recomendados:
     1. Editar SPEC.md con el problema y propuesta
     2. Definir las fases en PHASES.md
     3. Comenzar a trabajar

6. **Ofrecer ayuda inicial**
   Pregunta si quiere:
   - Ayuda para completar el SPEC.md
   - Definir las fases basado en una descripción del trabajo
