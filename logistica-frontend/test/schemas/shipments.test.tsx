import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { StatusBadge } from "@/components/columns/shipments"

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

  it("renders the raw string for unknown status", () => {
    render(<StatusBadge status="draft" />)
    expect(screen.getByText("draft")).toBeInTheDocument()
  })
})
