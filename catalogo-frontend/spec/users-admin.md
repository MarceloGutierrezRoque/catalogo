# Spec: Users — Admin (Gestión de Usuarios)

## 1. Resumen del módulo

Panel administrativo para gestionar usuarios del sistema (Fase 7 del MVP).

Permite listar todos los usuarios, crear nuevos administradores/operadores, editar datos, activar/desactivar cuentas (soft-delete).

**Endpoints que consume (todos requieren JWT Bearer):**

| Método | Ruta | Propósito |
|--------|------|-----------|
| GET | `/api/users/` | Lista paginada de usuarios |
| POST | `/api/users/` | Crear usuario |
| GET | `/api/users/{id}/` | Detalle de usuario |
| PUT | `/api/users/{id}/` | Actualización completa |
| PATCH | `/api/users/{id}/` | Actualización parcial |
| DELETE | `/api/users/{id}/` | Soft-delete (is_active=false) — Response 204 |

**Rutas del módulo:**

| Ruta | Tipo | Propósito |
|------|------|-----------|
| `/dashboard/users` | 🔒 Protegida | Listado con TanStack Table |
| `/dashboard/users/new` | 🔒 Protegida | Formulario de creación |
| `/dashboard/users/[id]` | 🔒 Protegida | Detalle y edición (incluye eliminar) |

**Forma de los datos:**

| Campo | Tipo | Create | Edit | Listado/Detalle |
|-------|------|--------|------|-----------------|
| `id` | number | — | — | ✅ Solo lectura |
| `username` | string | ✅ Requerido (min 3) | ✅ Requerido (min 3) | ✅ |
| `email` | string | ✅ Requerido, email válido | ✅ Requerido, email válido | ✅ |
| `password` | string | ✅ Requerido (min 6) | ❌ Opcional (min 6 si se ingresa) | ❌ Nunca se muestra |
| `first_name` | string | ❌ Opcional | ❌ Opcional | ✅ |
| `last_name` | string | ❌ Opcional | ❌ Opcional | ✅ |
| `is_staff` | boolean | ❌ Opcional (default false) | ✅ Editable | ✅ |
| `is_active` | boolean | ❌ No editable en create | ✅ Editable | ✅ |
| `is_superuser` | boolean | ❌ Solo backend (solo lectura) | ❌ Solo backend | ✅ |
| `date_joined` | string | — | — | ✅ Solo lectura |

---

## 2. Archivos a crear (8 archivos)

| # | Ruta | Propósito |
|---|------|-----------|
| 1 | `services/admin-users.ts` | API service para CRUD de usuarios |
| 2 | `hooks/use-admin-users.ts` | TanStack Query hooks (listar, detalle, crear, actualizar, eliminar) |
| 3 | `app/dashboard/users/page.tsx` | Página de listado (TanStack Table) |
| 4 | `app/dashboard/users/new/page.tsx` | Página de creación de usuario |
| 5 | `app/dashboard/users/[id]/page.tsx` | Página de detalle y edición |
| 6 | `components/users/admin/admin-users-table.tsx` | TanStack Table para listado |
| 7 | `components/users/admin/user-form.tsx` | Formulario de creación/edición con Zod |
| 8 | `components/users/admin/delete-user-dialog.tsx` | Diálogo de confirmación para soft-delete |

---

## 3. Archivos a modificar (1 archivo)

| # | Ruta | Cambio |
|---|------|--------|
| 1 | `types/api.ts` | Agregar `UserUpdatePayload` (password opcional) |

---

## 4. Detalle de cada archivo

### 4.1 `types/api.ts` — Agregar `UserUpdatePayload`

Agregar después de `UserCreatePayload` (antes de `DashboardStats`):

```typescript
// ---- Admin Users ----

export interface UserUpdatePayload {
  username?: string;
  email?: string;
  password?: string; // Opcional en edición — solo se actualiza si se envía
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_active?: boolean;
}
```

**Nota:** `UserCreatePayload` ya existe (con `password` requerido). `UserUpdatePayload` es similar pero todos los campos son opcionales (PATCH semantics). El campo `password` es opcional — si no se envía, el backend no modifica la contraseña.

---

### 4.2 `services/admin-users.ts` — API Service

```typescript
import api from "@/lib/axios";
import type { User, PaginatedResponse } from "@/types/api";
import type { UserCreatePayload, UserUpdatePayload } from "@/types/api";

export interface AdminUserListParams {
  page?: number;
  search?: string;
  ordering?: string;
}

export async function fetchAdminUsers(
  params: AdminUserListParams = {}
): Promise<PaginatedResponse<User>> {
  const { data } = await api.get<PaginatedResponse<User>>("/api/users/", {
    params,
  });
  return data;
}

export async function fetchAdminUser(id: number): Promise<User> {
  const { data } = await api.get<User>(`/api/users/${id}/`);
  return data;
}

export async function createAdminUser(
  payload: UserCreatePayload
): Promise<User> {
  const { data } = await api.post<User>("/api/users/", payload);
  return data;
}

export async function updateAdminUser(
  id: number,
  payload: UserUpdatePayload
): Promise<User> {
  // Usamos PATCH para actualización parcial
  const { data } = await api.patch<User>(`/api/users/${id}/`, payload);
  return data;
}

export async function deleteAdminUser(id: number): Promise<void> {
  await api.delete(`/api/users/${id}/`);
}
```

**Decisiones técnicas:**
- `fetchAdminUsers` acepta `params` con `page`, `search` y `ordering` (preparado para filtro backend, aunque el backend de users es simple).
- `updateAdminUser` usa **PATCH** (no PUT) porque enviamos solo los campos modificados, incluyendo password opcional.
- `deleteAdminUser` retorna `void` porque el backend responde 204 sin body.
- No se necesita `FormData` — los datos son JSON puro (sin imágenes).
- La respuesta de create/update es siempre el objeto `User` completo.

---

### 4.3 `hooks/use-admin-users.ts` — TanStack Query Hooks

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchAdminUsers,
  fetchAdminUser,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "@/services/admin-users";
import type { AdminUserListParams } from "@/services/admin-users";
import type { UserCreatePayload, UserUpdatePayload } from "@/types/api";

export const adminUserKeys = {
  all: ["admin-users"] as const,
  lists: () => [...adminUserKeys.all, "list"] as const,
  list: (params: AdminUserListParams) => [...adminUserKeys.lists(), params] as const,
  details: () => [...adminUserKeys.all, "detail"] as const,
  detail: (id: number) => [...adminUserKeys.details(), id] as const,
};

export function useAdminUsers(params: AdminUserListParams = {}) {
  return useQuery({
    queryKey: adminUserKeys.list(params),
    queryFn: () => fetchAdminUsers(params),
  });
}

export function useAdminUser(id: number) {
  return useQuery({
    queryKey: adminUserKeys.detail(id),
    queryFn: () => fetchAdminUser(id),
    enabled: !!id && id > 0,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UserCreatePayload) => createAdminUser(payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
      toast.success(`Usuario "${user.username}" creado exitosamente`);
    },
    onError: (error: Error) => {
      const err = error as { response?: { data?: { detail?: string; username?: string[]; email?: string[] } } };
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.username?.[0] ||
        err?.response?.data?.email?.[0] ||
        "Error al crear el usuario";
      toast.error(message);
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdatePayload }) =>
      updateAdminUser(id, data),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(user.id) });
      toast.success(`Usuario "${user.username}" actualizado`);
    },
    onError: (error: Error) => {
      const err = error as { response?: { data?: { detail?: string; username?: string[]; email?: string[] } } };
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.username?.[0] ||
        err?.response?.data?.email?.[0] ||
        "Error al actualizar el usuario";
      toast.error(message);
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAdminUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
      toast.success("Usuario desactivado");
    },
    onError: (error: Error) => {
      const err = error as { response?: { data?: { detail?: string } } };
      const message =
        err?.response?.data?.detail ||
        "Error al desactivar el usuario";
      toast.error(message);
    },
  });
}
```

**Patrón de invalidación:**
- `useCreateAdminUser` → invalida lists (el nuevo usuario aparece en la tabla).
- `useUpdateAdminUser` → invalida lists + detail del id específico.
- `useDeleteAdminUser` → invalida lists (el usuario ya no aparece activo en la tabla).

**queryKey convention:**
- `["admin-users", "list", params]` para listados.
- `["admin-users", "detail", id]` para detalle.

**Manejo de errores:**
- Se extrae `detail` genérico del backend o errores específicos de campo (`username[]`, `email[]`).
- Esto cubre casos como "username already exists" o "email already registered".

---

### 4.4 `app/dashboard/users/page.tsx` — Página de listado

```tsx
import { AdminUsersTable } from "@/components/users/admin/admin-users-table";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios administradores del sistema
          </p>
        </div>
      </div>
      <AdminUsersTable />
    </div>
  );
}
```

**Nota:** Server component. La lógica de tabla es manejada por el componente cliente `AdminUsersTable`.

---

### 4.5 `components/users/admin/admin-users-table.tsx` — TanStack Table

```tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAdminUsers } from "@/hooks/use-admin-users";
import type { User } from "@/types/api";
import Link from "next/link";

const columnHelper = createColumnHelper<User>();

export function AdminUsersTable() {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date_joined", desc: true }, // Default: más reciente primero
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const { data, isLoading, isError, refetch, isFetching } = useAdminUsers();

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent font-medium"
            onClick={() => column.toggleSorting()}
          >
            ID
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">#{getValue()}</span>
        ),
      }),
      columnHelper.accessor("username", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent font-medium"
            onClick={() => column.toggleSorting()}
          >
            Usuario
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ getValue, row }) => (
          <Link
            href={`/dashboard/users/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("first_name", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent font-medium"
            onClick={() => column.toggleSorting()}
          >
            Nombre
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const first = row.original.first_name;
          const last = row.original.last_name;
          const fullName = [first, last].filter(Boolean).join(" ");
          return fullName || <span className="text-muted-foreground">—</span>;
        },
      }),
      columnHelper.accessor("is_staff", {
        header: "Staff",
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? (
            <Badge className="bg-blue-600 hover:bg-blue-700">Sí</Badge>
          ) : (
            <Badge variant="secondary">No</Badge>
          );
        },
      }),
      columnHelper.accessor("is_active", {
        header: "Activo",
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? (
            <Badge className="bg-green-600 hover:bg-green-700">Activo</Badge>
          ) : (
            <Badge variant="destructive">Inactivo</Badge>
          );
        },
      }),
      columnHelper.accessor("date_joined", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent font-medium"
            onClick={() => column.toggleSorting()}
          >
            Creado
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ getValue }) => {
          const date = new Date(getValue());
          return (
            <span className="text-sm text-muted-foreground">
              {date.toLocaleDateString("es-PE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          );
        },
      }),
    ],
    []
  );

  const tableData = useMemo(() => {
    if (!data?.results) return [];
    // Filtro client-side por búsqueda global
    if (!globalFilter) return data.results;
    const filter = globalFilter.toLowerCase();
    return data.results.filter(
      (user) =>
        user.username.toLowerCase().includes(filter) ||
        user.email.toLowerCase().includes(filter) ||
        user.first_name?.toLowerCase().includes(filter) ||
        user.last_name?.toLowerCase().includes(filter)
    );
  }, [data, globalFilter]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 w-full bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error al cargar</h2>
        <p className="text-muted-foreground mb-4">
          No pudimos obtener los usuarios. Intenta nuevamente.
        </p>
        <Button onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: búsqueda + nuevo */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link href="/dashboard/users/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo usuario
          </Button>
        </Link>
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    row.original.is_active
                      ? "cursor-pointer hover:bg-muted/50"
                      : "cursor-pointer hover:bg-muted/50 opacity-60 bg-muted/30"
                  }
                  onClick={() => router.push(`/dashboard/users/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {globalFilter
                    ? "No se encontraron usuarios con ese criterio de búsqueda."
                    : "No hay usuarios registrados."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data?.count ?? 0} usuario(s) en total
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Decisiones técnicas:**
- Paginación **client-side** con `getPaginationRowModel` (similar a plushies-admin, no a orders-admin). El backend de users devuelve paginado, pero para este módulo manejamos el filtrado y paginación client-side por simplicidad (los usuarios no suelen ser miles).
- Búsqueda global client-side: filtra por `username`, `email`, `first_name`, `last_name`.
- Usuarios inactivos aparecen con opacidad reducida (`opacity-60 bg-muted/30`), similar a plushies eliminados.
- Click en fila navega a detalle/edición.
- Badge azul para `is_staff=Sí`, badge verde para `is_active=Activo`, badge destructive para `is_active=Inactivo`.
- Columna "Nombre" combina `first_name + last_name`.

---

### 4.6 `components/users/admin/user-form.tsx` — Formulario de creación/edición

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { User } from "@/types/api";
import type { UserCreatePayload, UserUpdatePayload } from "@/types/api";

// Schema de creación: password requerido
const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  email: z.string().email("Ingresa un email válido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
  first_name: z.string().optional().default(""),
  last_name: z.string().optional().default(""),
  is_staff: z.boolean().optional().default(false),
});

// Schema de edición: password opcional
const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  email: z.string().email("Ingresa un email válido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .optional()
    .or(z.literal("")),
  first_name: z.string().optional().default(""),
  last_name: z.string().optional().default(""),
  is_staff: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

type CreateFormValues = z.infer<typeof createUserSchema>;
type UpdateFormValues = z.infer<typeof updateUserSchema>;

interface UserFormProps {
  initialData?: User;
  onSubmit: (data: UserCreatePayload | UserUpdatePayload) => Promise<void>;
  isSubmitting: boolean;
}

export function UserForm({ initialData, onSubmit, isSubmitting }: UserFormProps) {
  const isEditing = !!initialData;

  // Usar schema adecuado según modo
  const formSchema = isEditing ? updateUserSchema : createUserSchema;
  type FormValues = isEditing extends true ? UpdateFormValues : CreateFormValues;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: initialData?.username ?? "",
      email: initialData?.email ?? "",
      password: "",
      first_name: initialData?.first_name ?? "",
      last_name: initialData?.last_name ?? "",
      is_staff: initialData?.is_staff ?? false,
      ...(isEditing ? { is_active: initialData?.is_active ?? true } : {}),
    } as FormValues,
  });

  const currentIsStaff = watch("is_staff");
  const currentIsActive = watch("is_active");

  const onFormSubmit = (values: FormValues) => {
    if (isEditing) {
      const payload: Record<string, unknown> = {
        username: values.username,
        email: values.email,
        first_name: values.first_name || "",
        last_name: values.last_name || "",
        is_staff: values.is_staff,
        is_active: (values as UpdateFormValues).is_active,
      };
      // Solo incluir password si se ingresó una
      if (values.password && values.password.length >= 6) {
        payload.password = values.password;
      }
      onSubmit(payload as UserUpdatePayload);
    } else {
      const payload: UserCreatePayload = {
        username: values.username,
        email: values.email,
        password: values.password!,
        first_name: values.first_name || undefined,
        last_name: values.last_name || undefined,
        is_staff: values.is_staff,
      };
      onSubmit(payload);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar usuario" : "Nuevo usuario"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Modifica los datos del usuario administrador"
            : "Completa los datos para crear un nuevo usuario"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">
              Nombre de usuario <span className="text-destructive">*</span>
            </Label>
            <Input
              id="username"
              placeholder="Ej: operador1"
              {...register("username")}
            />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Ej: operador@ejemplo.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Contraseña {!isEditing && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={
                isEditing
                  ? "Dejar vacío para no cambiar"
                  : "Mínimo 6 caracteres"
              }
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Deja este campo vacío si no deseas cambiar la contraseña.
              </p>
            )}
          </div>

          {/* Nombre y Apellido en grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre</Label>
              <Input
                id="first_name"
                placeholder="Ej: Carlos"
                {...register("first_name")}
              />
              {errors.first_name && (
                <p className="text-sm text-destructive">
                  {errors.first_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido</Label>
              <Input
                id="last_name"
                placeholder="Ej: López"
                {...register("last_name")}
              />
              {errors.last_name && (
                <p className="text-sm text-destructive">
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_staff"
                className="h-4 w-4 rounded border-gray-300"
                checked={currentIsStaff ?? false}
                onChange={(e) => setValue("is_staff", e.target.checked)}
              />
              <Label htmlFor="is_staff" className="cursor-pointer">
                ¿Puede acceder al panel de administración?
              </Label>
            </div>

            {isEditing && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={currentIsActive ?? true}
                  onChange={(e) => setValue("is_active", e.target.checked)}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Usuario activo
                </Label>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting
                ? "Guardando..."
                : isEditing
                ? "Guardar cambios"
                : "Crear usuario"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Decisiones técnicas:**
- Dos schemas Zod: `createUserSchema` (password requerido) y `updateUserSchema` (password opcional, acepta string vacío).
- En edición, el campo password tiene placeholder "Dejar vacío para no cambiar" + texto de ayuda.
- `is_staff` checkbox: controla si el usuario puede acceder al admin.
- `is_active` checkbox: solo visible en edición (en creación siempre se crea activo).
- Los campos `first_name` y `last_name` se envían como string vacío si no se completan (el backend los acepta como string vacío o null).
- Se usa `Record<string, unknown>` para construir el payload de edición y enviar solo los campos modificados (incluyendo password opcional).

---

### 4.7 `components/users/admin/delete-user-dialog.tsx` — Diálogo de confirmación

```tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  onConfirm: () => Promise<void>;
  isPending: boolean;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  username,
  onConfirm,
  isPending,
}: DeleteUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desactivar usuario</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas desactivar a <strong>{username}</strong>?
            <br />
            El usuario dejará de poder acceder al panel de administración,
            pero sus datos se conservan. Puedes reactivarlo después editando
            el usuario.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            {isPending ? "Desactivando..." : "Desactivar usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Decisiones técnicas:**
- Texto adaptado a soft-delete: "Desactivar" en vez de "Eliminar".
- Explica explícitamente que es un soft-delete (is_active=false).
- Muestra el nombre de usuario a desactivar.

---

### 4.8 `app/dashboard/users/new/page.tsx` — Página de creación

```tsx
"use client";

import { useRouter } from "next/navigation";
import { UserForm } from "@/components/users/admin/user-form";
import { useCreateAdminUser } from "@/hooks/use-admin-users";
import type { UserCreatePayload, UserUpdatePayload } from "@/types/api";

export default function NewUserPage() {
  const router = useRouter();
  const createMutation = useCreateAdminUser();

  const handleSubmit = async (data: UserCreatePayload | UserUpdatePayload) => {
    await createMutation.mutateAsync(data as UserCreatePayload);
    router.push("/dashboard/users");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Usuario</h1>
        <p className="text-muted-foreground">
          Agrega un nuevo usuario administrador al sistema
        </p>
      </div>
      <UserForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
```

**Flujo:**
1. Renderiza `UserForm` sin `initialData` → modo creación.
2. Submit → `createMutation.mutateAsync` → redirige a `/dashboard/users`.
3. Si error → toast con mensaje (manejado en el hook).

---

### 4.9 `app/dashboard/users/[id]/page.tsx` — Página de detalle y edición

```tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { UserForm } from "@/components/users/admin/user-form";
import { DeleteUserDialog } from "@/components/users/admin/delete-user-dialog";
import {
  useAdminUser,
  useUpdateAdminUser,
  useDeleteAdminUser,
} from "@/hooks/use-admin-users";
import type { UserUpdatePayload } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Trash2,
  Shield,
  ShieldOff,
  UserCog,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const userId = Number(id);

  const { data: user, isLoading, isError, refetch, isFetching } = useAdminUser(userId);
  const updateMutation = useUpdateAdminUser();
  const deleteMutation = useDeleteAdminUser();

  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleSubmit = async (data: UserUpdatePayload) => {
    await updateMutation.mutateAsync({ id: userId, data });
    router.push("/dashboard/users");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        <div className="space-y-4">
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Usuario no encontrado</h2>
        <p className="text-muted-foreground mb-6">
          El usuario que buscas no existe o ha sido eliminado.
        </p>
        <div className="flex gap-4">
          <Link href="/dashboard/users">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al listado
            </Button>
          </Link>
          <Button onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const createdDate = new Date(user.date_joined).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      {/* Header con información del usuario */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{user.username}</h1>
            <p className="text-muted-foreground">
              {user.first_name || user.last_name
                ? [user.first_name, user.last_name].filter(Boolean).join(" ")
                : user.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user.is_superuser && (
            <Badge className="bg-purple-600 hover:bg-purple-700 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Superadmin
            </Badge>
          )}
          {user.is_staff ? (
            <Badge className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1">
              <UserCog className="h-3 w-3" />
              Staff
            </Badge>
          ) : null}
          {user.is_active ? (
            <Badge className="bg-green-600 hover:bg-green-700">Activo</Badge>
          ) : (
            <Badge variant="destructive">Inactivo</Badge>
          )}
        </div>
      </div>

      {/* Info adicional */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        Registrado el {createdDate}
      </div>

      {/* Formulario de edición */}
      <UserForm
        initialData={user}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />

      {/* Zona de peligro: eliminar usuario */}
      {!user.is_superuser && (
        <div className="border border-destructive/20 rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold text-destructive">Zona de peligro</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Desactivar este usuario evitará que pueda acceder al panel de administración.
            Puedes reactivarlo después editando su perfil.
          </p>
          <Button
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Desactivar usuario
          </Button>
        </div>
      )}

      {user.is_superuser && (
        <div className="border border-muted rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Superadmin</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Los usuarios superadministradores no pueden ser desactivados desde esta interfaz.
          </p>
        </div>
      )}

      <DeleteUserDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        username={user.username}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(userId);
          router.push("/dashboard/users");
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
```

**Decisiones técnicas:**
- Header muestra nombre de usuario + badges de estado (is_superuser, is_staff, is_active).
- Fecha de registro formateada.
- **Zona de peligro**: sección separada visualmente con borde rojo para la acción de eliminar.
- Los superadmin (`is_superuser`) no pueden ser eliminados desde la UI → se muestra mensaje informativo.
- El formulario de edición permite modificar todos los campos incluyendo `is_active`.
- Badge especial morado para superadmin con ícono `Shield`.

---

## 5. Reglas de negocio y validaciones

### 5.1 Validaciones del formulario (Zod)

| Campo | Creación | Edición |
|-------|----------|---------|
| `username` | Requerido, min 3 caracteres | Requerido, min 3 caracteres |
| `email` | Requerido, formato email válido | Requerido, formato email válido |
| `password` | Requerido, min 6 caracteres | Opcional, min 6 si se ingresa |
| `first_name` | Opcional | Opcional |
| `last_name` | Opcional | Opcional |
| `is_staff` | Checkbox (default false) | Checkbox editable |
| `is_active` | No se muestra (default true) | Checkbox editable |

### 5.2 Reglas de negocio

| Regla | Implementación |
|-------|----------------|
| Soft-delete | DELETE cambia `is_active=false`, no elimina el registro |
| No self-delete | El backend valida que un usuario no se elimine a sí mismo → mostrar error toast |
| Superadmin protegido | En edición, si `is_superuser=true`, ocultar botón de eliminar y mostrar mensaje |
| Password no se muestra | Nunca renderizar el password en listado ni detalle. En edición, campo vacío = no cambiar |
| Email único | El backend valida unicidad → mostrar error con toast |
| Username único | El backend valida unicidad → mostrar error con toast |
| is_staff=false no puede acceder | El backend maneja permisos automáticamente |

### 5.3 Validaciones de UI

| Situación | Comportamiento |
|-----------|----------------|
| Usuario inactivo en tabla | Fila con opacidad reducida (`opacity-60`) |
| Superadmin en edición | Badge morado + sección de zona peligro reemplazada por mensaje informativo |
| Password vacío en edición | No se incluye en el payload PATCH |
| Error de unicidad (username/email) | Toast con mensaje específico del campo |

---

## 6. Flujo de navegación

```
[/dashboard] Dashboard
  └── Sidebar "Usuarios" → [/dashboard/users]

[/dashboard/users] Listado
  ├── Búsqueda → filtra client-side por username/email/nombre
  ├── Sort por columna → sort client-side
  ├── Paginación → navega páginas
  ├── Click fila → [/dashboard/users/{id}]
  └── "Nuevo usuario" → [/dashboard/users/new]

[/dashboard/users/new] Creación
  ├── Formulario con campos requeridos + opcionales
  ├── Submit → POST → toast éxito → redirect a [/dashboard/users]
  └── Error → toast con mensaje

[/dashboard/users/{id}] Detalle/Edición
  ├── Header con username + badges (superadmin, staff, activo)
  ├── Formulario precargado para editar
  ├── Submit → PATCH → toast éxito → redirect a [/dashboard/users]
  ├── Error → toast con mensaje
  ├── "Desactivar usuario" (zona peligro) → DeleteUserDialog
  │   └── Confirmar → DELETE → toast éxito → redirect a [/dashboard/users]
  └── Si es superadmin → no muestra botón eliminar, solo mensaje informativo
```

---

## 7. Componentes shadcn/ui adicionales necesarios

**Ya instalados en `components/ui/`:**
- `badge.tsx` ✅
- `button.tsx` ✅
- `card.tsx` ✅
- `dialog.tsx` ✅
- `input.tsx` ✅
- `label.tsx` ✅
- `table.tsx` ✅

**No requiere instalar ningún componente adicional.**

**Íconos lucide-react necesarios (todos disponibles en lucide-react):**
- `ArrowUpDown` — sort indicator
- `ChevronLeft`, `ChevronRight` — paginación
- `Plus` — nuevo usuario
- `Search` — búsqueda
- `AlertCircle` — error
- `RefreshCw` — reintentar
- `ArrowLeft` — volver
- `Trash2` — eliminar/desactivar
- `Loader2` — spinner
- `Shield` — superadmin badge
- `ShieldOff` — superadmin protegido
- `UserCog` — staff badge
- `Calendar` — fecha de registro

---

## 8. Estados de los componentes

### AdminUsersTable (listado)

```
┌─────────────────────────────────────────┐
│           AdminUsersTable               │
│                                         │
│  ┌─ LOADING ────────────────────────┐  │
│  │  Skeleton: 1 toolbar + 5 rows    │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌─ ERROR ──────────────────────────┐  │
│  │  Icono alerta + mensaje           │  │
│  │  Botón "Reintentar"               │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌─ EMPTY ──────────────────────────┐  │
│  │  Mensaje: "No hay usuarios..."    │  │
│  │  o "No se encontraron usuarios..."│  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌─ SUCCESS ────────────────────────┐  │
│  │  Tabla con datos + paginación     │  │
│  │  Búsqueda + botón nuevo usuario   │  │
│  │  Usuarios inactivos: opacidad     │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### EditUserPage (detalle/edición)

```
┌─────────────────────────────────────────┐
│          EditUserPage                   │
│                                         │
│  ┌─ LOADING ────────────────────────┐  │
│  │  Skeleton: header + 3 inputs     │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌─ ERROR ──────────────────────────┐  │
│  │  "Usuario no encontrado"          │  │
│  │  Botones: Volver + Reintentar     │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌─ SUCCESS ────────────────────────┐  │
│  │  Header: username + badges        │  │
│  │  Fecha de registro                │  │
│  │  Formulario de edición            │  │
│  │  ┌─ Si superadmin ────────────┐   │  │
│  │  │  Mensaje informativo        │   │  │
│  │  └────────────────────────────┘   │  │
│  │  ┌─ Si no superadmin ─────────┐   │  │
│  │  │  Zona peligro + botón       │   │  │
│  │  └────────────────────────────┘   │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌─ DELETING (sub-estado) ──────────┐  │
│  │  Diálogo abierto + spinner        │  │
│  │  Botón: "Desactivando..."         │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### UserForm (creación y edición)

```
┌─────────────────────────────────────────┐
│            UserForm                     │
│                                         │
│  ┌─ CREATE MODE ────────────────────┐  │
│  │  Campos: username*, email*,       │  │
│  │  password*, nombre, apellido      │  │
│  │  Checkbox: is_staff               │  │
│  │  NO checkbox: is_active           │  │
│  │  Botón: "Crear usuario"           │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌─ EDIT MODE ──────────────────────┐  │
│  │  Mismos campos + password opcional│  │
│  │  Checkbox: is_active visible      │  │
│  │  Ayuda: "Dejar vacío para..."     │  │
│  │  Botón: "Guardar cambios"         │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌─ SUBMITTING ─────────────────────┐  │
│  │  Botón deshabilitado + spinner    │  │
│  │  "Guardando..."                   │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌─ VALIDATION ERROR ───────────────┐  │
│  │  Mensajes rojos debajo de inputs  │  │
│  │  Botón submit habilitado          │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 9. Notas técnicas importantes

### 9.1 Paginación client-side

A diferencia del módulo orders-admin que usa paginación server-side, **users-admin usa paginación client-side** (similar a plushies-admin). El backend devuelve datos paginados en `results`, pero el frontend carga la página completa y maneja paginación/filtro client-side con TanStack Table. Esto es suficiente porque los usuarios del sistema no suelen ser más de unas docenas.

### 9.2 Filtro de búsqueda

La búsqueda global filtra client-side por:
- `username`
- `email`
- `first_name`
- `last_name`

Usa `toLowerCase()` para case-insensitive.

### 9.3 Password opcional en edición

En el formulario de edición:
- El campo password tiene placeholder "Dejar vacío para no cambiar".
- Si el usuario ingresa un password (≥ 6 caracteres), se incluye en el payload PATCH.
- Si el campo está vacío, no se incluye en el payload (el backend no modifica el password).

### 9.4 Sin Zustand store

No se necesita store para este módulo. TanStack Query cache es suficiente. El estado global de auth ya está cubierto por `stores/auth.ts`.

### 9.5 Sidebar

El sidebar ya tiene el link "Usuarios" → `/dashboard/users` con icono `Users`. No requiere modificación.

```typescript
// Ya existe en sidebar.tsx:
{ href: "/dashboard/users", label: "Usuarios", icon: Users },
```

### 9.6 Server vs Client components

- `app/dashboard/users/page.tsx` → Server Component (no tiene interactividad directa, delega en `AdminUsersTable`).
- `app/dashboard/users/new/page.tsx` → Client Component (`"use client"`) porque usa hooks y formulario.
- `app/dashboard/users/[id]/page.tsx` → Client Component (`"use client"`) porque usa hooks, estado, y navegación.
- Todos los componentes en `components/users/admin/` → Client Components.

### 9.7 PUT vs PATCH

Usamos **PATCH** (no PUT) para la actualización:
- El payload solo incluye los campos que el usuario modificó.
- El campo `password` se incluye solo si se ingresó un valor.
- El backend de Django REST Framework maneja PATCH correctamente (actualización parcial).

### 9.8 Protección de superadmin

El superadmin (`is_superuser=true`) no puede ser eliminado desde la UI:
- En `EditUserPage`, si `user.is_superuser` es true, se muestra un mensaje informativo en lugar del botón de eliminar.
- El backend también debe proteger este endpoint (validación server-side).
- Si el usuario actual intenta eliminarse a sí mismo, el backend retorna error 400 con mensaje `detail`.

---

## 10. Criterios de aceptación

### Funcionales

- [ ] `/dashboard/users` muestra tabla con todos los usuarios.
- [ ] Columnas: ID, Usuario (link), Email, Nombre, Staff (badge), Activo (badge), Creado.
- [ ] Badges: Staff=Sí (azul) / No (secondary), Activo=Activo (verde) / Inactivo (destructive).
- [ ] Búsqueda global filtra por username, email, nombre, apellido.
- [ ] Sort por ID, Usuario, Nombre, Creado (sort client-side).
- [ ] Orden por defecto: más reciente primero (`date_joined` descendente).
- [ ] Paginación client-side funcional (10 items por página).
- [ ] Click en fila navega a `/dashboard/users/[id]`.
- [ ] Botón "Nuevo usuario" navega a `/dashboard/users/new`.
- [ ] Usuarios inactivos aparecen con opacidad reducida.
- [ ] `/dashboard/users/new` muestra formulario de creación.
- [ ] Validación Zod: username (min 3), email (formato), password (min 6).
- [ ] Submit exitoso → toast + redirect al listado.
- [ ] Error de submit → toast con mensaje de error.
- [ ] `/dashboard/users/[id]` muestra datos del usuario + formulario de edición.
- [ ] Header con username, badges (superadmin, staff, activo), fecha de registro.
- [ ] Password opcional en edición (placeholder + texto de ayuda).
- [ ] Checkbox `is_active` visible solo en edición.
- [ ] Zona de peligro con botón "Desactivar usuario" al final.
- [ ] Superadmin no muestra botón de eliminar (solo mensaje informativo).
- [ ] Diálogo de confirmación para desactivar usuario.
- [ ] Delete exitoso → toast "Usuario desactivado" + redirect al listado.
- [ ] Estados loading (skeleton/pulse) en tabla y detalle.
- [ ] Estados error con mensaje + botón reintentar.
- [ ] Estado empty: "No hay usuarios registrados" o "No se encontraron usuarios con ese criterio de búsqueda".

### Técnicos

- [ ] `services/admin-users.ts` exporta todas las funciones API (CRUD).
- [ ] `hooks/use-admin-users.ts` exporta hooks con queryKey convention.
- [ ] `useCreateAdminUser` invalida lists.
- [ ] `useUpdateAdminUser` invalida lists + detail del id correspondiente.
- [ ] `useDeleteAdminUser` invalida lists.
- [ ] `UserUpdatePayload` agregado a `types/api.ts`.
- [ ] Manejo de errores extrae `detail`, `username[]` y `email[]` del backend.
- [ ] Password nunca se muestra en UI ni en payload si está vacío (edición).
- [ ] Sin fugas de estado: navegar entre usuarios no mezcla datos.
- [ ] `npm run build` sin errores.
- [ ] `npm run lint` sin errores.

---

## 11. Orden de implementación sugerido

```
1. types/api.ts (agregar UserUpdatePayload)
2. services/admin-users.ts
3. hooks/use-admin-users.ts
4. components/users/admin/delete-user-dialog.tsx
5. components/users/admin/user-form.tsx
6. components/users/admin/admin-users-table.tsx
7. app/dashboard/users/page.tsx
8. app/dashboard/users/new/page.tsx
9. app/dashboard/users/[id]/page.tsx
```
