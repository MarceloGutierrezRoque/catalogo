# Spec: Orders — Admin (Gestión de Pedidos)

## 1. Resumen del módulo

Panel administrativo para gestionar pedidos de clientes (Fase 6 del MVP).

Permite listar todos los pedidos, ver detalle con items anidados, y cambiar el estado del pedido según transiciones válidas.

**Endpoints que consume (todos requieren JWT Bearer):**

| Método | Ruta | Propósito |
|--------|------|-----------|
| GET | `/api/admin/orders/` | Lista paginada (sin items anidados) |
| GET | `/api/admin/orders/{id}/` | Detalle con items anidados |
| PATCH | `/api/admin/orders/{id}/` | Actualizar estado (`status`) |

**Rutas del módulo:**

| Ruta | Tipo | Propósito |
|------|------|-----------|
| `/dashboard/orders` | 🔒 Protegida | Listado con TanStack Table |
| `/dashboard/orders/[id]` | 🔒 Protegida | Detalle con items y cambio de estado |

**Transiciones válidas de `status`:**

```
pending ──→ contacted ──→ closed
                │
                └──→ cancelled
```

| Desde | Hacia |
|-------|-------|
| `pending` | `contacted` |
| `contacted` | `closed`, `cancelled` |
| `closed` | (terminal, no más transiciones) |
| `cancelled` | (terminal, no más transiciones) |

---

## 2. Archivos a crear (6 archivos)

| # | Ruta | Propósito |
|---|------|-----------|
| 1 | `services/admin-orders.ts` | API service para endpoints admin de orders |
| 2 | `hooks/use-admin-orders.ts` | TanStack Query hooks (listar, detalle, actualizar estado) |
| 3 | `app/dashboard/orders/page.tsx` | Página de listado (TanStack Table) |
| 4 | `app/dashboard/orders/[id]/page.tsx` | Página de detalle con items y cambio de estado |
| 5 | `components/orders/admin/admin-orders-table.tsx` | TanStack Table para listado |
| 6 | `components/orders/admin/order-status-select.tsx` | Selector de cambio de estado con validación de transiciones |

---

## 3. Archivos a modificar (1 archivo)

| # | Ruta | Cambio |
|---|------|--------|
| 1 | `types/api.ts` | Agregar `AdminOrderUpdatePayload` y helper `ORDER_STATUS_TRANSITIONS` |

---

## 4. Detalle de cada archivo

### 4.1 `types/api.ts` — Agregar tipos admin de orders

Agregar al final del archivo, antes del cierre:

```typescript
// ---- Admin Orders ----

export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["contacted"],
  contacted: ["closed", "cancelled"],
  closed: [],
  cancelled: [],
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  contacted: "Contactado",
  closed: "Cerrado",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500 hover:bg-yellow-600",
  contacted: "bg-blue-500 hover:bg-blue-600",
  closed: "bg-green-600 hover:bg-green-700",
  cancelled: "bg-red-500 hover:bg-red-600",
};

export interface AdminOrderUpdatePayload {
  status: string;
}
```

**Nota:** El tipo `Order` existente ya incluye `status` (union type) e `items` (opcional). Es suficiente. Solo agregamos payload para el PATCH de estado.

### 4.2 `services/admin-orders.ts` — API Service

```typescript
import api from "@/lib/axios";
import type { Order, PaginatedResponse } from "@/types/api";

export interface AdminOrderListParams {
  page?: number;
  status?: string;
  ordering?: string;
}

export async function fetchAdminOrders(
  params: AdminOrderListParams = {}
): Promise<PaginatedResponse<Order>> {
  const { data } = await api.get<PaginatedResponse<Order>>("/api/admin/orders/", {
    params,
  });
  return data;
}

export async function fetchAdminOrder(id: number): Promise<Order> {
  const { data } = await api.get<Order>(`/api/admin/orders/${id}/`);
  return data;
}

export async function updateAdminOrderStatus(
  id: number,
  payload: { status: string }
): Promise<Order> {
  const { data } = await api.patch<Order>(`/api/admin/orders/${id}/`, payload);
  return data;
}
```

**Decisiones técnicas:**
- `fetchAdminOrders` acepta `params` con `page`, `status` (filtro backend) y `ordering` (sort backend).
- `updateAdminOrderStatus` solo envía `{ status: "nuevo_estado" }` — el backend solo acepta ese campo.
- La respuesta del PATCH es el Order completo con items anidados (útil para refrescar la vista de detalle).

### 4.3 `hooks/use-admin-orders.ts` — TanStack Query Hooks

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchAdminOrders,
  fetchAdminOrder,
  updateAdminOrderStatus,
} from "@/services/admin-orders";
import type { AdminOrderListParams } from "@/services/admin-orders";

export const adminOrderKeys = {
  all: ["admin-orders"] as const,
  lists: () => [...adminOrderKeys.all, "list"] as const,
  list: (params: AdminOrderListParams) => [...adminOrderKeys.lists(), params] as const,
  details: () => [...adminOrderKeys.all, "detail"] as const,
  detail: (id: number) => [...adminOrderKeys.details(), id] as const,
};

export function useAdminOrders(params: AdminOrderListParams = {}) {
  return useQuery({
    queryKey: adminOrderKeys.list(params),
    queryFn: () => fetchAdminOrders(params),
  });
}

export function useAdminOrder(id: number) {
  return useQuery({
    queryKey: adminOrderKeys.detail(id),
    queryFn: () => fetchAdminOrder(id),
    enabled: !!id && id > 0,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateAdminOrderStatus(id, { status }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(order.id) });
      toast.success("Estado del pedido actualizado");
    },
    onError: (error: Error) => {
      const err = error as { response?: { data?: { detail?: string } } };
      const message =
        err?.response?.data?.detail ||
        "Error al actualizar el estado del pedido";
      toast.error(message);
    },
  });
}
```

**Patrón de invalidación:**
- `useUpdateOrderStatus` → invalida lists (el estado cambia en la tabla) + detail del id específico (los datos del detalle se refrescan).

**queryKey convention:**
- `["admin-orders", "list", params]` para listados
- `["admin-orders", "detail", id]` para detalle

### 4.4 `app/dashboard/orders/page.tsx` — Página de listado

```tsx
import { AdminOrdersTable } from "@/components/orders/admin/admin-orders-table";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground">
            Gestiona los pedidos de los clientes
          </p>
        </div>
      </div>
      <AdminOrdersTable />
    </div>
  );
}
```

**Nota:** Server component. La lógica de tabla es manejada por el componente cliente.

### 4.5 `components/orders/admin/admin-orders-table.tsx` — TanStack Table

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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { useAdminOrders } from "@/hooks/use-admin-orders";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/types/api";
import type { Order } from "@/types/api";

const columnHelper = createColumnHelper<Order>();

export function AdminOrdersTable() {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true }, // Default: más reciente primero
  ]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const params = useMemo(() => {
    const p: Record<string, string | number> = {};
    if (statusFilter && statusFilter !== "all") {
      p.status = statusFilter;
    }
    if (sorting.length > 0) {
      const sort = sorting[0];
      p.ordering = sort.desc ? `-${sort.id}` : sort.id;
    }
    return p;
  }, [statusFilter, sorting]);

  const { data, isLoading, isError, refetch, isFetching } = useAdminOrders(params);

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
      columnHelper.accessor("customer_name", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent font-medium"
            onClick={() => column.toggleSorting()}
          >
            Cliente
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("customer_email", {
        header: "Email",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("customer_phone", {
        header: "Teléfono",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Estado",
        cell: ({ getValue }) => {
          const status = getValue();
          return (
            <Badge className={ORDER_STATUS_COLORS[status] ?? ""}>
              {ORDER_STATUS_LABELS[status] ?? status}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("created_at", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc" ? false : true)}
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
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/dashboard/orders/${row.original.id}`)}
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">Ver detalle</span>
            </Button>
          </div>
        ),
      }),
    ],
    [router]
  );

  const tableData = useMemo(() => data?.results ?? [], [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    pageCount: data ? Math.ceil(data.count / pagination.pageSize) : 0,
    manualPagination: true,
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
          No pudimos obtener los pedidos. Intenta nuevamente.
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
      {/* Toolbar: filtro por estado */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrar por estado:</span>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="contacted">Contactado</SelectItem>
              <SelectItem value="closed">Cerrado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/dashboard/orders/${row.original.id}`)}
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
                  {statusFilter !== "all"
                    ? `No hay pedidos con estado "${ORDER_STATUS_LABELS[statusFilter] ?? statusFilter}".`
                    : "No hay pedidos registrados."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data?.count ?? 0} pedido(s) en total
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
- `manualPagination: true` + `pageCount` calculado desde `data.count` → la paginación se maneja server-side (el backend ya paginó).
- Filtro por estado usa el parámetro `status` que el backend entiende.
- Sort por defecto: `created_at` descendente (más reciente primero).
- `ordering` se pasa como parámetro al backend para sort server-side.
- Click en fila navega a detalle (`router.push`).
- La columna ID usa `font-mono` para mejor legibilidad de IDs numéricos.
- La columna Email y Teléfono no tienen sort (serían inusuales como criterio de ordenamiento).

### 4.6 `components/orders/admin/order-status-select.tsx` — Selector de cambio de estado

```tsx
"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import {
  ORDER_STATUS_TRANSITIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/types/api";

interface OrderStatusSelectProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => Promise<void>;
  isPending: boolean;
}

export function OrderStatusSelect({
  currentStatus,
  onStatusChange,
  isPending,
}: OrderStatusSelectProps) {
  const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Si no hay transiciones posibles, el estado es terminal
  if (allowedTransitions.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Estado actual:</span>
        <Badge className={ORDER_STATUS_COLORS[currentStatus] ?? ""}>
          {ORDER_STATUS_LABELS[currentStatus] ?? currentStatus}
        </Badge>
        <span className="text-xs text-muted-foreground ml-1">(Estado terminal)</span>
      </div>
    );
  }

  const handleSave = async () => {
    if (!selectedStatus || selectedStatus === currentStatus) return;
    await onStatusChange(selectedStatus);
    setSelectedStatus("");
  };

  const hasChanges = selectedStatus && selectedStatus !== currentStatus;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Estado actual:</span>
        <Badge className={ORDER_STATUS_COLORS[currentStatus] ?? ""}>
          {ORDER_STATUS_LABELS[currentStatus] ?? currentStatus}
        </Badge>
      </div>

      <div className="flex items-end gap-2">
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Cambiar a:</span>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar estado..." />
            </SelectTrigger>
            <SelectContent>
              {allowedTransitions.map((status) => (
                <SelectItem key={status} value={status}>
                  {ORDER_STATUS_LABELS[status] ?? status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || isPending}
          size="sm"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
```

**Decisiones técnicas:**
- `ORDER_STATUS_TRANSITIONS[currentStatus]` determina qué opciones mostrar.
- Si el estado es terminal (`closed` o `cancelled`), se muestra solo el badge actual con indicación de "Estado terminal".
- El botón "Guardar" se habilita solo si se seleccionó un estado diferente al actual.
- Después de guardar exitosamente, se resetea `selectedStatus` a vacío.

### 4.7 `app/dashboard/orders/[id]/page.tsx` — Página de detalle

```tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useAdminOrder, useUpdateOrderStatus } from "@/hooks/use-admin-orders";
import { OrderStatusSelect } from "@/components/orders/admin/order-status-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  User,
  Phone,
  Mail,
  FileText,
  Package,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types/api";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = Number(id);

  const { data: order, isLoading, isError, refetch, isFetching } = useAdminOrder(orderId);
  const updateStatusMutation = useUpdateOrderStatus();

  const handleStatusChange = async (newStatus: string) => {
    await updateStatusMutation.mutateAsync({ id: orderId, status: newStatus });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-48 bg-muted rounded animate-pulse" />
          <div className="h-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  // Error state
  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Pedido no encontrado</h2>
        <p className="text-muted-foreground mb-6">
          El pedido que buscas no existe o fue eliminado.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/orders">
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

  // Calcular total
  const total = order.items?.reduce(
    (sum, item) => sum + Number(item.unit_price) * item.quantity,
    0
  ) ?? 0;

  const createdDate = new Date(order.created_at).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const updatedDate = new Date(order.updated_at).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Pedido #{order.id}
            </h1>
            <p className="text-muted-foreground">
              Creado el {createdDate}
            </p>
          </div>
        </div>

        <Badge className={`text-base px-3 py-1 ${ORDER_STATUS_COLORS[order.status] ?? ""}`}>
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Datos del cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Datos del cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{order.customer_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{order.customer_email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium">{order.customer_phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estado del pedido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Estado del pedido
            </CardTitle>
            <CardDescription>
              Actualiza el estado según el progreso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrderStatusSelect
              currentStatus={order.status}
              onStatusChange={handleStatusChange}
              isPending={updateStatusMutation.isPending}
            />
            <p className="text-xs text-muted-foreground mt-4">
              Última actualización: {updatedDate}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Observaciones */}
      {order.observations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Observaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{order.observations}</p>
          </CardContent>
        </Card>
      )}

      {/* Items del pedido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Productos solicitados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-3">
                    Producto
                  </th>
                  <th className="text-right text-sm font-medium text-muted-foreground px-6 py-3">
                    Cantidad
                  </th>
                  <th className="text-right text-sm font-medium text-muted-foreground px-6 py-3">
                    Precio unit.
                  </th>
                  <th className="text-right text-sm font-medium text-muted-foreground px-6 py-3">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-6 py-4 font-medium">{item.plushie_name}</td>
                    <td className="px-6 py-4 text-right">{item.quantity}</td>
                    <td className="px-6 py-4 text-right">
                      S/ {Number(item.unit_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      S/ {(Number(item.unit_price) * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td colSpan={3} className="px-6 py-4 text-right">
                    Total estimado
                  </td>
                  <td className="px-6 py-4 text-right">
                    S/ {total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Decisiones técnicas:**
- Tabla de items con HTML semántico (`<table>`, `<thead>`, `<tbody>`, `<tfoot>`) en lugar de TanStack Table (es una tabla simple de solo lectura, no requiere sort/filter/pagination).
- Íconos en cada sección para mejorar legibilidad: `User`, `Mail`, `Phone`, `Clock`, `FileText`, `Package`.
- `whitespace-pre-wrap` en observaciones para respetar saltos de línea.
- Total calculado client-side con `reduce`.
- Fechas formateadas con `toLocaleDateString("es-PE", ...)`.

---

## 5. Reglas de negocio y validaciones

### 5.1 Transiciones de estado

| Regla | Implementación |
|-------|----------------|
| `pending` → solo `contacted` | `ORDER_STATUS_TRANSITIONS.pending = ["contacted"]` |
| `contacted` → `closed` o `cancelled` | `ORDER_STATUS_TRANSITIONS.contacted = ["closed", "cancelled"]` |
| `closed` → terminal | `ORDER_STATUS_TRANSITIONS.closed = []` — Selector oculto, solo badge |
| `cancelled` → terminal | `ORDER_STATUS_TRANSITIONS.cancelled = []` — Selector oculto, solo badge |

### 5.2 Validaciones frontend

| Validación | Implementación |
|------------|----------------|
| Estado terminal no permite cambios | `OrderStatusSelect` detecta `allowedTransitions.length === 0` y muestra mensaje |
| Solo transiciones válidas | Las opciones del Select se filtran según `ORDER_STATUS_TRANSITIONS[currentStatus]` |
| No guardar si mismo estado | Botón "Guardar" deshabilitado si `selectedStatus === currentStatus` |
| Confirmación visual | Toast de éxito/error después de cada mutación |

### 5.3 Reglas de negocio del backend

| Regla | Detalle |
|-------|---------|
| Solo admin puede cambiar estado | El endpoint requiere JWT Bearer |
| Transiciones inválidas dan error 400 | Backend valida y retorna `{ "detail": "..." }` |
| Items son solo lectura | El backend ignora cambios en `items` en el PATCH |
| No se puede eliminar pedidos | No hay endpoint DELETE para orders (solo cambio de estado) |
| Timestamps se actualizan automáticamente | `updated_at` se actualiza con cada PATCH |

---

## 6. Flujo de navegación

```
[/dashboard] Dashboard
  └── Sidebar "Pedidos" → [/dashboard/orders]

[/dashboard/orders] Listado
  ├── Filtro por estado → recarga lista
  ├── Sort por columna → recarga lista
  ├── Paginación → navega páginas
  └── Click fila → [/dashboard/orders/{id}]
                      ├── "Guardar" cambio de estado → inline + toast
                      ├── Si estado terminal → no muestra selector
                      └── "Volver" → [/dashboard/orders]

[/dashboard/orders/{id}] Detalle
  ├── Cambiar estado → Select + Guardar → toast éxito/error
  ├── "Volver al listado" → [/dashboard/orders]
  └── "Reintentar" (si error) → refetch
```

---

## 7. Componentes shadcn/ui adicionales necesarios

**Ya instalados en `components/ui/`:**
- `badge.tsx` ✅
- `button.tsx` ✅
- `card.tsx` ✅
- `select.tsx` ✅
- `table.tsx` ✅ (se usa en el listado)
- `input.tsx` ✅ (no se usa directamente, pero disponible)

**No requiere instalar ningún componente adicional.**

**Íconos lucide-react necesarios (todos disponibles en lucide-react):**
- `ArrowUpDown` — sort indicator
- `ChevronLeft`, `ChevronRight` — paginación
- `Eye` — ver detalle
- `AlertCircle` — error
- `RefreshCw` — reintentar
- `Search` — (no se usa en este módulo, pero disponible)
- `ArrowLeft` — volver
- `User` — datos del cliente
- `Mail` — email
- `Phone` — teléfono
- `FileText` — observaciones
- `Package` — productos
- `Clock` — estado/fechas
- `Loader2` — spinner
- `Save` — guardar

---

## 8. Estados de los componentes

### AdminOrdersTable (listado)

```
┌─────────────────────────────────────────┐
│           AdminOrdersTable              │
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
│  │  Mensaje: "No hay pedidos..."     │  │
│  │  o "No hay pedidos con estado X"  │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌─ SUCCESS ────────────────────────┐  │
│  │  Tabla con datos + paginación     │  │
│  │  Filtro por estado + sort         │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### OrderDetailPage (detalle)

```
┌─────────────────────────────────────────┐
│          OrderDetailPage                │
│                                         │
│  ┌─ LOADING ────────────────────────┐  │
│  │  Skeleton: header + 2 cards      │  │
│  │  + tabla de items                │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌─ ERROR ──────────────────────────┐  │
│  │  "Pedido no encontrado"           │  │
│  │  Botones: Volver + Reintentar     │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌─ SUCCESS ────────────────────────┐  │
│  │  Header con badge de estado       │  │
│  │  Card: Datos del cliente          │  │
│  │  Card: Estado + selector          │  │
│  │  Card: Observaciones (si hay)     │  │
│  │  Card: Tabla de items + total     │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌─ UPDATING (sub-estado) ──────────┐  │
│  │  Selector deshabilitado           │  │
│  │  Botón: spinner + "Guardando..."  │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 9. Notas técnicas importantes

### 9.1 Paginación server-side vs client-side

A diferencia del módulo plushies-admin que usa paginación client-side sobre la página actual (simplificación), **orders-admin usa paginación server-side** porque:
- El backend de orders ya devuelve `count`, `next`, `previous`.
- El filtro por estado y el ordering se pasan como query params al backend.
- `manualPagination: true` + `pageCount` desde `data.count`.

### 9.2 Filtro por estado

El filtro por estado se implementa con el `Select` de shadcn/ui. Cambiar el filtro resetea el `pageIndex` a 0 para evitar páginas vacías.

### 9.3 Sort server-side

`sorting` state se convierte a `ordering` param:
- `created_at` ascendente → `ordering=created_at`
- `created_at` descendente → `ordering=-created_at`

### 9.4 Sin Zustand store

No se necesita store para este módulo. TanStack Query cache es suficiente. El estado global de auth ya está cubierto por `stores/auth.ts`.

### 9.5 Sidebar

El sidebar ya tiene el link "Pedidos" → `/dashboard/orders` con icono `ShoppingBag`. No requiere modificación.

### 9.6 Server vs Client components

- `app/dashboard/orders/page.tsx` → Server Component (no tiene interactividad directa, delega en `AdminOrdersTable`).
- `app/dashboard/orders/[id]/page.tsx` → Client Component (`"use client"`) porque usa hooks, estado, y navegación.
- Todos los componentes en `components/orders/admin/` → Client Components.

### 9.7 Zod v4

Si en el futuro se agrega validación Zod para el selector de estado, verificar compatibilidad con Zod v4 (el proyecto usa `zod: "^4.4.3"`). Para este módulo no se necesita Zod directamente (la validación de transiciones es con el objeto `ORDER_STATUS_TRANSITIONS`).

---

## 10. Criterios de aceptación

### Funcionales

- [ ] `/dashboard/orders` muestra tabla con todos los pedidos.
- [ ] Columnas: ID, Cliente, Email, Teléfono, Estado (badge con color), Creado, Acciones.
- [ ] Badges con colores: amarillo=Pendiente, azul=Contactado, verde=Cerrado, rojo=Cancelado.
- [ ] Filtro por estado con Select (Todos, Pendiente, Contactado, Cerrado, Cancelado).
- [ ] Sort por ID, Cliente, Estado, Creado (sort server-side).
- [ ] Orden por defecto: más reciente primero (`created_at` descendente).
- [ ] Paginación server-side funcional.
- [ ] Click en fila navega a `/dashboard/orders/[id]`.
- [ ] `/dashboard/orders/[id]` muestra detalle completo del pedido.
- [ ] Card de datos del cliente: nombre, email, teléfono con íconos.
- [ ] Card de estado: badge actual + selector de cambio de estado.
- [ ] Solo muestra transiciones válidas según estado actual.
- [ ] Estados terminales (`closed`, `cancelled`) no muestran selector, solo badge + "Estado terminal".
- [ ] Card de observaciones (si existen).
- [ ] Tabla de items: producto, cantidad, precio unitario, subtotal.
- [ ] Fila total estimado al final.
- [ ] Cambio de estado exitoso → toast + datos refrescados.
- [ ] Cambio de estado con error → toast con mensaje de error.
- [ ] Botón "Volver" en detalle → listado.
- [ ] Estados loading (skeleton/pulse) en tabla y detalle.
- [ ] Estados error con mensaje + botón reintentar.
- [ ] Estado empty: "No hay pedidos registrados" o "No hay pedidos con estado X".

### Técnicos

- [ ] `services/admin-orders.ts` exporta todas las funciones API.
- [ ] `hooks/use-admin-orders.ts` exporta hooks con queryKey convention.
- [ ] `useUpdateOrderStatus` invalida lists + detail del id correspondiente.
- [ ] `ORDER_STATUS_TRANSITIONS`, `ORDER_STATUS_LABELS`, `ORDER_STATUS_COLORS` en `types/api.ts`.
- [ ] Paginación manual (server-side) correcta.
- [ ] Filtro por estado resetea pageIndex a 0.
- [ ] Sin fugas de estado: navegar entre órdenes no mezcla datos.
- [ ] `npm run build` sin errores.
- [ ] `npm run lint` sin errores.

---

## 11. Orden de implementación sugerido

```
1. types/api.ts (agregar ORDER_STATUS_TRANSITIONS, LABELS, COLORS, AdminOrderUpdatePayload)
2. services/admin-orders.ts
3. hooks/use-admin-orders.ts
4. components/orders/admin/order-status-select.tsx
5. components/orders/admin/admin-orders-table.tsx
6. app/dashboard/orders/page.tsx
7. app/dashboard/orders/[id]/page.tsx
```
