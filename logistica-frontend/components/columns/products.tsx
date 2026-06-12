"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Product } from "@/types/api"
import { SortHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"

export function supplierName(p: Product): string {
  if (p.supplier === null) return "—"
  return typeof p.supplier === "object" ? p.supplier.name : "—"
}

export function warehouseName(p: Product): string {
  if (p.warehouse === null) return "—"
  return typeof p.warehouse === "object" ? p.warehouse.name : "—"
}

export function formatPrice(price: string | null): string {
  if (!price) return "—"
  const n = Number.parseFloat(price)
  if (isNaN(n)) return "—"
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(n)
}

export function StockBadge({ product }: { product: Product }) {
  const qty = product.stock_quantity
  const min = product.min_stock_level

  if (qty === 0) {
    return <Badge variant="destructive">Sin stock</Badge>
  }
  if (qty <= min) {
    return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300">
        {qty} — Stock bajo
      </Badge>
    )
  }
  return <Badge variant="outline">{qty} en stock</Badge>
}

export interface ProductColumnDeps {
  can: (perm: string) => boolean
  openEditDialog: (product: Product) => void
  setDeleteTarget: (product: Product) => void
  handleActivate: (id: number) => void
  activateMutation: { isPending: boolean }
}

export function productColumns(deps: ProductColumnDeps): ColumnDef<Product>[] {
  const { can, openEditDialog, setDeleteTarget, handleActivate, activateMutation } = deps

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortHeader label="Nombre" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
    },
    {
      accessorKey: "sku",
      header: ({ column }) => (
        <SortHeader label="SKU" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
    },
    {
      accessorKey: "category",
      header: "Categoría",
      cell: ({ row }) => row.original.category ?? "—",
    },
    {
      id: "supplier_name",
      header: "Proveedor",
      cell: ({ row }) => supplierName(row.original),
    },
    {
      id: "warehouse_name",
      header: "Almacén",
      cell: ({ row }) => warehouseName(row.original),
    },
    {
      id: "stock",
      header: ({ column }) => (
        <SortHeader label="Stock" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      sortingFn: (a, b) => a.original.stock_quantity - b.original.stock_quantity,
      cell: ({ row }) => <StockBadge product={row.original} />,
    },
    {
      id: "unit_price",
      header: ({ column }) => (
        <SortHeader label="Precio" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      accessorFn: (row) => Number.parseFloat(row.unit_price ?? "0"),
      cell: ({ row }) => formatPrice(row.original.unit_price),
    },
    {
      accessorKey: "is_active",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => {
        const p = row.original
        return (
          <div className="flex items-center gap-1">
            {can("products.change_product") && (
              <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(p)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Button>
            )}
            {can("products.delete_product") && (
              p.is_active ? (
                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(p)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleActivate(p.id)}
                  disabled={activateMutation.isPending}
                >
                  <span className="ml-1 text-xs font-medium text-green-600 dark:text-green-400">
                    Activar
                  </span>
                  <span className="sr-only">Activar</span>
                </Button>
              )
            )}
          </div>
        )
      },
    },
  ]
}
