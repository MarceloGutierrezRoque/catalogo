# catalogo-backend

Django 6 + DRF 3.17 + psycopg2 + python-decouple. SQLite dev, PostgreSQL ready.

## Convenciones

- **Idioma:** Comunicación/docs español. Código/identificadores/commits inglés.
- **Entorno virtual:** Activar `.venv` antes de **todo** comando. Usar `&&` para encadenar.
- **runserver:** Siempre manual. Nunca ejecutar automáticamente.
- **Antes de desarrollar:** Consultar `docs/architecture.md` y `docs/db-schema.md`.
- Sin CI/CD, sin Docker.

## Contexto y alcance

API RESTful con Django REST Framework. Buenas prácticas de desarrollo. Backend de plataforma web de catálogo y gestión de pedidos de peluches.

Clientes navegan catálogo público → seleccionan peluches → completan formulario de contacto → generan solicitud de pedido. Admin recibe pedido, continúa conversación y cierra venta por WhatsApp.

### Módulos

| Módulo | App | Descripción |
|--------|-----|-------------|
| `authentication` | `authentication` | Control de acceso. Solo administradores autenticados acceden al sistema |
| `users` | `users` | Administradores internos. CRUD, activar/desactivar |
| `plushies` | `plushies` | Entidad principal del catálogo. CRUD, activar/desactivar, eliminar. Campos: nombre, descripción, precio, imagen, stock, created_at, updated_at. Desactivados = no aparecen en catálogo público. Eliminados = no aparecen en panel admin principal |
| `orders` | `orders` | Unidad central de negocio. Solicitudes de clientes. Campos: nombre, correo, teléfono, observaciones, estado, created_at, updated_at |
| `order_items` | `order_items` | Relación pedido ↔ peluche. Múltiples peluches + cantidades por pedido. Precio congelado al momento del pedido |
| `dashboard` | `dashboard` | Resumen para panel admin: pedidos nuevos, contactados, cerrados; peluches activos, desactivados |

## Comandos

```bash
.venv\Scripts\activate && python manage.py test
.venv\Scripts\activate && python manage.py makemigrations
.venv\Scripts\activate && python manage.py migrate
.venv\Scripts\activate && pip install -r requirements.txt
.venv\Scripts\activate && python manage.py createsuperuser
```

## Estado actual

- Scaffold recién creado (`django-admin startproject`).
- Config en `config/` (settings, urls, wsgi, asgi).
- DRF instalado pero **no** registrado en `INSTALLED_APPS`.
- Sin apps de dominio — crear: `authentication`, `users`, `plushies`, `orders`, `order_items`, `dashboard`.
- `SECRET_KEY` es default-insecure — reemplazar con env antes de deploy.
- `db.sqlite3` commiteado (en .gitignore pero ya trackeado).
