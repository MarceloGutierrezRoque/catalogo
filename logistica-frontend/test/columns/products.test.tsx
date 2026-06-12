import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  supplierName,
  warehouseName,
  formatPrice,
  StockBadge,
  productColumns,
  type ProductColumnDeps,
} from "@/components/columns/products"
import type { Product } from "@/types/api"

const mockProduct: Product = {
  id: 1,
  name: "Laptop Gamer X1",
  sku: "LAP-X1-001",
  description: "Laptop de alta gama",
  category: "Electrónica",
  brand: "TechBrand",
  unit_price: "4999.99",
  weight: "2.500",
  dimensions: "35x25x2",
  stock_quantity: 50,
  min_stock_level: 10,
  supplier: { id: 1, name: "TecnoSupply S.A." },
  warehouse: { id: 1, name: "Almacén Central" },
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const mockLowStockProduct: Product = {
  ...mockProduct,
  id: 2,
  name: "Teclado Mecánico",
  sku: "TEC-001",
  stock_quantity: 5,
  min_stock_level: 10,
}

const mockOutOfStockProduct: Product = {
  ...mockProduct,
  id: 3,
  name: "Mouse Óptico",
  sku: "MOU-001",
  stock_quantity: 0,
  min_stock_level: 5,
}

const mockNullRefsProduct: Product = {
  ...mockProduct,
  id: 4,
  supplier: null,
  warehouse: null,
  unit_price: null,
  is_active: false,
}

const defaultDeps: ProductColumnDeps = {
  can: () => true,
  openEditDialog: () => {},
  setDeleteTarget: () => {},
  handleActivate: () => {},
  activateMutation: { isPending: false },
}

// ── Helper function tests ──

describe("supplierName", () => {
  it("returns the supplier name from an expanded object", () => {
    expect(supplierName(mockProduct)).toBe("TecnoSupply S.A.")
  })

  it('returns "—" when supplier is null', () => {
    expect(supplierName(mockNullRefsProduct)).toBe("—")
  })

  it('returns "—" when supplier is a plain number (FK only)', () => {
    const p = { ...mockProduct, supplier: 5 }
    expect(supplierName(p)).toBe("—")
  })
})

describe("warehouseName", () => {
  it("returns the warehouse name from an expanded object", () => {
    expect(warehouseName(mockProduct)).toBe("Almacén Central")
  })

  it('returns "—" when warehouse is null', () => {
    expect(warehouseName(mockNullRefsProduct)).toBe("—")
  })

  it('returns "—" when warehouse is a plain number (FK only)', () => {
    const p = { ...mockProduct, warehouse: 5 }
    expect(warehouseName(p)).toBe("—")
  })
})

describe("formatPrice", () => {
  it("formats a valid price string to PEN currency", () => {
    const result = formatPrice("4999.99")
    expect(result).toContain("4")
    expect(result).not.toBe("—")
  })

  it('returns "—" for null', () => {
    expect(formatPrice(null)).toBe("—")
  })

  it('returns "—" for empty string', () => {
    expect(formatPrice("")).toBe("—")
  })

  it('returns "—" for non-numeric string', () => {
    expect(formatPrice("abc")).toBe("—")
  })
})

describe("StockBadge", () => {
  it('renders "Sin stock" when stock is 0', () => {
    render(<StockBadge product={mockOutOfStockProduct} />)
    expect(screen.getByText("Sin stock")).toBeInTheDocument()
  })

  it('renders "— Stock bajo" when stock is at or below min', () => {
    render(<StockBadge product={mockLowStockProduct} />)
    expect(screen.getByText(/Stock bajo/)).toBeInTheDocument()
    expect(screen.getByText(/5/)).toBeInTheDocument()
  })

  it('renders "N en stock" when stock is above min', () => {
    render(<StockBadge product={mockProduct} />)
    expect(screen.getByText(/50 en stock/)).toBeInTheDocument()
  })
})

// ── Column structure tests ──

describe("productColumns", () => {
  it("returns the correct number of columns", () => {
    const cols = productColumns(defaultDeps)
    expect(cols).toHaveLength(9)
  })

  it("includes expected column ids", () => {
    const cols = productColumns(defaultDeps)
    const keys = cols.map((c) => c.id ?? c.accessorKey)
    expect(keys).toEqual([
      "name",
      "sku",
      "category",
      "supplier_name",
      "warehouse_name",
      "stock",
      "unit_price",
      "is_active",
      "actions",
    ])
  })
})

// ── Cell render tests ──

describe("productColumns cell render", () => {
  it("renders category or fallback", () => {
    const cols = productColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "category")!
      .cell as (ctx: { row: { original: Product } }) => React.ReactNode

    const result = cellFn({ row: { original: mockNullRefsProduct } } as never)
    render(<>{result}</>)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("renders 'Inactivo' badge for is_active=false", () => {
    const cols = productColumns(defaultDeps)
    const cellFn = cols.find((c) => c.accessorKey === "is_active")!
      .cell as (ctx: { row: { original: Product } }) => React.ReactNode

    const result = cellFn({ row: { original: mockNullRefsProduct } } as never)
    render(<>{result}</>)
    expect(screen.getByText("Inactivo")).toBeInTheDocument()
  })
})
