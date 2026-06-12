import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  supplierColumns,
  type SupplierColumnDeps,
} from "@/components/columns/suppliers"
import type { Supplier } from "@/types/api"

const mockSupplier: Supplier = {
  id: 1,
  name: "TecnoSupply S.A.",
  contact_name: "Carlos López",
  email: "carlos@tecnosupply.com",
  phone: "+51999000111",
  address: "Jr. Las Flores 456",
  city: "Arequipa",
  country: "Perú",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const mockInactiveSupplier: Supplier = {
  ...mockSupplier,
  id: 2,
  name: "Inactivo SAC",
  email: null,
  phone: null,
  contact_name: null,
  address: null,
  city: null,
  country: null,
  is_active: false,
}

const defaultDeps: SupplierColumnDeps = {
  can: () => true,
  openEditDialog: () => {},
  setDeleteTarget: () => {},
  handleActivate: () => {},
  activateMutation: { isPending: false },
}

describe("supplierColumns", () => {
  it("returns the correct number of columns", () => {
    const cols = supplierColumns(defaultDeps)
    expect(cols).toHaveLength(9)
  })

  it("includes expected column accessorKeys and ids", () => {
    const cols = supplierColumns(defaultDeps)
    const keys = cols.map((c) => c.id ?? c.accessorKey)
    expect(keys).toEqual([
      "name",
      "contact_name",
      "email",
      "phone",
      "address",
      "city",
      "country",
      "is_active",
      "actions",
    ])
  })
})

describe("supplierColumns cell render", () => {
  it("renders supplier name", () => {
    const cols = supplierColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "name")!
      .cell as (ctx: { row: { original: Supplier } }) => React.ReactNode

    const result = cellFn({ row: { original: mockSupplier } } as never)
    render(<>{result}</>)
    expect(screen.getByText("TecnoSupply S.A.")).toBeInTheDocument()
  })

  it('renders "—" for null contact_name', () => {
    const cols = supplierColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "contact_name")!
      .cell as (ctx: { row: { original: Supplier } }) => React.ReactNode

    const result = cellFn({ row: { original: mockInactiveSupplier } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it('renders "—" for null email', () => {
    const cols = supplierColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "email")!
      .cell as (ctx: { row: { original: Supplier } }) => React.ReactNode

    const result = cellFn({ row: { original: mockInactiveSupplier } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it('renders "—" for null address', () => {
    const cols = supplierColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "address")!
      .cell as (ctx: { row: { original: Supplier } }) => React.ReactNode

    const result = cellFn({ row: { original: mockInactiveSupplier } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("renders 'Inactivo' for is_active=false", () => {
    const cols = supplierColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "is_active")!
      .cell as (ctx: { row: { original: Supplier } }) => React.ReactNode

    const result = cellFn({ row: { original: mockInactiveSupplier } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Inactivo")).toBeInTheDocument()
  })

  it("renders Edit and Delete buttons for active supplier", () => {
    const cols = supplierColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "actions")!
      .cell as (ctx: { row: { original: Supplier } }) => React.ReactNode

    const result = cellFn({ row: { original: mockSupplier } } as never)
    render(<>{result}</>)

    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /eliminar/i })).toBeInTheDocument()
  })

  it("renders Activate button for inactive supplier", () => {
    const cols = supplierColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "actions")!
      .cell as (ctx: { row: { original: Supplier } }) => React.ReactNode

    const result = cellFn({ row: { original: mockInactiveSupplier } } as never)
    render(<>{result}</>)

    expect(screen.queryByRole("button", { name: /eliminar/i })).not.toBeInTheDocument()
    expect(screen.getByText("Activar")).toBeInTheDocument()
  })
})
