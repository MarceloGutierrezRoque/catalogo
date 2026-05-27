# logistica-api

Proyecto Django 6. Virtual env: `.venv`. Base de datos: SQLite (`db.sqlite3`).

## SDD Workflow

Antes de responder cualquier prompt, consultar `.opencode/agents/orchestrator.md`
y seguir el flujo: Spect → Implement → Validator.

## Reglas del proyecto

### Idioma

- **Comunicación y documentación** (respuestas, comentarios explicativos, mensajes de error para el usuario, texto de este archivo): **español**
- **Código y elementos de desarrollo** (nombres de variables, funciones, clases, archivos, carpetas, tablas, columnas, ramas de git, mensajes de commit): **inglés**

### Entorno virtual

- Antes de ejecutar **cualquier comando** dentro del proyecto, siempre activar el entorno virtual: `source .venv/bin/activate`
- Se puede encadenar con `&&` para no olvidarlo: `source .venv/bin/activate && <comando>`

### Comandos permitidos vs manuales

- Claude Code **puede ejecutar** cualquier comando del proyecto (`migrate`, `makemigrations`, `test`, `pip install`, etc.)
- `python manage.py runserver` es **siempre manual** — nunca ejecutarlo automáticamente

### Skills

- Usar `upgrade-python-deps` de django-skills para actualizar dependencias

---

## Contexto y alcance

API RESTful con Django REST Framework. Buena prácticas de desarrollo.

### Módulos

| Módulo | Descripción |
|--------|-------------|
| `customer` | Cliente (empresa o persona) que genera envíos |
| `shipment` | Unidad central de negocio: origen, destino, estado, fecha de entrega |
| `products` | Productos de tecnología a enviar |
| `transport` | Medio de entrega al cliente |
| `driver` | Persona asignada al transporte |
| `route` | Secuencia de paradas del transporte |
| `warehouse` | Punto de partida y almacenamiento |
| `suppliers` | Empresas que nos venden productos |

---

## Stack

|           |                                                                                   |
| --------- | --------------------------------------------------------------------------------- |
| Runtime   | Python 3.14                                                                       |
| Framework | Django 6 + Django REST Framework 3.17                                             |
| BD        | SQLite (`db.sqlite3`) en desarrollo; `psycopg2-binary` disponible para PostgreSQL |
| Config    | `python-decouple` para variables de entorno                                       |
| Puerto    | `8000` (Django por defecto)                                                       |

## Comandos

> Siempre activar el entorno virtual antes de cualquier comando. Usar `&&` para encadenar.

```bash
# Servidor de desarrollo — SIEMPRE MANUAL, nunca ejecutar automáticamente
source .venv/bin/activate && python manage.py runserver

# Migraciones
source .venv/bin/activate && python manage.py makemigrations
source .venv/bin/activate && python manage.py migrate

# Tests
source .venv/bin/activate && python manage.py test
source .venv/bin/activate && python manage.py test products  # app individual

# Crear superusuario
source .venv/bin/activate && python manage.py createsuperuser

# Instalar dependencias
source .venv/bin/activate && pip install -r requirements.txt
```

## Arquitectura

> **Importante:** Antes de desarrollar cualquier módulo, consultar:
> - `db-schema.md` — tablas, columnas y relaciones de la BD
> - `architecture.md` — estructura de apps y orden de desarrollo

```
logistica-api/
├── config/           # Configuración del proyecto Django (settings, urls, wsgi, asgi)
├── apps/             # Apps de dominio
│   ├── products/    # (ya existe, vacío)
│   ├── customer/
│   ├── shipment/
│   ├── warehouse/
│   ├── suppliers/
│   ├── transport/
│   ├── driver/
│   └── route/
├── db-schema.md      # Schema de la base de datos
├── architecture.md   # Arquitectura de desarrollo
├── manage.py
├── requirements.txt
└── db.sqlite3        # BD de desarrollo — no commitear en producción
```

### Orden de desarrollo

1. **Fase 1:** warehouse → suppliers → products
2. **Fase 2:** customer → shipment
3. **Fase 3:** driver → transport → route

### Auth

- SimpleJWT para autenticación JWT

**La configuración del proyecto vive en `config/`**, no en un directorio interno homónimo. `ROOT_URLCONF = 'config.urls'`.

`rest_framework` y `products` **aún no están en `INSTALLED_APPS`** — agregar ambos al conectar DRF o la app products.

## Agregar una nueva app de dominio

1. `python manage.py startapp <name>` (crear en `apps/`)
2. Agregar a `INSTALLED_APPS` como `apps.<name>` en `config/settings.py`
3. Definir models → `makemigrations` → `migrate`
4. Agregar serializers, views (ModelViewSet o APIView), URL router
5. Incluir URLs de la app en `config/urls.py`

**La configuración del proyecto vive en `config/`**, no en un directorio interno homónimo. `ROOT_URLCONF = 'config.urls'`.

`rest_framework` y `products` **aún no están en `INSTALLED_APPS`** — agregar ambos al conectar DRF o la app products.

## Estado actual

- App `products` está scaffolded pero vacía (sin models, views, URLs ni serializers).
- DRF instalado (`djangorestframework` en requirements) pero no registrado en `INSTALLED_APPS` aún.
- Sin archivo `.env` — `python-decouple` disponible pero no conectado a settings.
- `SECRET_KEY` es el valor inseguro generado por defecto — reemplazar con variable de entorno antes de cualquier despliegue compartido.