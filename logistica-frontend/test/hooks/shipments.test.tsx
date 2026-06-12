import { describe, expect, it, beforeEach, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  useShipments,
  useShipment,
  useCreateShipment,
  useUpdateShipment,
  useDeleteShipment,
  useActivateShipment,
  useShipmentItems,
  useCreateShipmentItem,
  useDeleteShipmentItem,
} from "@/hooks/shipments"
import { createTestQueryClient } from "@/test/utils/renderWithQuery"
import type { Shipment, ShipmentItem } from "@/types/api"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const BASE = `${API_BASE_URL}/shipments`
const ITEMS_BASE = `${API_BASE_URL}/shipment-items`

const mockItem: ShipmentItem = {
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

beforeEach(() => {
  server.resetHandlers()
})

function wrapper(client?: QueryClient) {
  const qc = client ?? createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe("useShipments", () => {
  it("returns data on success", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ count: 1, results: [mockShipment] })
      )
    )
    const { result } = renderHook(() => useShipments(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockShipment])
  })
})

describe("useShipment", () => {
  it("fetches a single shipment by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockShipment)))
    const { result } = renderHook(() => useShipment(1), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockShipment)
  })

  it("is disabled when id is 0", async () => {
    const { result } = renderHook(() => useShipment(0), { wrapper: wrapper() })
    expect(result.current.isPending).toBe(true)
  })

  it("is disabled when id is undefined", async () => {
    const { result } = renderHook(() => useShipment(undefined as never), {
      wrapper: wrapper(),
    })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateShipment", () => {
  it("invalidates the shipments query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.post(`${BASE}/`, () =>
        HttpResponse.json(mockShipment, { status: 201 })
      )
    )

    const { result } = renderHook(() => useCreateShipment(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ tracking_number: "SHP-002" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["shipments"] })
  })
})

describe("useUpdateShipment", () => {
  it("invalidates list and single shipment queries", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(http.put(`${BASE}/1/`, () => HttpResponse.json(mockShipment)))

    const { result } = renderHook(() => useUpdateShipment(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ id: 1, data: { status: "in_transit" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith({ queryKey: ["shipments"] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ["shipments", 1] })
  })
})

describe("useDeleteShipment", () => {
  it("invalidates the shipments query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.delete(`${BASE}/1/`, () => HttpResponse.json(null, { status: 204 }))
    )

    const { result } = renderHook(() => useDeleteShipment(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["shipments"] })
  })
})

describe("useActivateShipment", () => {
  it("invalidates the shipments query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.patch(`${BASE}/1/`, () =>
        HttpResponse.json({ ...mockShipment, is_active: true })
      )
    )

    const { result } = renderHook(() => useActivateShipment(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["shipments"] })
  })
})

// ── ShipmentItem hooks ──

describe("useShipmentItems", () => {
  it("fetches items for a given shipment", async () => {
    server.use(
      http.get(`${ITEMS_BASE}/`, () =>
        HttpResponse.json([mockItem])
      )
    )

    const { result } = renderHook(() => useShipmentItems(1), {
      wrapper: wrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockItem])
  })

  it("is disabled when no id given", async () => {
    const { result } = renderHook(() => useShipmentItems(undefined), {
      wrapper: wrapper(),
    })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateShipmentItem", () => {
  it("invalidates shipments list and single shipment queries", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.post(`${ITEMS_BASE}/`, () =>
        HttpResponse.json(mockItem, { status: 201 })
      )
    )

    const { result } = renderHook(() => useCreateShipmentItem(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ shipment: 1, product: 1, quantity: 10 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith({ queryKey: ["shipments"] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ["shipments", 1] })
  })
})

describe("useDeleteShipmentItem", () => {
  it("invalidates the shipments query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.delete(`${ITEMS_BASE}/1/`, () =>
        HttpResponse.json(null, { status: 204 })
      )
    )

    const { result } = renderHook(() => useDeleteShipmentItem(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["shipments"] })
  })
})
