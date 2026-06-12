import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  roleColumns,
  type RoleColumnDeps,
} from "@/components/columns/roles"
import type { Group } from "@/types/api"

const mockGroup: Group = {
  id: 1,
  name: "Administradores",
  permissions: [1, 2, 3],
}

const mockGroupNoPerms: Group = {
  id: 2,
  name: "Solo Lectura",
  permissions: [],
}

const defaultDeps: RoleColumnDeps = {
  openEditDialog: () => {},
  setDeleteTarget: () => {},
}

// ── Column structure tests ──

describe("roleColumns", () => {
  it("returns the correct number of columns", () => {
    const cols = roleColumns(defaultDeps)
    expect(cols).toHaveLength(4)
  })

  it("includes expected column ids/keys", () => {
    const cols = roleColumns(defaultDeps)
    const keys = cols.map((c) => c.id ?? c.accessorKey)
    expect(keys).toEqual([
      "id",
      "name",
      "permissions_count",
      "actions",
    ])
  })
})

// ── Cell render tests ──

describe("roleColumns cell render", () => {
  it("renders id", () => {
    const cols = roleColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "id")!
      .cell as (ctx: { row: { original: Group } }) => React.ReactNode

    const result = cellFn({ row: { original: mockGroup } } as never)
    render(<>{result}</>)
    expect(screen.getByText("1")).toBeInTheDocument()
  })

  it("renders name", () => {
    const cols = roleColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "name")!
      .cell as (ctx: { row: { original: Group } }) => React.ReactNode

    const result = cellFn({ row: { original: mockGroup } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Administradores")).toBeInTheDocument()
  })

  it('renders "3 permisos" for a group with 3 permissions', () => {
    const cols = roleColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "permissions_count")!
      .cell as (ctx: { row: { original: Group } }) => React.ReactNode

    const result = cellFn({ row: { original: mockGroup } } as never)
    render(<>{result}</>)
    expect(screen.getByText("3 permisos")).toBeInTheDocument()
  })

  it('renders "0 permisos" for a group with no permissions', () => {
    const cols = roleColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "permissions_count")!
      .cell as (ctx: { row: { original: Group } }) => React.ReactNode

    const result = cellFn({ row: { original: mockGroupNoPerms } } as never)
    render(<>{result}</>)
    expect(screen.getByText("0 permisos")).toBeInTheDocument()
  })

  it("renders Edit and Delete buttons", () => {
    const cols = roleColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "actions")!
      .cell as (ctx: { row: { original: Group } }) => React.ReactNode

    const result = cellFn({ row: { original: mockGroup } } as never)
    render(<>{result}</>)

    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /eliminar/i })).toBeInTheDocument()
  })
})
