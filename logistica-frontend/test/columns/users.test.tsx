import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  userColumns,
  type UserColumnDeps,
} from "@/components/columns/users"
import type { User } from "@/types/api"

const mockUser: User = {
  id: 1,
  username: "jperez",
  email: "jperez@example.com",
  first_name: "Juan",
  last_name: "Pérez",
  is_active: true,
  is_staff: false,
  is_superuser: false,
  groups: [1, 2],
  date_joined: "2026-01-01T00:00:00Z",
  last_login: null,
}

const mockCurrentUser = { id: 1 }

const defaultDeps: UserColumnDeps = {
  openEditDialog: () => {},
  setDeleteTarget: () => {},
  currentUser: mockCurrentUser,
  resolveGroupNames: (ids) => ids.map(() => "Admin").join(", "),
}

// ── Column structure tests ──

describe("userColumns", () => {
  it("returns the correct number of columns", () => {
    const cols = userColumns(defaultDeps)
    expect(cols).toHaveLength(8)
  })

  it("includes expected column ids/keys", () => {
    const cols = userColumns(defaultDeps)
    const keys = cols.map((c) => c.id ?? c.accessorKey)
    expect(keys).toEqual([
      "id",
      "username",
      "email",
      "name",
      "roles",
      "is_superuser",
      "is_active",
      "actions",
    ])
  })
})

// ── Cell render tests ──

describe("userColumns cell render", () => {
  it("renders id", () => {
    const cols = userColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "id")!
      .cell as (ctx: { row: { original: User } }) => React.ReactNode

    const result = cellFn({ row: { original: mockUser } } as never)
    render(<>{result}</>)
    expect(screen.getByText("1")).toBeInTheDocument()
  })

  it("renders username", () => {
    const cols = userColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "username")!
      .cell as (ctx: { row: { original: User } }) => React.ReactNode

    const result = cellFn({ row: { original: mockUser } } as never)
    render(<>{result}</>)
    expect(screen.getByText("jperez")).toBeInTheDocument()
  })

  it('renders "—" for empty email', () => {
    const noEmail = { ...mockUser, email: "" }
    const cols = userColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "email")!
      .cell as (ctx: { row: { original: User } }) => React.ReactNode

    const result = cellFn({ row: { original: noEmail } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("renders full name", () => {
    const cols = userColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "name")!
      .cell as (ctx: { row: { original: User } }) => React.ReactNode

    const result = cellFn({ row: { original: mockUser } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument()
  })

  it('renders "—" when both names are empty', () => {
    const noName = { ...mockUser, first_name: "", last_name: "" }
    const cols = userColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "name")!
      .cell as (ctx: { row: { original: User } }) => React.ReactNode

    const result = cellFn({ row: { original: noName } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("renders resolveGroupNames result for roles", () => {
    const cols = userColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "roles")!
      .cell as (ctx: { row: { original: User } }) => React.ReactNode

    const result = cellFn({ row: { original: mockUser } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Admin, Admin")).toBeInTheDocument()
  })

  it('renders "—" for empty groups', () => {
    const noGroups = { ...mockUser, groups: [] }
    const cols = userColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "roles")!
      .cell as (ctx: { row: { original: User } }) => React.ReactNode

    const result = cellFn({ row: { original: noGroups } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it('renders "Sí" for is_superuser true', () => {
    const superuser = { ...mockUser, is_superuser: true }
    const cols = userColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "is_superuser")!
      .cell as (ctx: { row: { original: User } }) => React.ReactNode

    const result = cellFn({ row: { original: superuser } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Sí")).toBeInTheDocument()
  })

  it('renders "No" for is_superuser false', () => {
    const cols = userColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "is_superuser")!
      .cell as (ctx: { row: { original: User } }) => React.ReactNode

    const result = cellFn({ row: { original: mockUser } } as never)
    render(<>{result}</>)
    expect(screen.getByText("No")).toBeInTheDocument()
  })

  it('renders "Sí" for is_active true', () => {
    const cols = userColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "is_active")!
      .cell as (ctx: { row: { original: User } }) => React.ReactNode

    const result = cellFn({ row: { original: mockUser } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Sí")).toBeInTheDocument()
  })

  it('renders "No" for is_active false', () => {
    const inactive = { ...mockUser, is_active: false }
    const cols = userColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "is_active")!
      .cell as (ctx: { row: { original: User } }) => React.ReactNode

    const result = cellFn({ row: { original: inactive } } as never)
    render(<>{result}</>)
    expect(screen.getByText("No")).toBeInTheDocument()
  })

  it("renders Edit button for any user", () => {
    const cols = userColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "actions")!
      .cell as (ctx: { row: { original: User } }) => React.ReactNode

    const result = cellFn({ row: { original: mockUser } } as never)
    render(<>{result}</>)

    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument()
  })

  it("hides Delete button for current user", () => {
    const cols = userColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "actions")!
      .cell as (ctx: { row: { original: User } }) => React.ReactNode

    const result = cellFn({ row: { original: mockUser } } as never)
    render(<>{result}</>)

    expect(screen.queryByRole("button", { name: /eliminar/i })).not.toBeInTheDocument()
  })

  it("shows Delete button for other users", () => {
    const deps: UserColumnDeps = {
      ...defaultDeps,
      currentUser: { id: 999 },
    }

    const cols = userColumns(deps)
    const cellFn = cols.find((c) => c.id === "actions")!
      .cell as (ctx: { row: { original: User } }) => React.ReactNode

    const result = cellFn({ row: { original: mockUser } } as never)
    render(<>{result}</>)

    expect(screen.getByRole("button", { name: /eliminar/i })).toBeInTheDocument()
  })
})
