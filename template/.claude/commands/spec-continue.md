Continúa el trabajo en un spec existente, cargando todo el contexto necesario.

El nombre del feature se pasa en $ARGUMENTS (ejemplo: `/spec-continue caching-strategy`).

## Pasos

1. **Validar que el spec existe**
   - Buscar en `specs/*<nombre>/` (el nombre puede tener prefijo de fecha)
   - Si no existe, sugerir usar `/spec <nombre>` para crearlo

2. **Cargar contexto completo**
   Lee los siguientes archivos en orden:
   - `SESSION.md` → Estado actual, archivos clave, decisiones
   - `PHASES.md` → Fase actual y próximas tareas
   - `SPEC.md` → Contexto del problema (si es necesario)

3. **Identificar próxima tarea**
   - Buscar la primera tarea no completada `[ ]` en PHASES.md
   - Identificar la fase actual

4. **Mostrar resumen de contexto con tiempos**
   ```
   Continuando: caching-strategy

   Tiempos:
   - Inicio: 2026-02-01 19:00
   - Transcurrido: 2h 30m

   Estado actual:
   - Fase 2 de 4: Optimizar Catálogos
   - Última tarea completada: "Aumentar TTL de BrandService"
   - Próxima tarea: "Agregar invalidación de cache"

   Archivos clave para esta sesión:
   - src/modules/brand/application/services/BrandService.ts
   - src/shared/events/handlers.ts

   Decisiones previas:
   - TTL de 1 hora para catálogos

   ¿Listo para continuar con la próxima tarea?
   ```

5. **Preguntar cómo proceder**
   - Continuar con la próxima tarea
   - Ver el SPEC.md completo
   - Ver todas las fases

## Al finalizar la sesión

Recuerda actualizar SESSION.md con:
- Tareas completadas
- Notas importantes
- Próximos pasos

## Cuando el spec esté completo

Usa `/spec-done <nombre>` para:
- Registrar fecha/hora de finalización
- Calcular duración total
- Verificar checklist de aceptación
