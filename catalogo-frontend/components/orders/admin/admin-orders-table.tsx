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
    p.page = pagination.pageIndex + 1;
    return p;
  }, [statusFilter, sorting, pagination.pageIndex]);

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
              setStatusFilter(value ?? "all");
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
            className="transition-all duration-200"
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
            className="transition-all duration-200"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
