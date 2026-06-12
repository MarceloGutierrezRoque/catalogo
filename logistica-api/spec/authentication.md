# Spec: Authentication

Módulo de autenticación y gestión de usuarios, grupos y permisos.

Extiende SimpleJWT con un login custom que devuelve datos del usuario, y expone CRUD
de Users, Groups y Permissions (read-only) exclusivo para superusuarios.

---

## Resumen de cambios

### Backend (`logistica-api`)

| Archivo | Acción |
|---------|--------|
| `apps/authentication/permissions.py` | **Crear** — clase `IsSuperUser` |
| `apps/authentication/serializers.py` | **Crear** — 4 serializers |
| `apps/authentication/views.py` | **Modificar** — 3 views + 1 list |
| `apps/authentication/urls.py` | **Crear** — router + login/refresh paths |
| `config/urls.py` | **Modificar** — reemplazar SimpleJWT directo por `include('apps.authentication.urls')` |

### Frontend (`logistica-frontend`)

| Archivo | Acción |
|---------|--------|
| `stores/auth.ts` | **Modificar** — extender `user` interface, login URL |
| `lib/axios.ts` | **Modificar** — refresh URL (`/auth/refresh/`) |
| `services/users.ts` | **Crear** — CRUD + TanStack Query hooks |
| `services/groups.ts` | **Crear** — CRUD + TanStack Query hooks |
| `services/permissions.ts` | **Crear** — list + hook |
| `types/api.ts` | **Modificar** — agregar interfaces `User`, `Group`, `Permission` |
| `app/(dashboard)/layout.tsx` | **Modificar** — nav condicional `Usuarios` solo si `is_superuser` |
| `app/(dashboard)/users/page.tsx` | **Crear** — página de gestión de usuarios |

---

## 1. Backend — Modelo

No se crean modelos nuevos. Se usan los modelos built-in de Django:

| Modelo | `django.contrib.auth.models` | Tabla |
|--------|------------------------------|-------|
| `User` | `User` | `auth_user` |
| `Group` | `Group` | `auth_group` |
| `Permission` | `Permission` | `auth_permission` |

Relaciones existentes:

- `User.groups` → M2M `auth_user_groups`
- `User.user_permissions` → M2M `auth_user_user_permissions`
- `Group.permissions` → M2M `auth_group_permissions`

---

## 2. Backend — Permisos

**Archivo:** `apps/authentication/permissions.py`

```python
from rest_framework.permissions import BasePermission

class IsSuperUser(BasePermission):
    """Permite acceso solo a superusuarios (is_superuser=True)."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)
```

Este permiso se usará en todas las views de Users, Groups y Permissions.

---

## 3. Backend — Serializers

**Archivo:** `apps/authentication/serializers.py`

### 3.1 CustomTokenObtainPairSerializer

Extiende `TokenObtainPairSerializer` de SimpleJWT para incluir datos del usuario
en la respuesta del login.

```python
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
        }
        return data
```

**Respuesta `POST /api/auth/login/`:**
```json
{
    "access": "<jwt_access_token>",
    "refresh": "<jwt_refresh_token>",
    "user": {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "is_superuser": true,
        "is_staff": true
    }
}
```

### 3.2 UserSerializer

```python
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password

class UserSerializer(serializers.ModelSerializer):
    groups = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Group.objects.all(),
        required=False,
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password',
            'first_name', 'last_name', 'is_active',
            'is_staff', 'is_superuser', 'groups',
            'date_joined', 'last_login',
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        groups = validated_data.pop('groups', [])
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        user.groups.set(groups)
        return user

    def update(self, instance, validated_data):
        groups = validated_data.pop('groups', None)
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        if groups is not None:
            instance.groups.set(groups)
        return instance
```

**Comportamiento:**
- `password` es **write-only**: nunca se incluye en respuestas GET
- En `create`, si no se envía `password`, se rechaza (validación de DRF)
- En `update`, `password` es opcional: si se envía, se cambia con `set_password()`
- `groups` se envía como lista de IDs: `[1, 2, 3]`
- `date_joined` y `last_login` son read-only

**Payload creación (POST):**
```json
{
    "username": "jperez",
    "email": "jperez@example.com",
    "password": "Str0ngP@ss!",
    "first_name": "Juan",
    "last_name": "Pérez",
    "is_active": true,
    "is_staff": false,
    "is_superuser": false,
    "groups": [1, 2]
}
```

**Payload actualización (PUT/PATCH):**
```json
{
    "username": "jperez",
    "email": "jperez@nuevo.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "groups": [1]
}
```

**Cambio de contraseña (PATCH):**
```json
{
    "password": "NuevaClave2026!"
}
```

**Respuesta GET (detalle/lista):**
```json
{
    "id": 2,
    "username": "jperez",
    "email": "jperez@example.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "is_active": true,
    "is_staff": false,
    "is_superuser": false,
    "groups": [1, 2],
    "date_joined": "2026-06-01T12:00:00Z",
    "last_login": null
}
```

### 3.3 GroupSerializer

```python
from django.contrib.auth.models import Group, Permission

class GroupSerializer(serializers.ModelSerializer):
    permissions = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permission.objects.all(),
        required=False,
    )

    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions']
        read_only_fields = ['id']
```

**Payload creación/actualización:**
```json
{
    "name": "Operadores Logísticos",
    "permissions": [1, 2, 3, 4]
}
```

### 3.4 PermissionSerializer

```python
class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'content_type']
        read_only_fields = ['id', 'name', 'codename', 'content_type']
```

**Respuesta (read-only):**
```json
{
    "id": 1,
    "name": "Can add log entry",
    "codename": "add_logentry",
    "content_type": 1
}
```

---

## 4. Backend — Views

**Archivo:** `apps/authentication/views.py`

### 4.1 CustomTokenObtainPairView

```python
from rest_framework_simplejwt.views import TokenObtainPairView
from apps.authentication.serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
```

### 4.2 UserViewSet

```python
from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.authentication.permissions import IsSuperUser
from apps.authentication.serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsSuperUser]
```

- **Soft-delete:** no aplica aquí. `DELETE` es real (hard-delete de `auth_user`).
  Si se requiere desactivar, usar `PATCH` con `{"is_active": false}`.
- **Búsqueda:** se puede agregar `search_fields` y `ordering_fields` si es necesario.

### 4.3 GroupViewSet

```python
from django.contrib.auth.models import Group
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.authentication.permissions import IsSuperUser
from apps.authentication.serializers import GroupSerializer

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated, IsSuperUser]
```

### 4.4 PermissionListView

```python
from django.contrib.auth.models import Permission
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.authentication.permissions import IsSuperUser
from apps.authentication.serializers import PermissionSerializer

class PermissionListView(generics.ListAPIView):
    queryset = Permission.objects.select_related('content_type').all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, IsSuperUser]
```

Usamos `ListAPIView` porque Permissions es read-only (no ViewSet completo).

---

## 5. Backend — URLs

**Archivo:** `apps/authentication/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.authentication.views import (
    CustomTokenObtainPairView,
    UserViewSet,
    GroupViewSet,
    PermissionListView,
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'groups', GroupViewSet)

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('auth/permissions/', PermissionListView.as_view(), name='auth_permissions'),
    path('auth/', include(router.urls)),
]
```

**Tabla de endpoints resultantes:**

| Método | Endpoint | View | Permiso |
|--------|----------|------|---------|
| POST | `/api/auth/login/` | `CustomTokenObtainPairView` | Público |
| POST | `/api/auth/refresh/` | `TokenRefreshView` | Público |
| GET | `/api/auth/users/` | `UserViewSet.list` | `IsAuthenticated` + `IsSuperUser` |
| POST | `/api/auth/users/` | `UserViewSet.create` | `IsAuthenticated` + `IsSuperUser` |
| GET | `/api/auth/users/{id}/` | `UserViewSet.retrieve` | `IsAuthenticated` + `IsSuperUser` |
| PUT | `/api/auth/users/{id}/` | `UserViewSet.update` | `IsAuthenticated` + `IsSuperUser` |
| PATCH | `/api/auth/users/{id}/` | `UserViewSet.partial_update` | `IsAuthenticated` + `IsSuperUser` |
| DELETE | `/api/auth/users/{id}/` | `UserViewSet.destroy` | `IsAuthenticated` + `IsSuperUser` |
| GET | `/api/auth/groups/` | `GroupViewSet.list` | `IsAuthenticated` + `IsSuperUser` |
| POST | `/api/auth/groups/` | `GroupViewSet.create` | `IsAuthenticated` + `IsSuperUser` |
| GET | `/api/auth/groups/{id}/` | `GroupViewSet.retrieve` | `IsAuthenticated` + `IsSuperUser` |
| PUT | `/api/auth/groups/{id}/` | `GroupViewSet.update` | `IsAuthenticated` + `IsSuperUser` |
| PATCH | `/api/auth/groups/{id}/` | `GroupViewSet.partial_update` | `IsAuthenticated` + `IsSuperUser` |
| DELETE | `/api/auth/groups/{id}/` | `GroupViewSet.destroy` | `IsAuthenticated` + `IsSuperUser` |
| GET | `/api/auth/permissions/` | `PermissionListView.list` | `IsAuthenticated` + `IsSuperUser` |

---

## 6. Backend — Modificar `config/urls.py`

**Antes:**
```python
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # ...
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # ...
]
```

**Después:**
```python
# Eliminar imports de TokenObtainPairView y TokenRefreshView
# (quedan manejados dentro de apps.authentication.urls)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.authentication.urls')),  # <-- auth primero
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    # ... resto de includes de apps
]
```

La línea `path('api/', include('apps.authentication.urls'))` se coloca **antes** de los otros includes para que las rutas de auth tengan prioridad.

---

## 7. Backend — Config app

**Archivo:** `apps/authentication/apps.py` (ya existe, verificar)

```python
from django.apps import AppConfig

class AuthenticationConfig(AppConfig):
    name = 'apps.authentication'
```

Ya está registrada en `INSTALLED_APPS` como `'apps.authentication'` en settings.py.
No requiere cambios.

---

## 8. Backend — Admin

**Archivo:** `apps/authentication/admin.py`

No es estrictamente necesario porque `django.contrib.auth.admin` ya registra
User y Group. Mantener vacío o agregar registros custom si se desea en el futuro.

---

## 9. Frontend — Types

**Archivo:** `types/api.ts`

Agregar interfaces:

```typescript
export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  groups: number[]
  date_joined: string
  last_login: string | null
}

export interface Group {
  id: number
  name: string
  permissions: number[]
}

export interface Permission {
  id: number
  name: string
  codename: string
  content_type: number
}

export interface LoginResponse {
  access: string
  refresh: string
  user: {
    id: number
    username: string
    email: string
    is_superuser: boolean
    is_staff: boolean
  }
}
```

---

## 10. Frontend — Store (`stores/auth.ts`)

**Modificaciones:**

1. Actualizar `user` interface para incluir `is_superuser`, `is_staff`, `email`
2. Cambiar URL de login a `/auth/login/`
3. Extraer `user` del response en lugar de decodificar JWT manualmente

```typescript
interface UserInfo {
  id: number
  username: string
  email: string
  is_superuser: boolean
  is_staff: boolean
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  user: UserInfo | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  initialize: () => void
}
```

En `login`, usar:
```typescript
const { data } = await api.post("/auth/login/", { username, password })
// data.user tiene { id, username, email, is_superuser, is_staff }
set({ accessToken: data.access, refreshToken: data.refresh, isAuthenticated: true, user: data.user })
```

En `initialize`, decodificar JWT como antes pero extrayendo también `is_superuser` si está disponible en el payload, o parsear `user` de localStorage si se guardó.

---

## 11. Frontend — Axios (`lib/axios.ts`)

Cambiar la URL de refresh:

```
Línea 28:  const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh })
```

(Buscar ``/token/refresh/`` y reemplazar por ``/auth/refresh/``)

---

## 12. Frontend — Services

### 12.1 `services/users.ts`

```typescript
import api from "@/lib/axios"
import type { User, PaginatedResponse } from "@/types/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

// ── API functions ──

export function getUsers() {
  return api.get<User[] | PaginatedResponse<User>>("/auth/users/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}

export function getUser(id: number) {
  return api.get<User>(`/auth/users/${id}/`).then((r) => r.data)
}

export function createUser(data: Partial<User> & { password: string }) {
  return api.post<User>("/auth/users/", data).then((r) => r.data)
}

export function updateUser(id: number, data: Partial<User>) {
  return api.put<User>(`/auth/users/${id}/`, data).then((r) => r.data)
}

export function patchUser(id: number, data: Partial<User>) {
  return api.patch<User>(`/auth/users/${id}/`, data).then((r) => r.data)
}

export function deleteUser(id: number) {
  return api.delete(`/auth/users/${id}/`).then((r) => r.data)
}

// ── TanStack Query Hooks ──

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => getUser(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<User> & { password: string }) => createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success("Usuario creado exitosamente")
    },
    onError: () => {
      toast.error("Error al crear el usuario")
    },
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) => patchUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success("Usuario actualizado exitosamente")
    },
    onError: () => {
      toast.error("Error al actualizar el usuario")
    },
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success("Usuario eliminado exitosamente")
    },
    onError: () => {
      toast.error("Error al eliminar el usuario")
    },
  })
}
```

### 12.2 `services/groups.ts`

```typescript
import api from "@/lib/axios"
import type { Group, PaginatedResponse } from "@/types/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

// ── API functions ──

export function getGroups() {
  return api.get<Group[] | PaginatedResponse<Group>>("/auth/groups/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}

export function getGroup(id: number) {
  return api.get<Group>(`/auth/groups/${id}/`).then((r) => r.data)
}

export function createGroup(data: Partial<Group>) {
  return api.post<Group>("/auth/groups/", data).then((r) => r.data)
}

export function updateGroup(id: number, data: Partial<Group>) {
  return api.put<Group>(`/auth/groups/${id}/`, data).then((r) => r.data)
}

export function deleteGroup(id: number) {
  return api.delete(`/auth/groups/${id}/`).then((r) => r.data)
}

// ── TanStack Query Hooks ──

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
    staleTime: 5 * 60 * 1000,
  })
}

export function useGroup(id: number) {
  return useQuery({
    queryKey: ["groups", id],
    queryFn: () => getGroup(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Group>) => createGroup(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] })
      toast.success("Rol creado exitosamente")
    },
    onError: () => {
      toast.error("Error al crear el rol")
    },
  })
}

export function useUpdateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Group> }) => updateGroup(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] })
      toast.success("Rol actualizado exitosamente")
    },
    onError: () => {
      toast.error("Error al actualizar el rol")
    },
  })
}

export function useDeleteGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] })
      toast.success("Rol eliminado exitosamente")
    },
    onError: () => {
      toast.error("Error al eliminar el rol")
    },
  })
}
```

### 12.3 `services/permissions.ts`

```typescript
import api from "@/lib/axios"
import type { Permission, PaginatedResponse } from "@/types/api"
import { useQuery } from "@tanstack/react-query"

// ── API functions ──

export function getPermissions() {
  return api.get<Permission[] | PaginatedResponse<Permission>>("/auth/permissions/").then((r) => {
    const d = r.data
    return Array.isArray(d) ? d : (d.results ?? [])
  })
}

// ── TanStack Query Hooks ──

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: getPermissions,
    staleTime: 10 * 60 * 1000, // permissions raramente cambian
  })
}
```

---

## 13. Frontend — Dashboard Layout

**Archivo:** `app/(dashboard)/layout.tsx`

1. Importar `Shield` (o `UserCog`) de `lucide-react`
2. Importar `useAuthStore` y obtener `user`
3. Agregar ítem condicional en `navItems`:

```typescript
const user = useAuthStore((s) => s.user)

// Dentro del map, justo antes de renderizar el Link:
{user?.is_superuser && (
  <Link
    key="/users"
    href="/users"
    onClick={closeSidebar}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      pathname === "/users" || pathname.startsWith("/users/")
        ? "bg-primary/10 text-primary font-semibold"
        : "text-sidebar-foreground hover:bg-sidebar-accent",
    )}
  >
    <Shield className="h-4 w-4 shrink-0" aria-hidden="true" />
    Usuarios
  </Link>
)}
```

**Ubicación:** después del último ítem fijo (Envíos), o como separador visual antes del footer.

---

## 14. Frontend — Users Page

**Archivo:** `app/(dashboard)/users/page.tsx`

Página de gestión de usuarios con tabla, diálogo de creación/edición y confirmación de eliminación.

### Esqueleto mínimo:

```tsx
"use client"

import { useState } from "react"
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/services/users"
import { useGroups } from "@/services/groups"
import { useAuthStore } from "@/stores/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function UsersPage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  // Redirect if not superuser
  useEffect(() => {
    if (user && !user.is_superuser) {
      router.push("/dashboard")
    }
  }, [user, router])

  // Queries
  const { data: users, isLoading } = useUsers()
  const { data: groups } = useGroups()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  // State for dialogs, form, etc.

  if (!user?.is_superuser) return null

  return (
    <div>
      <h1>Gestión de Usuarios</h1>
      {/* Tabla de usuarios con columnas: usuario, email, roles, activo, acciones */}
      {/* Botón "Nuevo Usuario" */}
      {/* Dialog de creación/edición con campos: username, email, password, first_name, last_name, is_active, is_staff, is_superuser, groups (multi-select) */}
      {/* Confirmación de eliminación */}
    </div>
  )
}
```

### Columnas sugeridas para la tabla:

| Columna | Fuente |
|---------|--------|
| ID | `user.id` |
| Usuario | `user.username` |
| Email | `user.email` |
| Nombre | `user.first_name + " " + user.last_name` |
| Roles | nombres de grupos (resolver con `groups`) |
| Superuser | badge sí/no |
| Activo | badge sí/no |
| Acciones | Editar / Eliminar |

---

## 15. Consideraciones adicionales

### 15.1 Migraciones

No se requieren migraciones nuevas porque se usan tablas built-in de Django
(`auth_user`, `auth_group`, `auth_permission`). Ejecutar solo:
```bash
source .venv/bin/activate && python manage.py migrate
```

### 15.2 Seed de superusuario

El proyecto necesita al menos un superusuario para gestionar usuarios.
Crear con:
```bash
source .venv/bin/activate && python manage.py createsuperuser
```

### 15.3 Tests existentes

El archivo `apps/authentication/tests/test_auth.py` contiene tests para
los endpoints `/api/token/` y `/api/token/refresh/`. **Actualizar URLs**
en esos tests de `/api/token/` a `/api/auth/login/` y de
`/api/token/refresh/` a `/api/auth/refresh/`.

### 15.4 Paginación

DRF usa paginación por defecto según configuración global. Si no hay
configuración de paginación global, los ViewSets devuelven arrays planos.
Considerar agregar paginación global en settings si es necesario:

```python
REST_FRAMEWORK = {
    # ...
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}
```

### 15.5 Orden de ejecución

1. Crear `apps/authentication/permissions.py`
2. Crear `apps/authentication/serializers.py`
3. Modificar `apps/authentication/views.py`
4. Crear `apps/authentication/urls.py`
5. Modificar `config/urls.py`
6. `python manage.py migrate` (solo si hay cambios, no debería)
7. `python manage.py test apps.authentication`
8. Iniciar frontend y verificar login

---

## 16. Resumen de API contract

| Endpoint | Auth | Body | Response |
|----------|------|------|----------|
| `POST /api/auth/login/` | Público | `{ username, password }` | `{ access, refresh, user }` |
| `POST /api/auth/refresh/` | Público | `{ refresh }` | `{ access }` |
| `GET /api/auth/users/` | Superuser | — | `[User]` |
| `POST /api/auth/users/` | Superuser | `User` (incl. password, groups) | `User` (sin password) |
| `GET /api/auth/users/{id}/` | Superuser | — | `User` |
| `PUT/PATCH /api/auth/users/{id}/` | Superuser | `User` parcial o completo | `User` |
| `DELETE /api/auth/users/{id}/` | Superuser | — | `204 No Content` |
| `GET /api/auth/groups/` | Superuser | — | `[Group]` |
| `POST /api/auth/groups/` | Superuser | `{ name, permissions[] }` | `Group` |
| `GET /api/auth/groups/{id}/` | Superuser | — | `Group` |
| `PUT/PATCH /api/auth/groups/{id}/` | Superuser | `{ name, permissions[] }` | `Group` |
| `DELETE /api/auth/groups/{id}/` | Superuser | — | `204 No Content` |
| `GET /api/auth/permissions/` | Superuser | — | `[Permission]` |
