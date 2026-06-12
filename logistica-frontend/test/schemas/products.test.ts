import { describe, expect, it } from "vitest"
import { supplierName, warehouseName, formatPrice } from "@/components/columns/products"
import type { Product } from "@/types/api"

const base: Product = {
  id: 1,
  name: "Test",
  sku: "TST-001",
  description: null,
  category: null,
  brand: null,
  unit_price: null,
  weight: null,
  dimensions: null,
  stock_quantity: 0,
  min_stock_level: 0,
  supplier: null,
  warehouse: null,
  is_active: true,
  created_at: "",
  updated_at: "",
}

describe("supplierName", () => {
  it("returns name from expanded object", () => {
    expect(supplierName({ ...base, supplier: { id: 1, name: "Prov" } })).toBe("Prov")
  })

  it('returns "—" for null supplier', () => {
    expect(supplierName(base)).toBe("—")
  })

  it('returns "—" for numeric FK (not expanded)', () => {
    expect(supplierName({ ...base, supplier: 5 })).toBe("—")
  })
})

describe("warehouseName", () => {
  it("returns name from expanded object", () => {
    expect(warehouseName({ ...base, warehouse: { id: 1, name: "WH" } })).toBe("WH")
  })

  it('returns "—" for null warehouse', () => {
    expect(warehouseName(base)).toBe("—")
  })

  it('returns "—" for numeric FK (not expanded)', () => {
    expect(warehouseName({ ...base, warehouse: 3 })).toBe("—")
  })
})

describe("formatPrice", () => {
  it('returns "—" for null', () => {
    expect(formatPrice(null)).toBe("—")
  })

  it('returns "—" for empty string', () => {
    expect(formatPrice("")).toBe("—")
  })

  it('returns "—" for NaN', () => {
    expect(formatPrice("not-a-number")).toBe("—")
  })

  it("formats a valid price string", () => {
    const result = formatPrice("100.50")
    expect(result).toContain("100")
    expect(result).not.toBe("—")
  })
})
