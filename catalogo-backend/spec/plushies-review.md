# Review: plushies

## Estado: ✅ APROBADO

## Resumen

| Aspecto | Resultado |
|---------|-----------|
| Implementación según spec | ✅ |
| Tests | ✅ 10/10 pasaron |
| `manage.py check` | ✅ Sin errores |
| Migraciones | ✅ `plushies.0001_initial` aplicada |

## Tests ejecutados

| Test | Resultado |
|------|-----------|
| **Público —** GET list sin auth → 200 | ✅ |
| **Público —** Solo activos + no eliminados en list | ✅ |
| **Público —** GET detalle activo → 200 | ✅ |
| **Público —** GET detalle inactivo → 404 | ✅ |
| **Admin —** GET list sin token → 401 | ✅ |
| **Admin —** GET list incluye inactivos/eliminados | ✅ |
| **Admin —** POST crear → 201 | ✅ |
| **Admin —** DELETE soft-delete → is_deleted=True | ✅ |
| **Admin —** PATCH activate → is_active=True | ✅ |
| **Admin —** PATCH deactivate → is_active=False | ✅ |

## Archivos implementados

- `apps/plushies/models.py` — Modelo `Plushie`
- `apps/plushies/serializers.py` — `PlushiePublicSerializer` + `PlushieAdminSerializer`
- `apps/plushies/views.py` — `PlushiePublicViewSet` (ReadOnly) + `PlushieAdminViewSet` (CRUD + actions)
- `apps/plushies/urls.py` — Dos routers (público + admin)
- `apps/plushies/admin.py` — Registro en admin de Django
- `apps/plushies/tests.py` — 10 tests de cobertura
- `config/urls.py` — Incluye plushies + media serving en dev

## Conclusión

Módulo listo. Se procede al siguiente módulo: **order_items**.
