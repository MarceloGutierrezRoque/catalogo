"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Customer } from "@/types/api"
import { SortHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"

export function customerTypeLabel(type: string): string {
  return type === "company" ? "Empresa" : "Persona"
}

export const customerTypeItems: Record<string, string> = {
  company: "Empresa",
  person: "Persona",
}

export const docTypeItems: Record<string, string> = {
  ruc: "RUC",
  dni: "DNI",
  ce: "Carné de Extranjería",
  other: "Otro",
}

export interface CustomerColumnDeps {
  can: (perm: string) => boolean
  openEditDialog: (customer: Customer) => void
  setDeleteTarget: (customer: Customer) => void
  handleActivate: (id: number) => void
  activateMutation: { isPending: boolean }
}

export function customerColumns(deps: CustomerColumnDeps): ColumnDef<Customer>[] {
  const { can, openEditDialog, setDeleteTarget, handleActivate, activateMutation } = deps

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortHeader label="Nombre" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
    },
    {
      accessorKey: "customer_type",
      header: ({ column }) => (
        <SortHeader label="Tipo Cliente" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      cell: ({ row }) => customerTypeLabel(row.original.customer_type),
    },
    {
      id: "document",
      header: "Documento",
      cell: ({ row }) => {
        const dt = row.original.document_type
        const dn = row.original.document_number
        return dt && dn ? `${dt.toUpperCase()}: ${dn}` : "—"
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <SortHeader label="Email" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      cell: ({ row }) => row.original.email ?? "—",
    },
    {
      accessorKey: "phone",
      header: "Teléfono",
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      accessorKey: "city",
      header: ({ column }) => (
        <SortHeader label="Ciudad" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
      ),
      cell: ({ row }) => row.original.city ?? "—",
    },
    {
      accessorKey: "country",
      header: "País",
      cell: ({ row }) => row.original.country ?? "—",
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
        const c = row.original
        return (
          <div className="flex items-center gap-1">
            {can("customer.change_customer") && (
              <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(c)}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Button>
            )}
            {can("customer.delete_customer") && (
              c.is_active ? (
                <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(c)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleActivate(c.id)}
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
