import { describe, expect, it, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  activateRoute,
  createStop,
  deleteStop,
} from "@/services/routes"
import type { Route, Stop } from "@/types/api"

const BASE = `${API_BASE_URL}/routes`
const STOPS_BASE = `${API_BASE_URL}/stops`

const mockStop: Stop = {
  id: 1,
  route: 1,
  order: 1,
  warehouse: 1,
  arrival_time: "2026-01-01T10:00:00Z",
  departure_time: "2026-01-01T11:00:00Z",
  status: "completed",
}

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
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

beforeEach(() => {
  server.resetHandlers()
})

describe("getRoutes", () => {
  it("returns parsed results from PaginatedResponse", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [mockRoute],
        })
      )
    )
    const result = await getRoutes()
    expect(result).toEqual([mockRoute])
  })

  it("returns array directly", async () => {
    server.use(http.get(`${BASE}/`, () => HttpResponse.json([mockRoute])))
    const result = await getRoutes()
    expect(result).toEqual([mockRoute])
  })

  it("returns empty array when results is missing", async () => {
    server.use(http.get(`${BASE}/`, () => HttpResponse.json({ count: 0 })))
    const result = await getRoutes()
    expect(result).toEqual([])
  })

  it("propagates 4xx errors", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ detail: "Forbidden" }, { status: 403 })
      )
    )
    await expect(getRoutes()).rejects.toThrow()
  })
})

describe("getRoute", () => {
  it("fetches a single route by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockRoute)))
    const result = await getRoute(1)
    expect(result).toEqual(mockRoute)
  })
})

describe("createRoute", () => {
  it("POSTs and returns the created route", async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${BASE}/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockRoute, id: 2 }, { status: 201 })
      })
    )
    const result = await createRoute({ name: "New Route" })
    expect(capturedBody).toMatchObject({ name: "New Route" })
    expect(result.id).toBe(2)
  })
})

describe("updateRoute", () => {
  it("PUTs and returns the updated route", async () => {
    let capturedBody: unknown
    server.use(
      http.put(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockRoute, name: "Updated" })
      })
    )
    const result = await updateRoute(1, { name: "Updated" })
    expect(capturedBody).toMatchObject({ name: "Updated" })
    expect(result.name).toBe("Updated")
  })
})

describe("deleteRoute", () => {
  it("DELETEs the route", async () => {
    let called = false
    server.use(
      http.delete(`${BASE}/1/`, () => {
        called = true
        return HttpResponse.json(null, { status: 204 })
      })
    )
    const result = await deleteRoute(1)
    expect(called).toBe(true)
    expect(result).toBe("")
  })
})

describe("activateRoute", () => {
  it("PATCHes with is_active=true", async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockRoute, is_active: true })
      })
    )
    const result = await activateRoute(1)
    expect(capturedBody).toEqual({ is_active: true })
    expect(result.is_active).toBe(true)
  })
})

describe("createStop", () => {
  it("POSTs to /stops/ and returns the created stop", async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${STOPS_BASE}/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockStop, { status: 201 })
      })
    )
    const result = await createStop({ route: 1, order: 1, warehouse: 1 })
    expect(capturedBody).toMatchObject({ route: 1, order: 1, warehouse: 1 })
    expect(result.id).toBe(1)
  })
})

describe("deleteStop", () => {
  it("DELETEs the stop", async () => {
    let called = false
    server.use(
      http.delete(`${STOPS_BASE}/1/`, () => {
        called = true
        return HttpResponse.json(null, { status: 204 })
      })
    )
    const result = await deleteStop(1)
    expect(called).toBe(true)
    expect(result).toBe("")
  })
})
