# Cambios backend — impacto frontend

## DELETE /api/admin/plushies/{id}/

**Antes:** Soft-delete (marcaba `is_deleted=True`, el registro seguía en BD).  
**Ahora:** Borrado físico (el registro se elimina de la BD completamente).

### Impacto en frontend

- Si mostraban plushies "eliminados" en alguna vista (ej. papelera, historial), esos datos ya no existen.
- Al hacer DELETE, el objeto desaparece del listado `/api/admin/plushies/` — no depende de refrescar ni filtrar por `is_deleted`.
- Si el frontend tenía lógica como `if plushie.is_deleted: mostrar como eliminado`, esa lógica ya no aplica.

---

## GET /api/dashboard/ — `plushies`

Los conteos ahora excluyen registros con `is_deleted=True`:

| Campo | Antes | Ahora |
|---|---|---|
| `plushies.active` | `is_active=True, is_deleted=False` | Sin cambio |
| `plushies.inactive` | `~(is_active=True, is_deleted=False)` — incluía eliminados | `is_active=False, is_deleted=False` — solo inactivos no eliminados |
| `plushies.total` | Todos los plushies en BD | Solo `is_deleted=False` |

### Impacto en frontend

- `total` y `inactive` serán menores si habían registros con `is_deleted=True`.
- La relación `active + inactive = total` se mantiene.
- Dashboard ya no cuenta plushies "eliminados" como inactivos.

---

## Sin cambios en consumo de API

- URLs, métodos HTTP y formatos de request/response son idénticos.
- No se requiere cambiar llamadas HTTP desde el frontend.
