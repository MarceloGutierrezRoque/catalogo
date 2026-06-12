import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  StatusBadge,
  shipmentColumns,
  type ShipmentColumnDeps,
} from "@/components/columns/shipments"
import type { Shipment } from "@/types/api"
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

const mockItem = {
  id: 1,
  shipment: 1,
  product: 1,
  quantity: 10,
  unit_price_at_shipping: "100.00",
}

const mockShipment: Shipment = {
  id: 1,
  tracking_number: "SHP-001",
  customer: 1,
  origin_warehouse: 2,
  destination_address: "Av. Siempre Viva 123",
  destination_city: "Lima",
  destination_country: "Perú",
  status: "pending",
  shipping_date: "2026-01-01T10:00:00Z",
  estimated_delivery_date: null,
  actual_delivery_date: null,
  route: null,
  observations: null,
  items: [mockItem],
  is_active: true,
  created_at: "",
  updated_at: "",
}

const mockInactiveShipment: Shipment = {
  ...mockShipment,
  id: 2,
  tracking_number: "SHP-002",
  is_active: false,
}

const mockRouter: AppRouterInstance = {
  push: () => {},
  replace: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
  prefetch: () => {},
}

const defaultDeps: ShipmentColumnDeps = {
  can: () => true,
  router: mockRouter,
  setDeleteTarget: () => {},
  handleActivate: () => {},
  activateMutation: { isPending: false },
}

// ── StatusBadge component tests ──

describe("StatusBadge", () => {
  it('renders "Pendiente" for pending', () => {
    render(<StatusBadge status="pending" />)
    expect(screen.getByText("Pendiente")).toBeInTheDocument()
  })

  it('renders "Recogido" for picked_up', () => {
    render(<StatusBadge status="picked_up" />)
    expect(screen.getByText("Recogido")).toBeInTheDocument()
  })

  it('renders "En tránsito" for in_transit', () => {
    render(<StatusBadge status="in_transit" />)
    expect(screen.getByText("En tránsito")).toBeInTheDocument()
  })

  it('renders "Entregado" for delivered', () => {
    render(<StatusBadge status="delivered" />)
    expect(screen.getByText("Entregado")).toBeInTheDocument()
  })

  it('renders "Cancelado" for cancelled', () => {
    render(<StatusBadge status="cancelled" />)
    expect(screen.getByText("Cancelado")).toBeInTheDocument()
  })

  it("falls back to the raw status string for unknown statuses", () => {
    render(<StatusBadge status="unknown" />)
    expect(screen.getByText("unknown")).toBeInTheDocument()
  })
})

// ── Column structure tests ──

describe("shipmentColumns", () => {
  it("returns the correct number of columns", () => {
    const cols = shipmentColumns(defaultDeps)
    expect(cols).toHaveLength(9)
  })

  it("includes expected column ids/keys", () => {
    const cols = shipmentColumns(defaultDeps)
    const keys = cols.map((c) => c.id ?? c.accessorKey)
    expect(keys).toEqual([
      "tracking_number",
      "customer",
      "origin_warehouse",
      "destination_city",
      "status",
      "shipping_date",
      "items_count",
      "actions",
    ])
  })
})

// ── Cell render tests ──

describe("shipmentColumns cell render", () => {
  it("renders tracking_number as a link", () => {
    const cols = shipmentColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "tracking_number")!
      .cell as (ctx: { row: { original: Shipment } }) => React.ReactNode

    const result = cellFn({ row: { original: mockShipment } } as never)
    render(<>{result}</>)
    const link = screen.getByRole("link", { name: /SHP-001/ })
    expect(link).toHaveAttribute("href", "/shipments/1")
  })

  it('renders "Cliente #1" for customer column', () => {
    const cols = shipmentColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "customer")!
      .cell as (ctx: { row: { original: Shipment } }) => React.ReactNode

    const result = cellFn({ row: { original: mockShipment } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Cliente #1")).toBeInTheDocument()
  })

  it('renders "Almacén #2" for origin_warehouse column', () => {
    const cols = shipmentColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "origin_warehouse")!
      .cell as (ctx: { row: { original: Shipment } }) => React.ReactNode

    const result = cellFn({ row: { original: mockShipment } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Almacén #2")).toBeInTheDocument()
  })

  it("renders StatusBadge in status column", () => {
    const cols = shipmentColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "status")!
      .cell as (ctx: { row: { original: Shipment } }) => React.ReactNode

    const result = cellFn({ row: { original: mockShipment } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Pendiente")).toBeInTheDocument()
  })

  it('renders "—" for null shipping_date', () => {
    const noDateShipment = { ...mockShipment, shipping_date: null }
    const cols = shipmentColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "shipping_date")!
      .cell as (ctx: { row: { original: Shipment } }) => React.ReactNode

    const result = cellFn({ row: { original: noDateShipment } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("renders items count badge", () => {
    const cols = shipmentColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "items_count")!
      .cell as (ctx: { row: { original: Shipment } }) => React.ReactNode

    const result = cellFn({ row: { original: mockShipment } } as never)
    render(<>{result}</>)
    expect(screen.getByText("1")).toBeInTheDocument()
  })

  it("renders items count 0 when items is empty", () => {
    const emptyItemsShipment = { ...mockShipment, items: [] }
    const cols = shipmentColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "items_count")!
      .cell as (ctx: { row: { original: Shipment } }) => React.ReactNode

    const result = cellFn({ row: { original: emptyItemsShipment } } as never)
    render(<>{result}</>)
    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("renders Edit and Delete buttons for active shipment", () => {
    const cols = shipmentColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "actions")!
      .cell as (ctx: { row: { original: Shipment } }) => React.ReactNode

    const result = cellFn({ row: { original: mockShipment } } as never)
    render(<>{result}</>)

    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /eliminar/i })).toBeInTheDocument()
  })

  it("renders Activate button for inactive shipment", () => {
    const cols = shipmentColumns(defaultDeps)
    const cellFn = cols.find((c) => c.id === "actions")!
      .cell as (ctx: { row: { original: Shipment } }) => React.ReactNode

    const result = cellFn({ row: { original: mockInactiveShipment } } as never)
    render(<>{result}</>)

    expect(screen.queryByRole("button", { name: /eliminar/i })).not.toBeInTheDocument()
    expect(screen.getByText("Activar")).toBeInTheDocument()
  })
})
