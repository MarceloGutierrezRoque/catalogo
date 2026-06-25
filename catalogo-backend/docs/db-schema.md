# Database Schema — catalogo-backend

## Convenciones

- Timestamps: `created_at` (auto_now_add), `updated_at` (auto_now) donde aplique.
- Soft-delete vía flags booleanos independientes.
- Precios como `DecimalField(max_digits=10, decimal_places=2)`.
- IDs auto-incrementales (default Django).

---

## Django built-in tables

Relevantes para el proyecto:

| Tabla | Propósito |
|---|---|
| `auth_user` | Administradores del sistema (is_staff=True, is_superuser). Se usa directamente, sin perfil separado |
| `auth_group` | Grupos de permisos |
| `auth_permission` | Permisos por modelo |
| `auth_user_groups` | Relación usuario ↔ grupo |
| `auth_user_user_permissions` | Relación usuario ↔ permiso directo |
| `django_admin_log` | Log de acciones del admin |
| `django_session` | Sesiones de usuario |
| `django_migrations` | Migraciones aplicadas |

---

## plushies_plushie

Catálogo de peluches.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | AutoField | PK | |
| `name` | CharField(200) | NOT NULL | Nombre del peluche |
| `description` | TextField | NULL | Descripción |
| `price` | DecimalField(10,2) | NOT NULL | Precio actual |
| `image` | ImageField | NULL | Ruta de archivo — storage backend TBD (revisar antes de producción) |
| `stock` | IntegerField | NOT NULL, default=0 | Stock disponible |
| `is_active` | BooleanField | NOT NULL, default=True | False = oculto en catálogo público |
| `is_deleted` | BooleanField | NOT NULL, default=False | True = oculto en panel admin principal (no se asigna desde API, solo desde admin de Django) |
| `created_at` | DateTimeField | auto_now_add | |
| `updated_at` | DateTimeField | auto_now | |

---

## orders_order

Solicitudes de clientes.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | AutoField | PK | |
| `customer_name` | CharField(200) | NOT NULL | Nombre del cliente |
| `customer_email` | EmailField | NOT NULL | Correo de contacto |
| `customer_phone` | CharField(20) | NOT NULL | Teléfono de contacto |
| `observations` | TextField | NULL | Notas adicionales del cliente |
| `status` | CharField(20) | NOT NULL, default='pending' | pending / contacted / closed / cancelled |
| `created_at` | DateTimeField | auto_now_add | |
| `updated_at` | DateTimeField | auto_now | |

---

## order_items_orderitem

Detalle de peluches por pedido. Precio congelado al momento de la solicitud.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | AutoField | PK | |
| `order` | ForeignKey → `orders_order` | NOT NULL, CASCADE | Pedido padre |
| `plushie` | ForeignKey → `plushies_plushie` | NOT NULL, PROTECT | Peluche seleccionado |
| `quantity` | PositiveIntegerField | NOT NULL | Cantidad solicitada |
| `unit_price` | DecimalField(10,2) | NOT NULL | Precio del peluche al momento del pedido |

**Relaciones:**
- `order` → `orders_order.id` (CASCADE: si se elimina el pedido, se eliminan sus items)
- `plushie` → `plushies_plushie.id` (PROTECT: no permitir eliminar peluche si tiene pedidos asociados)

---

## dashboard — Sin tablas

No crea modelos. Usa consultas agregadas sobre `plushies_plushie`, `orders_order` y `order_items_orderitem`.

---

## authentication — Sin tablas propias

Usa `auth_user` de Django + SimpleJWT para autenticación por tokens.

Endpoints: `POST /api/token/`, `POST /api/token/refresh/`.

---

## users — Sin tablas propias

Gestiona `auth_user`. Reutiliza el modelo de Django. Columnas relevantes de `auth_user`:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | AutoField | PK |
| `username` | CharField(150), unique | |
| `email` | CharField(254) | |
| `password` | CharField(128) | Hasheado |
| `first_name` | CharField(150) | |
| `last_name` | CharField(150) | |
| `is_active` | BooleanField | False = desactivado (no puede login) |
| `is_staff` | BooleanField | True = acceso a panel admin |
| `is_superuser` | BooleanField | True = todos los permisos |
| `date_joined` | DateTimeField | |

---

## Diagrama ER (texto)

```
┌──────────────────┐       ┌──────────────────────┐
│    auth_user     │       │  plushies_plushie    │
│   (admins)       │       │                      │
└──────────────────┘       └──────────┬───────────┘
                                      │
                                      │ 1
                                      │
                                      │
                             ┌────────┴───────────┐
                             │    orders_order     │
                             │ (customer data)     │
                             └────────┬───────────┘
                                      │ 1
                                      │
                                      │ N
                             ┌────────┴───────────┐
                             │order_items_orderitem│
                             │                     │
                             │ qty + frozen price  │
                             └─────────────────────┘
```

**Relaciones:**
1. `order_items_orderitem.order` → `orders_order.id` (N:1)
2. `order_items_orderitem.plushie` → `plushies_plushie.id` (N:1)
3. `auth_user` → sin FK a tablas de negocio (admins no son clientes)

---

## Notas

- `auth_user` maneja admins. Clientes NO tienen cuenta — solo llenan formulario público.
- `order_items_orderitem.unit_price` se congela al crear el pedido. No se actualiza si cambia `plushies_plushie.price`.
- `DELETE /api/admin/plushies/:id/` hace borrado físico (hard-delete). `is_deleted` ya no se asigna desde la API.
- `is_active=False` oculta del catálogo público, `is_deleted=True` filtra en dashboard y catálogo público.
- `orders_order.status` transiciones: `pending` → `contacted` → `closed` | `cancelled`.
