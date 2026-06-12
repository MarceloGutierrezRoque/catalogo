import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  customerTypeLabel,
  customerTypeItems,
  docTypeItems,
  customerColumns,
  type CustomerColumnDeps,
} from "@/components/columns/customers"
import type { Customer } from "@/types/api"

const mockCustomer: Customer = {
  id: 1,
  name: "Juan Pérez",
  customer_type: "company",
  document_type: "ruc",
  document_number: "20123456789",
  email: "juan@example.com",
  phone: "+51999000111",
  address: "Av. Principal 123",
  city: "Lima",
  country: "Perú",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const mockInactiveCustomer: Customer = {
  ...mockCustomer,
  id: 2,
  name: "Inactivo SA",
  email: null,
  phone: null,
  city: null,
  country: null,
  document_type: null,
  document_number: null,
  is_active: false,
}

const defaultDeps: CustomerColumnDeps = {
  can: () => true,
  openEditDialog: () => {},
  setDeleteTarget: () => {},
  handleActivate: () => {},
  activateMutation: { isPending: false },
}

// ── Helper function tests ──

describe("customerTypeLabel", () => {
  it('returns "Empresa" for company', () => {
    expect(customerTypeLabel("company")).toBe("Empresa")
  })

  it('returns "Persona" for person', () => {
    expect(customerTypeLabel("person")).toBe("Persona")
  })
})

describe("customerTypeItems", () => {
  it("maps company and person correctly", () => {
    expect(customerTypeItems).toMatchObject({
      company: "Empresa",
      person: "Persona",
    })
  })
})

describe("docTypeItems", () => {
  it("contains all document types", () => {
    expect(docTypeItems).toMatchObject({
      ruc: "RUC",
      dni: "DNI",
      ce: "Carné de Extranjería",
      other: "Otro",
    })
  })
})

// ── Column factory structure tests ──

describe("customerColumns", () => {
  it("returns the correct number of columns", () => {
    const cols = customerColumns(defaultDeps)
    expect(cols).toHaveLength(9)
  })

  it("includes expected column accessorKeys and ids", () => {
    const cols = customerColumns(defaultDeps)
    const keys = cols.map((c) => c.id ?? c.accessorKey)
    expect(keys).toEqual([
      "name",
      "customer_type",
      "document",
      "email",
      "phone",
      "city",
      "country",
      "is_active",
      "actions",
    ])
  })
})

// ── Column cell render tests ──

describe("customerColumns cell render", () => {
  it("renders 'Empresa' for company type", () => {
    const cols = customerColumns(defaultDeps)
    const typeCol = cols.find((c) => c.accessorKey === "customer_type")!
    const cellFn = typeCol.cell as (ctx: { row: { original: Customer } }) => string
    const result = cellFn({ row: { original: mockCustomer } } as never)

    if (typeof result === "string") {
      expect(result).toBe("Empresa")
    } else {
      render(<>{result}</>)
      expect(screen.getByText("Empresa")).toBeInTheDocument()
    }
  })

  it("renders document column as 'RUC: 20123456789'", () => {
    const cols = customerColumns(defaultDeps)
    const docCol = cols.find((c) => c.id === "document")!
    const cellFn = docCol.cell as (ctx: { row: { original: Customer } }) => string

    const result = cellFn({ row: { original: mockCustomer } } as never)

    if (typeof result === "string") {
      expect(result).toBe("RUC: 20123456789")
    } else {
      render(<>{result}</>)
      expect(screen.getByText("RUC: 20123456789")).toBeInTheDocument()
    }
  })

  it("renders '—' for document when values are null", () => {
    const cols = customerColumns(defaultDeps)
    const docCol = cols.find((c) => c.id === "document")!
    const cellFn = docCol.cell as (ctx: { row: { original: Customer } }) => string

    const result = cellFn({ row: { original: mockInactiveCustomer } } as never)

    if (typeof result === "string") {
      expect(result).toBe("—")
    } else {
      render(<>{result}</>)
      expect(screen.getByText("—")).toBeInTheDocument()
    }
  })

  it("renders '—' for null email", () => {
    const cols = customerColumns(defaultDeps)
    const emailCol = cols.find((c) => c.accessorKey === "email")!
    const cellFn = emailCol.cell as (ctx: { row: { original: Customer } }) => string

    const result = cellFn({ row: { original: mockInactiveCustomer } } as never)

    if (typeof result === "string") {
      expect(result).toBe("—")
    } else {
      render(<>{result}</>)
      expect(screen.getByText("—")).toBeInTheDocument()
    }
  })

  it("renders 'Activo' badge for is_active=true", () => {
    const cols = customerColumns(defaultDeps)
    const activeCol = cols.find((c) => c.accessorKey === "is_active")!
    const cellFn = activeCol.cell as (ctx: { row: { original: Customer } }) => string

    const result = cellFn({ row: { original: mockCustomer } } as never)

    if (typeof result === "string") {
      expect(result).toBe("Activo")
    } else {
      render(<>{result}</>)
      expect(screen.getByText("Activo")).toBeInTheDocument()
    }
  })

  it("renders 'Inactivo' badge for is_active=false", () => {
    const cols = customerColumns(defaultDeps)
    const activeCol = cols.find((c) => c.accessorKey === "is_active")!
    const cellFn = activeCol.cell as (ctx: { row: { original: Customer } }) => string

    const result = cellFn({ row: { original: mockInactiveCustomer } } as never)

    if (typeof result === "string") {
      expect(result).toBe("Inactivo")
    } else {
      render(<>{result}</>)
      expect(screen.getByText("Inactivo")).toBeInTheDocument()
    }
  })

  it("renders actions with Edit and Delete buttons when can() returns true", () => {
    const cols = customerColumns(defaultDeps)
    const actionCol = cols.find((c) => c.id === "actions")!
    const cellFn = actionCol.cell as (ctx: { row: { original: Customer } }) => React.ReactNode

    const result = cellFn({ row: { original: mockCustomer } } as never)
    render(<>{result}</>)

    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /eliminar/i })).toBeInTheDocument()
  })

  it("does not render action buttons when can() returns false", () => {
    const deps: CustomerColumnDeps = { ...defaultDeps, can: () => false }
    const cols = customerColumns(deps)
    const actionCol = cols.find((c) => c.id === "actions")!
    const cellFn = actionCol.cell as (ctx: { row: { original: Customer } }) => React.ReactNode

    const result = cellFn({ row: { original: mockCustomer } } as never)
    render(<>{result}</>)

    expect(screen.queryByRole("button", { name: /editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /eliminar/i })).not.toBeInTheDocument()
  })

  it("renders Activate button for inactive customer when can delete", () => {
    const deps: CustomerColumnDeps = { ...defaultDeps, can: () => true }
    const cols = customerColumns(deps)
    const actionCol = cols.find((c) => c.id === "actions")!
    const cellFn = actionCol.cell as (ctx: { row: { original: Customer } }) => React.ReactNode

    const result = cellFn({ row: { original: mockInactiveCustomer } } as never)
    render(<>{result}</>)

    expect(screen.queryByRole("button", { name: /eliminar/i })).not.toBeInTheDocument()
    expect(screen.getByText("Activar")).toBeInTheDocument()
  })
})
