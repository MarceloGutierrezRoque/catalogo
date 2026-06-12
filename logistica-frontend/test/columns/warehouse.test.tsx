import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  warehouseColumns,
  type WarehouseColumnDeps,
} from "@/components/columns/warehouse"
import type { Warehouse } from "@/types/api"

const mockWarehouse: Warehouse = {
  id: 1,
  name: "Almacén Central",
  code: "WH-001",
  address: "Av. Industrial 456",
  city: "Lima",
  country: "Perú",
  capacity: 10000,
  is_active: true,
  created_at: "",
  updated_at: "",
}

const mockInactiveWarehouse: Warehouse = {
  ...mockWarehouse,
  id: 2,
  name: "Almacén Inactivo",
  is_active: false,
}

const defaultDeps: WarehouseColumnDeps = {
  can: () => true,
  openEditDialog: () => {},
  setDeleteTarget: () => {},
  handleActivate: () => {},
  activateMutation: { isPending: false },
}

// ── Column structure tests ──

describe("warehouseColumns", () => {
  it("returns the correct number of columns", () => {
    const cols = warehouseColumns(defaultDeps)
    expect(cols).toHaveLength(8)
  })

  it("includes expected column ids/keys", () => {
    const cols = warehouseColumns(defaultDeps)
    const keys = cols.map((c) => c.id ?? c.accessorKey)
    expect(keys).toEqual([
      "name",
      "code",
      "address",
      "city",
      "country",
      "capacity",
      "is_active",
      "actions",
    ])
  })
})

// ── Cell render tests ──

describe("warehouseColumns cell render", () => {
  it("renders name", () => {
    const cols = warehouseColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "name")!
      .cell as (ctx: { row: { original: Warehouse } }) => React.ReactNode

    const result = cellFn({ row: { original: mockWarehouse } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Almacén Central")).toBeInTheDocument()
  })

  it("renders code", () => {
    const cols = warehouseColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "code")!
      .cell as (ctx: { row: { original: Warehouse } }) => React.ReactNode

    const result = cellFn({ row: { original: mockWarehouse } } as never)
    render(<>{result}</>)
    expect(screen.getByText("WH-001")).toBeInTheDocument()
  })

  it('renders "—" for null address', () => {
    const nullAddr = { ...mockWarehouse, address: null }
    const cols = warehouseColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "address")!
      .cell as (ctx: { row: { original: Warehouse } }) => React.ReactNode

    const result = cellFn({ row: { original: nullAddr } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it('renders "—" for null city', () => {
    const nullCity = { ...mockWarehouse, city: null }
    const cols = warehouseColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "city")!
      .cell as (ctx: { row: { original: Warehouse } }) => React.ReactNode

    const result = cellFn({ row: { original: nullCity } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it('renders "—" for null country', () => {
    const nullCountry = { ...mockWarehouse, country: null }
    const cols = warehouseColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "country")!
      .cell as (ctx: { row: { original: Warehouse } }) => React.ReactNode

    const result = cellFn({ row: { original: nullCountry } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("renders capacity with locale formatting", () => {
    const cols = warehouseColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "capacity")!
      .cell as (ctx: { row: { original: Warehouse } }) => React.ReactNode

    const result = cellFn({ row: { original: mockWarehouse } } as never)
    render(<>{result}</>)
    expect(screen.getByText("10,000")).toBeInTheDocument()
  })

  it('renders "—" for null capacity', () => {
    const nullCap = { ...mockWarehouse, capacity: null }
    const cols = warehouseColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "capacity")!
      .cell as (ctx: { row: { original: Warehouse } }) => React.ReactNode

    const result = cellFn({ row: { original: nullCap } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it('renders "Activo" for is_active true', () => {
    const cols = warehouseColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "is_active")!
      .cell as (ctx: { row: { original: Warehouse } }) => React.ReactNode

    const result = cellFn({ row: { original: mockWarehouse } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Activo")).toBeInTheDocument()
  })

  it('renders "Inactivo" for is_active false', () => {
    const cols = warehouseColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "is_active")!
      .cell as (ctx: { row: { original: Warehouse } }) => React.ReactNode

    const result = cellFn({ row: { original: mockInactiveWarehouse } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Inactivo")).toBeInTheDocument()
  })

  it("renders Edit and Delete buttons for active warehouse", () => {
    const cols = warehouseColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "actions")!
      .cell as (ctx: { row: { original: Warehouse } }) => React.ReactNode

    const result = cellFn({ row: { original: mockWarehouse } } as never)
    render(<>{result}</>)

    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /eliminar/i })).toBeInTheDocument()
  })

  it("renders Activate button for inactive warehouse", () => {
    const cols = warehouseColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "actions")!
      .cell as (ctx: { row: { original: Warehouse } }) => React.ReactNode

    const result = cellFn({ row: { original: mockInactiveWarehouse } } as never)
    render(<>{result}</>)

    expect(screen.queryByRole("button", { name: /eliminar/i })).not.toBeInTheDocument()
    expect(screen.getByText("Activar")).toBeInTheDocument()
  })
})
