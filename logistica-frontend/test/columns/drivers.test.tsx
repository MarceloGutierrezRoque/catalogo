import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  formatDate,
  driverColumns,
  type DriverColumnDeps,
} from "@/components/columns/drivers"
import type { Driver } from "@/types/api"

const mockDriver: Driver = {
  id: 1,
  user: 10,
  license_number: "LIC-001",
  phone: "+51999000111",
  email: "conductor@logistica.com",
  hire_date: "2025-01-15",
  is_available: true,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const mockUnavailableDriver: Driver = {
  ...mockDriver,
  id: 2,
  license_number: "LIC-002",
  email: null,
  phone: null,
  hire_date: null,
  is_available: false,
  is_active: false,
}

const defaultDeps: DriverColumnDeps = {
  can: () => true,
  openEditDialog: () => {},
  setDeleteTarget: () => {},
  handleActivate: () => {},
  activateMutation: { isPending: false },
}

// ── Helper function tests ──

describe("formatDate", () => {
  it("formats a valid date producing a non-empty string", () => {
    expect(formatDate("2025-01-15")).not.toBe("—")
  })

  it('returns "—" for null', () => {
    expect(formatDate(null)).toBe("—")
  })

  it('returns "—" for empty string', () => {
    expect(formatDate("")).toBe("—")
  })

  it("returns 'Invalid Date' for unparseable input (current impl)", () => {
    expect(formatDate("not-a-date")).toBe("Invalid Date")
  })
})

// ── Column structure tests ──

describe("driverColumns", () => {
  it("returns the correct number of columns", () => {
    const cols = driverColumns(defaultDeps)
    expect(cols).toHaveLength(8)
  })

  it("includes expected column accessorKeys and ids", () => {
    const cols = driverColumns(defaultDeps)
    const keys = cols.map((c) => c.id ?? c.accessorKey)
    expect(keys).toEqual([
      "license_number",
      "user",
      "phone",
      "email",
      "hire_date",
      "is_available",
      "is_active",
      "actions",
    ])
  })
})

// ── Cell render tests ──

describe("driverColumns cell render", () => {
  it("renders license_number text", () => {
    const cols = driverColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "license_number")!
      .cell as (ctx: { row: { original: Driver } }) => React.ReactNode

    const result = cellFn({ row: { original: mockDriver } } as never)
    render(<>{result}</>)
    expect(screen.getByText("LIC-001")).toBeInTheDocument()
  })

  it("renders user column as 'User #10'", () => {
    const cols = driverColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "user")!
      .cell as (ctx: { row: { original: Driver } }) => React.ReactNode

    const result = cellFn({ row: { original: mockDriver } } as never)
    render(<>{result}</>)
    expect(screen.getByText("User #10")).toBeInTheDocument()
  })

  it('renders "—" for null phone', () => {
    const cols = driverColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "phone")!
      .cell as (ctx: { row: { original: Driver } }) => React.ReactNode

    const result = cellFn({ row: { original: mockUnavailableDriver } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it('renders "—" for null email', () => {
    const cols = driverColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "email")!
      .cell as (ctx: { row: { original: Driver } }) => React.ReactNode

    const result = cellFn({ row: { original: mockUnavailableDriver } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("renders 'Disponible' badge for is_available=true", () => {
    const cols = driverColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "is_available")!
      .cell as (ctx: { row: { original: Driver } }) => React.ReactNode

    const result = cellFn({ row: { original: mockDriver } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Disponible")).toBeInTheDocument()
  })

  it("renders 'No disponible' badge for is_available=false", () => {
    const cols = driverColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "is_available")!
      .cell as (ctx: { row: { original: Driver } }) => React.ReactNode

    const result = cellFn({ row: { original: mockUnavailableDriver } } as never)
    render(<>{result}</>)
    expect(screen.getByText("No disponible")).toBeInTheDocument()
  })

  it("renders 'Inactivo' badge for is_active=false", () => {
    const cols = driverColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "is_active")!
      .cell as (ctx: { row: { original: Driver } }) => React.ReactNode

    const result = cellFn({ row: { original: mockUnavailableDriver } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Inactivo")).toBeInTheDocument()
  })

  it("renders Edit and Delete buttons when can() returns true", () => {
    const cols = driverColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "actions")!
      .cell as (ctx: { row: { original: Driver } }) => React.ReactNode

    const result = cellFn({ row: { original: mockDriver } } as never)
    render(<>{result}</>)

    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /eliminar/i })).toBeInTheDocument()
  })

  it("renders Activate button for inactive driver", () => {
    const cols = driverColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "actions")!
      .cell as (ctx: { row: { original: Driver } }) => React.ReactNode

    const result = cellFn({ row: { original: mockUnavailableDriver } } as never)
    render(<>{result}</>)

    expect(screen.queryByRole("button", { name: /eliminar/i })).not.toBeInTheDocument()
    expect(screen.getByText("Activar")).toBeInTheDocument()
  })
})
