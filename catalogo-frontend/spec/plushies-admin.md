# Spec: Plushies — Admin CRUD

## 1. Resumen del módulo

Panel administrativo para gestionar el catálogo completo de peluches (Fase 4 del MVP).

Incluye gestión de todos los peluches (activos, inactivos y eliminados) con operaciones CRUD completas, activar/desactivar, y soft-delete.

**Endpoints que consume (todos requieren JWT Bearer):**

| Método | Ruta | Propósito |
|--------|------|-----------|
| GET | `/api/admin/plushies/` | Lista paginada (todos los estados) |
| POST | `/api/admin/plushies/` | Crear (multipart/form-data) |
| GET | `/api/admin/plushies/{id}/` | Detalle |
| PUT | `/api/admin/plushies/{id}/` | Actualizar completo |
| PATCH | `/api/admin/plushies/{id}/` | Actualizar parcial |
| DELETE | `/api/admin/plushies/{id}/` | Soft-delete (`is_deleted=true`) |
| PATCH | `/api/admin/plushies/{id}/activate/` | Activar |
| PATCH | `/api/admin/plushies/{id}/deactivate/` | Desactivar |

**Rutas del módulo:**

| Ruta | Tipo | Propósito |
|------|------|-----------|
| `/dashboard/plushies` | 🔒 Protegida | Listado con TanStack Table |
| `/dashboard/plushies/new` | 🔒 Protegida | Formulario de creación |
| `/dashboard/plushies/[id]` | 🔒 Protegida | Detalle y edición |

---

## 2. Archivos a crear (8 archivos)

| # | Ruta | Propósito |
|---|------|-----------|
| 1 | `services/admin-plushies.ts` | API service para endpoints admin de plushies |
| 2 | `hooks/use-admin-plushies.ts` | TanStack Query hooks |
| 3 | `app/dashboard/plushies/page.tsx` | Página de listado (TanStack Table) |
| 4 | `app/dashboard/plushies/new/page.tsx` | Página de creación |
| 5 | `app/dashboard/plushies/[id]/page.tsx` | Página de detalle/edición |
| 6 | `components/plushies/admin/admin-plushies-table.tsx` | TanStack Table |
| 7 | `components/plushies/admin/plushie-form.tsx` | Formulario create/edit |
| 8 | `components/plushies/admin/delete-dialog.tsx` | Diálogo de confirmación |

---

## 3. Archivos a modificar (1 archivo)

| # | Ruta | Cambio |
|---|------|--------|
| 1 | `types/api.ts` | Agregar `AdminPlushieUpdatePayload` y `AdminPlushieCreatePayload` interfaces |

---

## 4. Detalle de cada archivo

### 4.1 `types/api.ts` — Agregar tipos de payload

Agregar al final del archivo, antes de los comentarios de Auth:

```typescript
// ---- Admin Plushies ----

export interface AdminPlushieCreatePayload {
  name: string;
  description?: string | null;
  price: string;
  stock: number;
  is_active?: boolean;
  image?: File | null;
}

export interface AdminPlushieUpdatePayload {
  name?: string;
  description?: string | null;
  price?: string;
  stock?: number;
  is_active?: boolean;
  image?: File | null;
}
```

**Nota:** El tipo `Plushie` existente ya incluye `is_active?` e `is_deleted?`. Es suficiente para el renderizado. Los payloads nuevos sirven para tipar los formularios.

### 4.2 `services/admin-plushies.ts` — API Service

```typescript
import api from "@/lib/axios";
import type { Plushie, PaginatedResponse } from "@/types/api";
import type { AdminPlushieCreatePayload, AdminPlushieUpdatePayload } from "@/types/api";

export interface AdminPlushieListParams {
  page?: number;
  search?: string;
  ordering?: string;
}

/**
 * Construye FormData para crear/actualizar plushies con imagen.
 * Si image es null, envía el campo como string vacío para limpiar.
 * Si image es undefined, no lo incluye (no cambia).
 */
function buildFormData(data: AdminPlushieCreatePayload | AdminPlushieUpdatePayload): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (key === "image" && value === null) {
      // Enviar string vacío para limpiar la imagen
      formData.append(key, "");
    } else if (key === "image" && value instanceof File) {
      formData.append(key, value);
    } else if (value !== null) {
      formData.append(key, String(value));
    }
  }
  return formData;
}

export async function fetchAdminPlushies(
  params: AdminPlushieListParams = {}
): Promise<PaginatedResponse<Plushie>> {
  const { data } = await api.get<PaginatedResponse<Plushie>>("/api/admin/plushies/", {
    params,
  });
  return data;
}

export async function fetchAdminPlushie(id: number): Promise<Plushie> {
  const { data } = await api.get<Plushie>(`/api/admin/plushies/${id}/`);
  return data;
}

export async function createAdminPlushie(
  payload: AdminPlushieCreatePayload
): Promise<Plushie> {
  const formData = buildFormData(payload);
  const { data } = await api.post<Plushie>("/api/admin/plushies/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateAdminPlushie(
  id: number,
  payload: AdminPlushieUpdatePayload
): Promise<Plushie> {
  const formData = buildFormData(payload);
  const { data } = await api.put<Plushie>(`/api/admin/plushies/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteAdminPlushie(id: number): Promise<void> {
  await api.delete(`/api/admin/plushies/${id}/`);
}

export async function activateAdminPlushie(id: number): Promise<Plushie> {
  const { data } = await api.patch<Plushie>(`/api/admin/plushies/${id}/activate/`);
  return data;
}

export async function deactivateAdminPlushie(id: number): Promise<Plushie> {
  const { data } = await api.patch<Plushie>(`/api/admin/plushies/${id}/deactivate/`);
  return data;
}
```

**Decisiones técnicas:**
- `PUT` en vez de `PATCH` para el formulario de edición completa (envía todos los campos). El backend soporta ambos, pero PUT es más seguro para el update completo.
- `FormData` siempre para soportar subida de imágenes.
- `image: null` → envía string vacío para limpiar imagen. `image: undefined` → no lo incluye.
- `buildFormData()` convierte booleanos a string ("true"/"false") para el backend.

### 4.3 `hooks/use-admin-plushies.ts` — TanStack Query Hooks

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchAdminPlushies,
  fetchAdminPlushie,
  createAdminPlushie,
  updateAdminPlushie,
  deleteAdminPlushie,
  activateAdminPlushie,
  deactivateAdminPlushie,
} from "@/services/admin-plushies";
import type { AdminPlushieListParams } from "@/services/admin-plushies";
import type { AdminPlushieCreatePayload, AdminPlushieUpdatePayload } from "@/types/api";

export const adminPlushieKeys = {
  all: ["admin-plushies"] as const,
  lists: () => [...adminPlushieKeys.all, "list"] as const,
  list: (params: AdminPlushieListParams) => [...adminPlushieKeys.lists(), params] as const,
  details: () => [...adminPlushieKeys.all, "detail"] as const,
  detail: (id: number) => [...adminPlushieKeys.details(), id] as const,
};

export function useAdminPlushies(params: AdminPlushieListParams = {}) {
  return useQuery({
    queryKey: adminPlushieKeys.list(params),
    queryFn: () => fetchAdminPlushies(params),
  });
}

export function useAdminPlushie(id: number) {
  return useQuery({
    queryKey: adminPlushieKeys.detail(id),
    queryFn: () => fetchAdminPlushie(id),
    enabled: !!id && id > 0,
  });
}

export function useCreateAdminPlushie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminPlushieCreatePayload) => createAdminPlushie(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPlushieKeys.lists() });
      toast.success("Peluche creado exitosamente");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.name?.[0] ||
        "Error al crear el peluche";
      toast.error(message);
    },
  });
}

export function useUpdateAdminPlushie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdminPlushieUpdatePayload }) =>
      updateAdminPlushie(id, data),
    onSuccess: (plushie) => {
      queryClient.invalidateQueries({ queryKey: adminPlushieKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminPlushieKeys.detail(plushie.id) });
      toast.success("Peluche actualizado exitosamente");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.name?.[0] ||
        "Error al actualizar el peluche";
      toast.error(message);
    },
  });
}

export function useDeleteAdminPlushie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAdminPlushie(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPlushieKeys.lists() });
      toast.success("Peluche eliminado");
    },
    onError: () => {
      toast.error("Error al eliminar el peluche");
    },
  });
}

export function useActivateAdminPlushie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => activateAdminPlushie(id),
    onSuccess: (plushie) => {
      queryClient.invalidateQueries({ queryKey: adminPlushieKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminPlushieKeys.detail(plushie.id) });
      toast.success("Peluche activado");
    },
    onError: () => {
      toast.error("Error al activar el peluche");
    },
  });
}

export function useDeactivateAdminPlushie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deactivateAdminPlushie(id),
    onSuccess: (plushie) => {
      queryClient.invalidateQueries({ queryKey: adminPlushieKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminPlushieKeys.detail(plushie.id) });
      toast.success("Peluche desactivado");
    },
    onError: () => {
      toast.error("Error al desactivar el peluche");
    },
  });
}
```

**Patrón de invalidación:**
- `useCreateAdminPlushie` → invalida solo lists (el nuevo item aparece en la lista).
- `useUpdateAdminPlushie` → invalida lists + detail del id específico.
- `useDeleteAdminPlushie` → invalida lists (el item ya no debe aparecer en la tabla).
- `useActivateAdminPlushie` / `useDeactivateAdminPlushie` → invalida lists + detail del id.

### 4.4 `app/dashboard/plushies/page.tsx` — Página de listado

```tsx
import { AdminPlushiesTable } from "@/components/plushies/admin/admin-plushies-table";

export default function AdminPlushiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Peluches</h1>
          <p className="text-muted-foreground">
            Gestiona el catálogo completo de peluches
          </p>
        </div>
      </div>
      <AdminPlushiesTable />
    </div>
  );
}
```

**Nota:** Server component. La lógica de tabla es manejada por el componente cliente.

### 4.5 `app/dashboard/plushies/new/page.tsx` — Página de creación

```tsx
"use client";

import { useRouter } from "next/navigation";
import { PlushieForm } from "@/components/plushies/admin/plushie-form";
import { useCreateAdminPlushie } from "@/hooks/use-admin-plushies";
import type { AdminPlushieCreatePayload } from "@/types/api";

export default function NewPlushiePage() {
  const router = useRouter();
  const createMutation = useCreateAdminPlushie();

  const handleSubmit = async (data: AdminPlushieCreatePayload) => {
    await createMutation.mutateAsync(data);
    router.push("/dashboard/plushies");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Peluche</h1>
        <p className="text-muted-foreground">
          Agrega un nuevo peluche al catálogo
        </p>
      </div>
      <PlushieForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
```

### 4.6 `app/dashboard/plushies/[id]/page.tsx` — Página de detalle/edición

```tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { PlushieForm } from "@/components/plushies/admin/plushie-form";
import { DeleteDialog } from "@/components/plushies/admin/delete-dialog";
import {
  useAdminPlushie,
  useUpdateAdminPlushie,
  useDeleteAdminPlushie,
  useActivateAdminPlushie,
  useDeactivateAdminPlushie,
} from "@/hooks/use-admin-plushies";
import type { AdminPlushieUpdatePayload } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton"; // ← puede que no exista, ver nota
import { ArrowLeft, AlertCircle, RefreshCw, Power, PowerOff, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function EditPlushiePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const plushieId = Number(id);

  const { data: plushie, isLoading, isError, refetch, isFetching } = useAdminPlushie(plushieId);
  const updateMutation = useUpdateAdminPlushie();
  const deleteMutation = useDeleteAdminPlushie();
  const activateMutation = useActivateAdminPlushie();
  const deactivateMutation = useDeactivateAdminPlushie();

  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleSubmit = async (data: AdminPlushieUpdatePayload) => {
    await updateMutation.mutateAsync({ id: plushieId, data });
    router.push("/dashboard/plushies");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        <div className="space-y-4">
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
          <div className="h-32 w-full bg-muted rounded animate-pulse" />
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !plushie) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Peluche no encontrado</h2>
        <p className="text-muted-foreground mb-6">
          El peluche que buscas no existe o ha sido eliminado.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/plushies">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al listado
            </Link>
          </Button>
          <Button onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Si está eliminado (soft-delete), mostrar bloqueado
  const isDeleted = plushie.is_deleted;
  const isActive = plushie.is_active;

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/plushies">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{plushie.name}</h1>
            <p className="text-muted-foreground">Editar peluche</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDeleted ? (
            <Badge variant="destructive">Eliminado</Badge>
          ) : isActive ? (
            <>
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">Activo</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deactivateMutation.mutate(plushieId)}
                disabled={deactivateMutation.isPending}
              >
                <PowerOff className="mr-2 h-4 w-4" />
                Desactivar
              </Button>
            </>
          ) : (
            <>
              <Badge variant="secondary">Inactivo</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => activateMutation.mutate(plushieId)}
                disabled={activateMutation.isPending}
              >
                <Power className="mr-2 h-4 w-4" />
                Activar
              </Button>
            </>
          )}

          {!isDeleted && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* Formulario de edición */}
      <PlushieForm
        initialData={plushie}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        plushieName={plushie.name}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(plushieId);
          router.push("/dashboard/plushies");
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
```

**Nota sobre Skeleton:** Si el componente `Skeleton` de shadcn/ui no está instalado, usar divs con `animate-pulse` y `bg-muted` como se ve arriba. No requiere instalación adicional.

### 4.7 `components/plushies/admin/admin-plushies-table.tsx` — TanStack Table

```tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
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
  Pencil,
  Trash2,
  Eye,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAdminPlushies } from "@/hooks/use-admin-plushies";
import { useDeleteAdminPlushie, useActivateAdminPlushie, useDeactivateAdminPlushie } from "@/hooks/use-admin-plushies";
import { DeleteDialog } from "@/components/plushies/admin/delete-dialog";
import type { Plushie } from "@/types/api";

const columnHelper = createColumnHelper<Plushie>();

export function AdminPlushiesTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [deleteTarget, setDeleteTarget] = useState<Plushie | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useAdminPlushies();
  const deleteMutation = useDeleteAdminPlushie();
  const activateMutation = useActivateAdminPlushie();
  const deactivateMutation = useDeactivateAdminPlushie();

  const columns = useMemo(
    () => [
      columnHelper.accessor("image", {
        header: "Imagen",
        enableSorting: false,
        cell: ({ getValue }) => {
          const imageUrl = getValue();
          return (
            <div className="h-12 w-12 rounded-md overflow-hidden bg-muted">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                  —
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("name", {
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
        cell: ({ getValue, row }) => (
          <Link
            href={`/dashboard/plushies/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("price", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent font-medium"
            onClick={() => column.toggleSorting()}
          >
            Precio
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ getValue }) => `S/ ${getValue()}`,
      }),
      columnHelper.accessor("stock", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent font-medium"
            onClick={() => column.toggleSorting()}
          >
            Stock
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ getValue }) => {
          const stock = getValue();
          return (
            <span className={stock === 0 ? "text-destructive font-medium" : ""}>
              {stock}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "status",
        header: "Estado",
        cell: ({ row }) => {
          const { is_active, is_deleted } = row.original;
          if (is_deleted) return <Badge variant="destructive">Eliminado</Badge>;
          if (is_active) return <Badge className="bg-green-600 hover:bg-green-700">Activo</Badge>;
          return <Badge variant="secondary">Inactivo</Badge>;
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => {
          const plushie = row.original;
          const isDeleted = plushie.is_deleted;
          const isActive = plushie.is_active;

          return (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/dashboard/plushies/${plushie.id}`}>
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Ver</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/dashboard/plushies/${plushie.id}`}>
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Editar</span>
                </Link>
              </Button>
              {!isDeleted && (
                <>
                  {isActive ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => deactivateMutation.mutate(plushie.id)}
                      disabled={deactivateMutation.isPending}
                      title="Desactivar"
                    >
                      <span className="sr-only">Desactivar</span>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => activateMutation.mutate(plushie.id)}
                      disabled={activateMutation.isPending}
                      title="Activar"
                    >
                      <span className="sr-only">Activar</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteTarget(plushie)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar</span>
                  </Button>
                </>
              )}
            </div>
          );
        },
      }),
    ],
    [activateMutation, deactivateMutation]
  );

  const tableData = useMemo(() => data?.results ?? [], [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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
          No pudimos obtener los peluches. Intenta nuevamente.
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
            placeholder="Buscar peluches..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link href="/dashboard/plushies/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo peluche
          </Link>
        </Button>
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
                    row.original.is_deleted
                      ? "opacity-60 bg-muted/30"
                      : ""
                  }
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
                    ? "No se encontraron peluches con ese criterio de búsqueda."
                    : "No hay peluches en el catálogo."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data?.count ?? 0} peluche(s) en total
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

      {/* Delete dialog */}
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        plushieName={deleteTarget?.name ?? ""}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
```

**Decisiones técnicas:**
- Usar TanStack Table con `getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`.
- `globalFilter` para búsqueda textual (filtra en todas las columnas).
- Paginación client-side (los datos vienen del backend paginados, pero hacemos paginación local sobre la página actual — simplificación para MVP. Si hay más de 100 resultados, el backend ya paginó).
- Para un MVP, la paginación client-side sobre la página actual es suficiente. Si se necesita paginación server-side, se puede migrar después.
- Las acciones de activate/deactivate son inline (mutación directa en la tabla sin navegar a detalle).
- El botón de activate/deactivate en la tabla usa icono (sin texto) para ahorrar espacio.

### 4.8 `components/plushies/admin/plushie-form.tsx` — Formulario create/edit

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";
import type { Plushie } from "@/types/api";
import type { AdminPlushieCreatePayload, AdminPlushieUpdatePayload } from "@/types/api";

// Schema de validación
const plushieSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().nullable().optional(),
  price: z
    .string()
    .min(1, "El precio es requerido")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "El precio debe ser mayor a 0"
    ),
  stock: z
    .string()
    .min(1, "El stock es requerido")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number.isInteger(Number(val)),
      "El stock debe ser un número entero >= 0"
    ),
  is_active: z.boolean().optional(),
});

type PlushieFormValues = z.infer<typeof plushieSchema>;

interface PlushieFormProps {
  initialData?: Plushie;
  onSubmit: (data: AdminPlushieCreatePayload | AdminPlushieUpdatePayload) => Promise<void>;
  isSubmitting: boolean;
}

export function PlushieForm({ initialData, onSubmit, isSubmitting }: PlushieFormProps) {
  const isEditing = !!initialData;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image ?? null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PlushieFormValues>({
    resolver: zodResolver(plushieSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      price: initialData?.price ?? "",
      stock: initialData?.stock?.toString() ?? "0",
      is_active: initialData?.is_active ?? true,
    },
  });

  const currentIsActive = watch("is_active");

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setRemoveImage(false);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onFormSubmit = (values: PlushieFormValues) => {
    const payload: any = {
      name: values.name,
      description: values.description || null,
      price: values.price,
      stock: Number(values.stock),
    };

    if (isEditing) {
      payload.is_active = values.is_active;
    } else {
      payload.is_active = true; // por defecto activo al crear
    }

    // Manejo de imagen
    if (imageFile) {
      payload.image = imageFile;
    } else if (removeImage) {
      payload.image = null;
    }
    // Si no hay cambios en imagen, no incluimos el campo (para edición)

    onSubmit(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar peluche" : "Nuevo peluche"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Modifica los datos del peluche"
            : "Completa los datos para agregar un nuevo peluche"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ej: Pikachu Peluche Gigante"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Descripción del peluche..."
              rows={4}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Precio y Stock en grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                Precio (S/) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="25.99"
                {...register("price")}
              />
              {errors.price && (
                <p className="text-sm text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">
                Stock <span className="text-destructive">*</span>
              </Label>
              <Input
                id="stock"
                type="number"
                step="1"
                min="0"
                placeholder="10"
                {...register("stock")}
              />
              {errors.stock && (
                <p className="text-sm text-destructive">
                  {errors.stock.message}
                </p>
              )}
            </div>
          </div>

          {/* Imagen */}
          <div className="space-y-2">
            <Label>Imagen</Label>

            {imagePreview && (
              <div className="relative inline-block">
                <div className="h-40 w-40 rounded-md overflow-hidden border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  className="absolute -top-2 -right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {!imagePreview && (
              <div
                className="flex items-center justify-center h-40 w-40 rounded-md border border-dashed bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Click para subir
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          {/* Activo (solo en edición) */}
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
                Peluche activo (visible en el catálogo público)
              </Label>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-4 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting
                ? "Guardando..."
                : isEditing
                ? "Guardar cambios"
                : "Crear peluche"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Decisiones:**
- `price` y `stock` se manejan como strings en el formulario (para validación Zod) y se convierten a number/string al enviar.
- `is_active` checkbox solo visible en modo edición.
- `image` preview con FileReader para mostrar preview antes de subir.
- Botón "X" en la preview para remover/quitar imagen.
- El checkbox de `is_active` usa `setValue` de react-hook-form.

### 4.9 `components/plushies/admin/delete-dialog.tsx` — Confirmación de eliminación

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

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plushieName: string;
  onConfirm: () => Promise<void>;
  isPending: boolean;
}

export function DeleteDialog({
  open,
  onOpenChange,
  plushieName,
  onConfirm,
  isPending,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar peluche</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar <strong>{plushieName}</strong>?
            <br />
            Esta acción es un <strong>soft-delete</strong>: el peluche dejará de
            aparecer en el catálogo, pero los datos se conservan.
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
            {isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Nota:** El componente Dialog ya existe en `components/ui/dialog.tsx` — no requiere instalación.

---

## 5. Reglas de negocio

| Regla | Implementación |
|---|---|
| Soft-delete | `DELETE /api/admin/plushies/{id}/` marca `is_deleted=true`. El frontend muestra filas eliminadas con opacidad reducida. |
| No se puede eliminar lo ya eliminado | El botón "Eliminar" se oculta si `is_deleted=true`. |
| Activar/Desactivar inline | Botones en la tabla y en la página de detalle que ejecutan mutate directa. |
| Solo activos visibles en público | El backend filtra automáticamente en `GET /api/plushies/`. |
| Peluches inactivos se muestran en admin | El endpoint admin devuelve todos, incluyendo inactivos y eliminados. |
| Imagen: subida opcional | `image` puede ser `File`, `null` (limpiar), o `undefined` (no cambiar). |
| Precio > 0 | Validación Zod: `Number(val) > 0`. |
| Stock >= 0 | Validación Zod: `Number(val) >= 0`. |
| Nombre requerido | Validación Zod: `string().min(1)`. |
| Sin imagen → placeholder | En la tabla, celda vacía con "—". |

---

## 6. Flujo de navegación

```
[/dashboard] Dashboard
  └── Sidebar "Peluches" → [/dashboard/plushies]

[/dashboard/plushies] Listado
  ├── Click "Nuevo peluche" → [/dashboard/plushies/new]
  │                               └── Submit → [/dashboard/plushies]
  ├── Click nombre/fila → [/dashboard/plushies/{id}]
  │                         ├── Submit cambios → [/dashboard/plushies]
  │                         ├── "Activar"/"Desactivar" → inline
  │                         ├── "Eliminar" → Dialog → Confirm → [/dashboard/plushies]
  │                         └── "Volver" → [/dashboard/plushies]
  ├── Acciones inline:
  │   ├── "Activar"/"Desactivar" → inline sin navegación
  │   ├── "Eliminar" → Dialog → Confirm → inline (sin navegación)
  │   └── "Editar" → [/dashboard/plushies/{id}]
  ├── Búsqueda → filtra tabla client-side
  └── Paginación → navega páginas client-side

[/dashboard/plushies/new] Creación
  └── Cancelar/Volver → [/dashboard/plushies]
```

---

## 7. Componentes shadcn/ui adicionales necesarios

**Ya instalados en `components/ui/`:**
- `badge.tsx` ✓
- `button.tsx` ✓
- `card.tsx` ✓
- `dialog.tsx` ✓
- `dropdown-menu.tsx` ✓
- `input.tsx` ✓
- `label.tsx` ✓
- `select.tsx` ✓ (no se usa directamente, pero disponible)
- `sonner.tsx` ✓
- `table.tsx` ✓
- `textarea.tsx` ✓

**No requiere instalar ningún componente adicional.** Todos los usados ya existen.

Si se desea usar `<Skeleton>` de shadcn/ui, instalar con:
```bash
npx shadcn add skeleton
```
Pero no es necesario — se puede usar `animate-pulse` con `bg-muted` directamente.

---

## 8. Criterios de aceptación

### Funcionales
- [ ] `/dashboard/plushies` muestra tabla con todos los peluches (activos, inactivos, eliminados).
- [ ] Columnas: imagen, nombre (link a detalle), precio, stock, estado (badge), acciones.
- [ ] Badges: verde = Activo, gray = Inactivo, rojo = Eliminado.
- [ ] Filas eliminadas se ven con opacidad reducida.
- [ ] Búsqueda textual filtra resultados en tiempo real.
- [ ] Sort por nombre, precio, stock.
- [ ] Paginación client-side funcional.
- [ ] Botón "Nuevo peluche" → `/dashboard/plushies/new`.
- [ ] Formulario de creación: nombre, descripción, precio, stock, imagen.
- [ ] Validación Zod: nombre requerido, precio > 0, stock >= 0.
- [ ] Preview de imagen antes de subir.
- [ ] Submit exitoso → toast + redirige al listado.
- [ ] `/dashboard/plushies/[id]` muestra detalle + formulario de edición.
- [ ] Edición incluye checkbox "Activo".
- [ ] Edición permite cambiar/quitar imagen.
- [ ] Botones "Activar"/"Desactivar" funcionan (en tabla y detalle).
- [ ] Confirmación de eliminación con diálogo.
- [ ] Soft-delete: toast "Peluche eliminado", fila marcada como eliminada.
- [ ] Estados loading (skeleton/pulse) en tabla y detalle.
- [ ] Estados error con mensaje + botón reintentar.
- [ ] Toast de éxito/error para cada acción (crear, actualizar, eliminar, activar, desactivar).

### Técnicos
- [ ] `services/admin-plushies.ts` exporta todas las funciones API.
- [ ] `hooks/use-admin-plushies.ts` exporta hooks con queryKey convention.
- [ ] Mutations invalidan queries relacionadas correctamente.
- [ ] Formulario usa `multipart/form-data` para subida de imágenes.
- [ ] `FormData` builder maneja File, null (limpiar), undefined (no cambiar).
- [ ] Sin fugas de estado: editar y volver no mezcla datos.
- [ ] `npm run build` sin errores.
- [ ] `npm run lint` sin errores.

---

## 9. Consideraciones adicionales

### Zod v4 vs v3
El proyecto tiene `zod: "^4.4.3"`. Zod v4 cambió la API. Verificar que:
- `z.object()` funciona igual.
- `.refine()` recibe `(val, ctx)` en vez de `(val)` — la API de refine cambió ligeramente.
- `z.string().min(1)` sigue funcionando.

**Alternativa segura si Zod v4 causa problemas:** Usar validación manual sin Zod:

```typescript
const validatePlushie = (data: Record<string, any>) => {
  const errors: Record<string, string> = {};
  if (!data.name?.trim()) errors.name = "El nombre es requerido";
  // ... etc
  return Object.keys(errors).length > 0 ? errors : null;
};
```

### Base UI render prop vs asChild
Los componentes shadcn/ui de base-nova (base-ui) usan `render` prop en vez de `asChild`. Donde se use `asChild`, verificar que el componente lo soporte. Ejemplo con Button:

```tsx
// Si asChild no funciona:
<Link href="/dashboard/plushies/new">
  <Button>Nuevo peluche</Button>
</Link>

// En vez de:
<Button asChild>
  <Link href="/dashboard/plushies/new">Nuevo peluche</Link>
</Button>
```

### Server components vs Client components
- `app/dashboard/plushies/page.tsx` puede ser Server Component (no tiene interactividad directa).
- `app/dashboard/plushies/new/page.tsx` y `app/dashboard/plushies/[id]/page.tsx` deben ser Client Components (`"use client"`).
- Todos los componentes en `components/plushies/admin/` deben ser Client Components.

### Orden de implementación sugerido

```
1. types/api.ts (agregar payload types)
2. services/admin-plushies.ts
3. hooks/use-admin-plushies.ts
4. components/plushies/admin/delete-dialog.tsx
5. components/plushies/admin/plushie-form.tsx
6. components/plushies/admin/admin-plushies-table.tsx
7. app/dashboard/plushies/page.tsx
8. app/dashboard/plushies/new/page.tsx
9. app/dashboard/plushies/[id]/page.tsx
```

### Store (Zustand)

No se necesita store para este módulo. TanStack Query cache es suficiente para el estado de los datos. El estado global de auth ya está cubierto por `stores/auth.ts`.
