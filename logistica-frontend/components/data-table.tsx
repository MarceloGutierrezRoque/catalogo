"use client"

import {
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  pageSize?: number
  emptyMessage?: string
  filteredEmptyMessage?: string
  noResultsHint?: string
  noDataHint?: string
}

export function SortHeader({
  label,
  sorted,
  onClick,
}: {
  label: string
  sorted?: false | "asc" | "desc"
  onClick: () => void
}) {
  return (
    <button
      className="flex cursor-pointer items-center gap-1 font-medium text-xs uppercase tracking-wider text-muted-foreground"
      onClick={onClick}
    >
      {label}
      <ArrowUpDown className={cn(
        "h-3 w-3",
        sorted && "text-foreground",
      )} />
    </button>
  )
}

export function DataTable<TData>({
  columns,
  data,
  sorting,
  onSortingChange,
  globalFilter,
  onGlobalFilterChange,
  pageSize = 10,
  emptyMessage = "No hay datos registrados",
  filteredEmptyMessage = "No se encontraron resultados",
  noResultsHint = "Intenta con otro término de búsqueda",
  noDataHint,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange,
    onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const totalRows = table.getFilteredRowModel().rows.length
  const pageCount = table.getPageCount()
  const pageIndex = table.getState().pagination.pageIndex

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {totalRows > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-muted-foreground font-medium">
                      {globalFilter ? filteredEmptyMessage : emptyMessage}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      {globalFilter
                        ? noResultsHint
                        : noDataHint ?? "Agrega un nuevo registro para comenzar"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
        <p className="text-muted-foreground order-2 sm:order-1">
          {totalRows} registro{totalRows !== 1 ? "s" : ""}
          {globalFilter ? " encontrados" : " en total"}
          {pageCount > 1 &&
            ` — Página ${pageIndex + 1} de ${pageCount}`}
        </p>
        {pageCount > 1 && (
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.setPageIndex(0)}
              aria-label="Primera página"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {/* Page numbers */}
            <div className="hidden sm:flex items-center gap-1 mx-1">
              {Array.from({ length: pageCount }, (_, i) => {
                const isActive = i === pageIndex
                const isNear = Math.abs(i - pageIndex) <= 1
                const isEnd = i === 0 || i === pageCount - 1
                if (!isNear && !isEnd) {
                  return i === pageIndex - 2 || i === pageIndex + 2 ? (
                    <span key={i} className="px-1 text-muted-foreground/40">···</span>
                  ) : null
                }
                return (
                  <Button
                    key={i}
                    variant={isActive ? "default" : "outline"}
                    size="icon-xs"
                    onClick={() => table.setPageIndex(i)}
                    aria-label={`Ir a página ${i + 1}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {i + 1}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="icon-sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.setPageIndex(pageCount - 1)}
              aria-label="Última página"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
