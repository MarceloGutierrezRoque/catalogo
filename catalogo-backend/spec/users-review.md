# Review: users

## Estado: ✅ APROBADO

## Resumen

| Aspecto | Resultado |
|---------|-----------|
| Implementación según spec | ✅ |
| Tests | ✅ 8/8 pasaron |
| `manage.py check` | ✅ Sin errores |
| Migraciones | ✅ Sin cambios |

## Tests ejecutados

| Test | Resultado |
|------|-----------|
| GET sin token → 401 | ✅ |
| GET con token → 200 + lista | ✅ |
| POST crear usuario → 201 + password hasheado | ✅ |
| POST sin password → 400 | ✅ |
| GET detalle → 200 | ✅ |
| PATCH actualizar → 200 | ✅ |
| PATCH cambiar password → password hasheado | ✅ |
| DELETE soft-delete → 204 + is_active=False | ✅ |

## Archivos implementados

- `apps/users/views.py` — `UserViewSet` (ModelViewSet + soft-delete)
- `apps/users/serializers.py` — `UserSerializer` (password write-only + hasheo)
- `apps/users/urls.py` — Router registro bajo `/api/users/`
- `apps/users/tests.py` — 8 tests de cobertura
- `config/urls.py` — Agregado include de users

## Conclusión

Módulo listo. Se procede al siguiente módulo: **plushies**.
