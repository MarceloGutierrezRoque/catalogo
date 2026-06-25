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
  Power,
  PowerOff,
} from "lucide-react";
import { useAdminPlushies } from "@/hooks/use-admin-plushies";
import { useDeleteAdminPlushie, useActivateAdminPlushie, useDeactivateAdminPlushie } from "@/hooks/use-admin-plushies";
import { DeleteDialog } from "@/components/plushies/admin/delete-dialog";
import type { Plushie } from "@/types/api";
import { getImageUrl } from "@/lib/constants";

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
                  src={getImageUrl(imageUrl)}
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
          const { is_active } = row.original;
          if (is_active) return <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">Activo</Badge>;
          return <Badge variant="secondary">Inactivo</Badge>;
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => {
          const plushie = row.original;
          const isActive = plushie.is_active;

          return (
            <div className="flex items-center gap-0.5">
              <Link href={`/dashboard/plushies/${plushie.id}`}>
                <Button variant="ghost" size="icon-sm" className="hover:scale-110 transition-all duration-200">
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Ver</span>
                </Button>
              </Link>
              <Link href={`/dashboard/plushies/${plushie.id}`}>
                <Button variant="ghost" size="icon-sm" className="hover:scale-110 transition-all duration-200">
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Editar</span>
                </Button>
              </Link>
              <>
                {isActive ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deactivateMutation.mutate(plushie.id)}
                    disabled={deactivateMutation.isPending}
                    title="Desactivar"
                    className="hover:scale-110 transition-all duration-200"
                  >
                    <PowerOff className="h-4 w-4" />
                    <span className="sr-only">Desactivar</span>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => activateMutation.mutate(plushie.id)}
                    disabled={activateMutation.isPending}
                    title="Activar"
                    className="hover:scale-110 transition-all duration-200"
                  >
                    <Power className="h-4 w-4" />
                    <span className="sr-only">Activar</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteTarget(plushie)}
                  className="text-destructive hover:text-destructive hover:scale-110 transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              </>
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
            className="pl-10"
          />
        </div>
        <Link href="/dashboard/plushies/new">
          <Button className="shadow-sm hover:shadow-md transition-all duration-200">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo peluche
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
