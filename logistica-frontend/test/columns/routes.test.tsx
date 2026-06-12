import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  RouteStatusBadge,
  routeColumns,
  type RouteColumnDeps,
} from "@/components/columns/routes"
import type { Route } from "@/types/api"
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

const mockStop = { id: 1, route: 1, order: 1, warehouse: 1, arrival_time: null, departure_time: null, status: "pending" as const }

const mockRoute: Route = {
  id: 1,
  name: "Ruta Lima-Arequipa",
  transport: 1,
  driver: 1,
  start_date: "2026-01-01T08:00:00Z",
  end_date: "2026-01-02T18:00:00Z",
  status: "planned",
  stops: [mockStop],
  is_active: true,
  created_at: "",
  updated_at: "",
}

const mockInactiveRoute: Route = {
  ...mockRoute,
  id: 2,
  name: "Ruta Inactiva",
  is_active: false,
  stops: [],
}

const mockRouter: AppRouterInstance = {
  push: () => {},
  replace: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
  prefetch: () => {},
}

const defaultDeps: RouteColumnDeps = {
  can: () => true,
  router: mockRouter,
  setDeleteTarget: () => {},
  handleActivate: () => {},
  activateMutation: { isPending: false },
}

// ── RouteStatusBadge tests ──

describe("RouteStatusBadge", () => {
  it('renders "Planificada" for planned', () => {
    render(<RouteStatusBadge status="planned" />)
    expect(screen.getByText("Planificada")).toBeInTheDocument()
  })

  it('renders "En curso" for in_progress', () => {
    render(<RouteStatusBadge status="in_progress" />)
    expect(screen.getByText("En curso")).toBeInTheDocument()
  })

  it('renders "Completada" for completed', () => {
    render(<RouteStatusBadge status="completed" />)
    expect(screen.getByText("Completada")).toBeInTheDocument()
  })

  it('renders "Cancelada" for cancelled', () => {
    render(<RouteStatusBadge status="cancelled" />)
    expect(screen.getByText("Cancelada")).toBeInTheDocument()
  })

  it("falls back to the raw status string for unknown statuses", () => {
    render(<RouteStatusBadge status="unknown" />)
    expect(screen.getByText("unknown")).toBeInTheDocument()
  })
})

// ── Column structure tests ──

describe("routeColumns", () => {
  it("returns the correct number of columns", () => {
    const cols = routeColumns(defaultDeps)
    expect(cols).toHaveLength(9)
  })

  it("includes expected column ids", () => {
    const cols = routeColumns(defaultDeps)
    const keys = cols.map((c) => c.id ?? c.accessorKey)
    expect(keys).toEqual([
      "name",
      "transport",
      "driver",
      "start_date",
      "end_date",
      "status",
      "stops_count",
      "is_active",
      "actions",
    ])
  })
})

// ── Cell render tests ──

describe("routeColumns cell render", () => {
  it("renders route name as a link", () => {
    const cols = routeColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "name")!
      .cell as (ctx: { row: { original: Route } }) => React.ReactNode

    const result = cellFn({ row: { original: mockRoute } } as never)
    render(<>{result}</>)
    const link = screen.getByRole("link", { name: /Ruta Lima-Arequipa/ })
    expect(link).toHaveAttribute("href", "/routes/1")
  })

  it('renders "Vehículo #1" for transport column', () => {
    const cols = routeColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "transport")!
      .cell as (ctx: { row: { original: Route } }) => React.ReactNode

    const result = cellFn({ row: { original: mockRoute } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Vehículo #1")).toBeInTheDocument()
  })

  it('renders "Conductor #1" for driver column', () => {
    const cols = routeColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "driver")!
      .cell as (ctx: { row: { original: Route } }) => React.ReactNode

    const result = cellFn({ row: { original: mockRoute } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Conductor #1")).toBeInTheDocument()
  })

  it('renders "—" for null start_date', () => {
    const noDateRoute = { ...mockRoute, start_date: null }
    const cols = routeColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "start_date")!
      .cell as (ctx: { row: { original: Route } }) => React.ReactNode

    const result = cellFn({ row: { original: noDateRoute } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it('renders "—" for null end_date', () => {
    const noDateRoute = { ...mockRoute, end_date: null }
    const cols = routeColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "end_date")!
      .cell as (ctx: { row: { original: Route } }) => React.ReactNode

    const result = cellFn({ row: { original: noDateRoute } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("renders stops count badge", () => {
    const cols = routeColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "stops_count")!
      .cell as (ctx: { row: { original: Route } }) => React.ReactNode

    const result = cellFn({ row: { original: mockRoute } } as never)
    render(<>{result}</>)
    expect(screen.getByText("1")).toBeInTheDocument()
  })

  it("renders stops count 0 when stops is empty", () => {
    const cols = routeColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "stops_count")!
      .cell as (ctx: { row: { original: Route } }) => React.ReactNode

    const result = cellFn({ row: { original: mockInactiveRoute } } as never)
    render(<>{result}</>)
    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("renders Edit and Delete buttons for active route", () => {
    const cols = routeColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "actions")!
      .cell as (ctx: { row: { original: Route } }) => React.ReactNode

    const result = cellFn({ row: { original: mockRoute } } as never)
    render(<>{result}</>)

    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /eliminar/i })).toBeInTheDocument()
  })

  it("renders Activate button for inactive route", () => {
    const cols = routeColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "actions")!
      .cell as (ctx: { row: { original: Route } }) => React.ReactNode

    const result = cellFn({ row: { original: mockInactiveRoute } } as never)
    render(<>{result}</>)

    expect(screen.queryByRole("button", { name: /eliminar/i })).not.toBeInTheDocument()
    expect(screen.getByText("Activar")).toBeInTheDocument()
  })
})
