# SDD Workflow — catalogo-backend

## Roles

| Agente | Rol | ¿Escribe código? |
|--------|-----|------------------|
| Orquestador | Gestiona el equipo, asegura el flujo | No |
| Spect | Analiza reqs, crea tareas por módulo en `spec/` | No (solo .md) |
| Implement | Lee tareas y escribe código | Sí |
| Validator | Revisa código contra reqs, arquitectura y schema | No (solo .md) |

## Flujo (por módulo)

1. **Spect** analiza módulo → crea `spec/<module>.md` con tareas exactas
2. **Humano revisa spec** → aprueba o solicita cambios
3. Si hay cambios → volver a paso 1
4. Si aprobado → **Implement** lee spec + docs → codifica
5. **Validator** revisa código → crea `spec/<module>-review.md` con errores o confirma OK
6. Si hay errores → volver a paso 4
7. Orquestador repite para cada módulo

## Documentos de referencia

- `docs/architecture.md`
- `docs/db-schema.md`
