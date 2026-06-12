import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { RouteStatusBadge } from "@/components/columns/routes"

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

  it("renders the raw string for unknown status", () => {
    render(<RouteStatusBadge status="draft" />)
    expect(screen.getByText("draft")).toBeInTheDocument()
  })
})
