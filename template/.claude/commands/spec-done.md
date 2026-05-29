Marca un feature/spec como completado.

El nombre del feature se pasa en $ARGUMENTS (ejemplo: `/spec-done caching-strategy`).

## Pasos

1. **Validar que el spec existe**
   - Buscar en `specs/*<nombre>/` (el nombre puede tener prefijo de fecha)

2. **Verificar checklist**
   - Leer DONE.md
   - Contar criterios cumplidos vs total
   - Si no está 100% completo, advertir al usuario

3. **Mostrar resumen de verificación**
   ```
   Verificando: caching-strategy

   Checklist de aceptación:
   ✅ Criterios funcionales: 4/4
   ✅ Calidad de código: 4/4
   ⚠️  Testing: 2/3 (falta cobertura >= 70%)
   ✅ Seguridad: 2/2
   ✅ Documentación: 4/4

   Total: 16/17 criterios (94%)

   ⚠️  Hay criterios pendientes. ¿Deseas continuar de todas formas?
   ```

4. **Si se confirma, marcar como DONE**
   - Actualizar status en SPEC.md a `DONE`
   - Actualizar campo "Fin" en SPEC.md con fecha/hora actual (`YYYY-MM-DD HH:mm`)
   - Actualizar campo "Finalizado" en DONE.md con fecha/hora actual
   - Actualizar header de PHASES.md con progreso final

5. **Calcular y mostrar duración**
   - Leer fecha de "Inicio" de SPEC.md
   - Calcular diferencia con fecha/hora actual
   - Mostrar duración total del feature

6. **Confirmar completado**
   ```
   ✅ Spec marcado como DONE

   Spec: specs/20260201-1900-caching-strategy/

   Tiempos:
   - Inicio: 2026-02-01 19:00
   - Fin: 2026-02-01 23:45
   - Duración: 4h 45m

   Resumen:
   - Fases completadas: 4/4
   - Criterios cumplidos: 17/17
   ```

## Formato de Fechas

- **Fin:** `YYYY-MM-DD HH:mm` (ej: `2026-02-01 23:45`)
- La duración se calcula automáticamente desde Inicio hasta Fin

## Notas

- Los specs NO se mueven a otra carpeta, solo se actualiza el status
- El spec permanece en `specs/` para referencia futura
- La duración incluye tiempo calendario, no solo tiempo de trabajo activo
