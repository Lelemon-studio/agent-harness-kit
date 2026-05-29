Muestra el estado actual de un spec en el sistema de planificación.

El nombre del feature se pasa en $ARGUMENTS (ejemplo: `/spec-status caching-strategy`).
Si no se pasa argumento, lista todos los specs.

## Pasos

1. **Validar argumentos**
   - Si no se proporciona nombre, listar todos los specs activos en `specs/`
   - Si se proporciona, buscar ese spec específico

2. **Leer archivos del spec**
   - SPEC.md → extraer Status, Inicio, Fin
   - PHASES.md → contar fases completadas/total
   - DONE.md → contar criterios cumplidos/total

3. **Mostrar resumen con tiempos**
   ```
   Spec: caching-strategy
   Status: IN_PROGRESS

   Tiempos:
   - Inicio: 2026-02-01 19:00
   - Fin: - (en progreso)
   - Transcurrido: 2h 30m

   Progreso de Fases:
   ✅ Fase 1: Datos Estáticos (5/5 tareas)
   🔄 Fase 2: Catálogos (2/4 tareas)
   ⏳ Fase 3: Vehículos Públicos (0/5 tareas)
   ⏳ Fase 4: Stats (0/4 tareas)

   Checklist: 8/20 criterios cumplidos
   ```

4. **Si no hay argumento, listar specs**
   ```
   Specs activos:

   EN PROGRESO:
   - caching-strategy (2/4 fases) - Inicio: 2026-02-01 19:00
   - security-audit (0/5 fases) - Inicio: 2026-02-01 09:00

   COMPLETADOS (últimos 5):
   - redis-optimization (3/3 fases) - Duración: 3h 15m
   - token-blacklist (2/2 fases) - Duración: 1h 45m

   Usa: /spec-status <nombre> para ver detalles
   ```

5. **Para specs completados, mostrar duración**
   ```
   Spec: redis-optimization
   Status: DONE

   Tiempos:
   - Inicio: 2026-02-01 17:00
   - Fin: 2026-02-01 20:15
   - Duración total: 3h 15m

   Progreso de Fases:
   ✅ Fase 1: Optimización de conexión (3/3 tareas)
   ✅ Fase 2: TTL y expiraciones (4/4 tareas)
   ✅ Fase 3: Monitoreo (2/2 tareas)

   Checklist: 15/15 criterios cumplidos
   ```

## Notas

- Los specs con status DONE muestran duración total
- Los specs IN_PROGRESS muestran tiempo transcurrido desde inicio
- Buscar en `specs/` con pattern `*<nombre>*` para encontrar specs con prefijo de fecha
