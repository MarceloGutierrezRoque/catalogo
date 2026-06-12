# MVP — logistica-frontend

Frontend administrativo para el sistema logístico. SPA con Next.js App Router + autenticación JWT.

## Stack

| Herramienta | Propósito |
|---|---|
| Next.js 16 + React 19 | Framework |
| Tailwind CSS 4 + shadcn/ui | UI components |
| TanStack Query | Server state (fetching, caching, mutations) |
| TanStack Table | Tablas con sort, filter |
| Axios | HTTP client con interceptor JWT |
| Zustand | Estado global cliente (auth) |
| sonner | Notificaciones toast |

## Módulos — orden de desarrollo

### Setup (base)
- Providers (TanStack Query, Auth, sonner)
- Axios instance con interceptor JWT + refresh
- Zustand store para auth
- Layout base con sidebar

### Módulo 1 — Auth (sin spec)
- Página `/login` — formulario username/password
- Redirigir a `/dashboard` tras login exitoso
- Proteger rutas con middleware o layout check

### Módulo 2 — Warehouse
- `GET /api/warehouses/` → tabla
- `POST /api/warehouses/` → formulario create
- `PUT /api/warehouses/{id}/` → formulario edit
- `DELETE /api/warehouses/{id}/` → soft-delete con confirmación

### Módulo 3 — Suppliers
- Misma estructura que Warehouse
- Sin FKs, formulario simple

### Módulo 4 — Products
- FK a Supplier y Warehouse
- Selects cargando datos de esos módulos
- Tabla con columnas: name, sku, category, supplier, warehouse, stock

### Módulo 5 — Customer
- Misma estructura que Warehouse
- Select para customer_type (company/person)

### Módulo 6 — Shipment + ShipmentItems
- Cabecera + items anidados
- Tabla de items dentro del formulario de shipment
- FK a Customer, Warehouse, Route (nullable)

### Módulo 7 — Driver
- FK a user (auth_user)
- Select para user (o campo numérico)

### Módulo 8 — Transport
- Sin FKs, formulario simple

### Módulo 9 — Route + Stops
- Cabecera + stops anidados
- FK a Transport y Driver
- Stops con orden y FK a Warehouse

## Convenciones de UI

- Sidebar izquierdo con links a cada módulo
- Tabla con: búsqueda, paginación, sort por columnas
- Formularios en Dialog o página dedicada según complejidad
- Botón "Nuevo" arriba de cada tabla
- Acciones por fila: Editar (icono), Eliminar (icono + confirmación)
- Badge para status (colores según estado)
- Toast de éxito/error después de cada mutación
- Loading skeleton en tablas mientras carga
- Error boundary por módulo

## Rutas

| Ruta | Módulo |
|------|--------|
| `/login` | Auth |
| `/dashboard` | Dashboard (redirect a warehouse o resumen) |
| `/warehouses` | Warehouse CRUD |
| `/suppliers` | Suppliers CRUD |
| `/products` | Products CRUD |
| `/customers` | Customer CRUD |
| `/shipments` | Shipment CRUD |
| `/drivers` | Driver CRUD |
| `/transports` | Transport CRUD |
| `/routes` | Route CRUD |
