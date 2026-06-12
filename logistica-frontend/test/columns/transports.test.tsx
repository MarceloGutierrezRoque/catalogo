import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  vehicleTypeLabel,
  formatNumber,
  transportColumns,
  type TransportColumnDeps,
} from "@/components/columns/transports"
import type { Transport } from "@/types/api"

const mockTransport: Transport = {
  id: 1,
  plate: "ABC-123",
  vehicle_type: "truck",
  brand: "Toyota",
  model: "Hilux",
  year: 2020,
  capacity_kg: "1500.00",
  capacity_volume: "10.00",
  is_available: true,
  is_active: true,
  created_at: "",
  updated_at: "",
}

const mockInactiveTransport: Transport = {
  ...mockTransport,
  id: 2,
  plate: "INACT-01",
  is_active: false,
}

const defaultDeps: TransportColumnDeps = {
  can: () => true,
  openEditDialog: () => {},
  setDeleteTarget: () => {},
  handleActivate: () => {},
  activateMutation: { isPending: false },
}

// ── Helper function tests ──

describe("vehicleTypeLabel", () => {
  it('returns "Camión" for truck', () => {
    expect(vehicleTypeLabel("truck")).toBe("Camión")
  })

  it('returns "Furgoneta" for van', () => {
    expect(vehicleTypeLabel("van")).toBe("Furgoneta")
  })

  it('returns "Camioneta" for pickup', () => {
    expect(vehicleTypeLabel("pickup")).toBe("Camioneta")
  })

  it('returns "Otro" for other', () => {
    expect(vehicleTypeLabel("other")).toBe("Otro")
  })

  it("returns the raw string for unknown types", () => {
    expect(vehicleTypeLabel("bus")).toBe("bus")
  })

  it("returns em dash for null", () => {
    expect(vehicleTypeLabel(null)).toBe("—")
  })
})

describe("formatNumber", () => {
  it("formats a valid number string", () => {
    expect(formatNumber("1500.00")).toBe("1.500")
  })

  it("returns em dash for null", () => {
    expect(formatNumber(null)).toBe("—")
  })

  it("returns em dash for NaN", () => {
    expect(formatNumber("not-a-number")).toBe("—")
  })
})

// ── Column structure tests ──

describe("transportColumns", () => {
  it("returns the correct number of columns", () => {
    const cols = transportColumns(defaultDeps)
    expect(cols).toHaveLength(10)
  })

  it("includes expected column ids/keys", () => {
    const cols = transportColumns(defaultDeps)
    const keys = cols.map((c) => c.id ?? c.accessorKey)
    expect(keys).toEqual([
      "plate",
      "vehicle_type",
      "brand",
      "model",
      "year",
      "capacity_kg",
      "capacity_volume",
      "is_available",
      "is_active",
      "actions",
    ])
  })
})

// ── Cell render tests ──

describe("transportColumns cell render", () => {
  it("renders plate text", () => {
    const cols = transportColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "plate")!
      .cell as (ctx: { row: { original: Transport } }) => React.ReactNode

    const result = cellFn({ row: { original: mockTransport } } as never)
    render(<>{result}</>)
    expect(screen.getByText("ABC-123")).toBeInTheDocument()
  })

  it("renders translated vehicle_type", () => {
    const cols = transportColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "vehicle_type")!
      .cell as (ctx: { row: { original: Transport } }) => React.ReactNode

    const result = cellFn({ row: { original: mockTransport } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Camión")).toBeInTheDocument()
  })

  it('renders "—" for null brand', () => {
    const noBrand = { ...mockTransport, brand: null }
    const cols = transportColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "brand")!
      .cell as (ctx: { row: { original: Transport } }) => React.ReactNode

    const result = cellFn({ row: { original: noBrand } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it('renders "—" for null model', () => {
    const noModel = { ...mockTransport, model: null }
    const cols = transportColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "model")!
      .cell as (ctx: { row: { original: Transport } }) => React.ReactNode

    const result = cellFn({ row: { original: noModel } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("renders year as string", () => {
    const cols = transportColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "year")!
      .cell as (ctx: { row: { original: Transport } }) => React.ReactNode

    const result = cellFn({ row: { original: mockTransport } } as never)
    render(<>{result}</>)
    expect(screen.getByText("2020")).toBeInTheDocument()
  })

  it('renders "—" for null year', () => {
    const noYear = { ...mockTransport, year: null }
    const cols = transportColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "year")!
      .cell as (ctx: { row: { original: Transport } }) => React.ReactNode

    const result = cellFn({ row: { original: noYear } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("renders formatted capacity_kg", () => {
    const cols = transportColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "capacity_kg")!
      .cell as (ctx: { row: { original: Transport } }) => React.ReactNode

    const result = cellFn({ row: { original: mockTransport } } as never)
    render(<>{result}</>)
    const text = screen.getByText(/1/)
    expect(text).toBeInTheDocument()
  })

  it("renders formatted capacity_volume", () => {
    const cols = transportColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "capacity_volume")!
      .cell as (ctx: { row: { original: Transport } }) => React.ReactNode

    const result = cellFn({ row: { original: mockTransport } } as never)
    render(<>{result}</>)
    expect(screen.getByText("10")).toBeInTheDocument()
  })

  it('renders "Disponible" for is_available true', () => {
    const cols = transportColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "is_available")!
      .cell as (ctx: { row: { original: Transport } }) => React.ReactNode

    const result = cellFn({ row: { original: mockTransport } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Disponible")).toBeInTheDocument()
  })

  it('renders "En uso" for is_available false', () => {
    const unavailable = { ...mockTransport, is_available: false }
    const cols = transportColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "is_available")!
      .cell as (ctx: { row: { original: Transport } }) => React.ReactNode

    const result = cellFn({ row: { original: unavailable } } as never)
    render(<>{result}</>)
    expect(screen.getByText("En uso")).toBeInTheDocument()
  })

  it('renders "Activo" for is_active true', () => {
    const cols = transportColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "is_active")!
      .cell as (ctx: { row: { original: Transport } }) => React.ReactNode

    const result = cellFn({ row: { original: mockTransport } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Activo")).toBeInTheDocument()
  })

  it('renders "Inactivo" for is_active false', () => {
    const cols = transportColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "is_active")!
      .cell as (ctx: { row: { original: Transport } }) => React.ReactNode

    const result = cellFn({ row: { original: mockInactiveTransport } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Inactivo")).toBeInTheDocument()
  })

  it("renders Edit and Delete buttons for active transport", () => {
    const cols = transportColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "actions")!
      .cell as (ctx: { row: { original: Transport } }) => React.ReactNode

    const result = cellFn({ row: { original: mockTransport } } as never)
    render(<>{result}</>)

    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /eliminar/i })).toBeInTheDocument()
  })

  it("renders Activate button for inactive transport", () => {
    const cols = transportColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "actions")!
      .cell as (ctx: { row: { original: Transport } }) => React.ReactNode

    const result = cellFn({ row: { original: mockInactiveTransport } } as never)
    render(<>{result}</>)

    expect(screen.queryByRole("button", { name: /eliminar/i })).not.toBeInTheDocument()
    expect(screen.getByText("Activar")).toBeInTheDocument()
  })
})
