# Alcance MVP — logistica-api

## Metodología: SDD (Spec Driven Development)

Flujo de agentes:

1. **Orchestrator** recibe prompt del usuario
2. **Spect** analiza requirements → crea `spec/<module>.md`
3. **Implement** codifica según spec
4. **Validator** revisa código vs docs
5. Si errores → loop a Implement. Si OK → confirmación

## Módulos (orden Fase 1 → 2 → 3)

| Fase | Módulo     | Descripción                              |
|------|------------|------------------------------------------|
| 1    | warehouse  | Punto de partida y almacenamiento        |
| 1    | suppliers  | Empresas que venden productos            |
| 1    | products   | Productos de tecnología                  |
| 2    | customer   | Cliente que genera envíos                |
| 2    | shipment   | Unidad central + shipment_items          |
| 3    | driver     | Persona asignada al transporte           |
| 3    | transport  | Medio de entrega                         |
| 3    | route      | Ruta + route_stops                       |

## Fases de Desarrollo

### Fase 1 — Fundamentos (warehouse → suppliers → products)

Setup inicial del proyecto + 3 primeras apps:
1. **Base project** — conectar DRF en settings, crear `apps/base/models.py` con `BaseModel`, configurar SimpleJWT, endpoints `/api/token/` y `/api/token/refresh/`
2. **warehouse** — modelo, CRUD, admin
3. **suppliers** — modelo, CRUD, admin
4. **products** — modelo con FK a supplier y warehouse, CRUD, admin

### Fase 2 — Clientes y Envíos (customer → shipment)

1. **customer** — modelo, CRUD, admin
2. **shipment** — modelo + `shipment_items` con FK a product, CRUD, admin

### Fase 3 — Logística (driver → transport → route)

1. **driver** — modelo con FK a `auth_user`, CRUD, admin
2. **transport** — modelo, CRUD, admin
3. **route** — modelo + `route_stops` con FK a warehouse, CRUD, admin

## CRUD por módulo

Cada app expone:

| Método | Endpoint                     | Acción              |
|--------|------------------------------|---------------------|
| GET    | `/api/<modelos>/`            | Listar              |
| POST   | `/api/<modelos>/`            | Crear               |
| GET    | `/api/<modelos>/{id}/`       | Detalle             |
| PUT    | `/api/<modelos>/{id}/`       | Actualizar completo |
| PATCH  | `/api/<modelos>/{id}/`       | Actualización parcial |
| DELETE | `/api/<modelos>/{id}/`       | Soft delete (is_active = False) |

## Auth

- **SimpleJWT** para autenticación JWT
- `POST /api/token/` — obtener token
- `POST /api/token/refresh/` — refrescar token
- Endpoints protegidos con `IsAuthenticated`
- Auth de Django (`auth_user`, grupos, permisos) para admin

## Deploy

- **Plataforma:** Railway
- **BD:** PostgreSQL via psycopg2-binary
- **Config:** Variables de entorno via python-decouple (`SECRET_KEY`, `DATABASE_URL`, etc.)
- Sin archivos de testing en esta fase MVP
