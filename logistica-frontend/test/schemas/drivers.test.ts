import { describe, expect, it, vi } from "vitest"
import { formatDate } from "@/components/columns/drivers"

describe("formatDate (driver helper)", () => {
  it("formats a valid date string", () => {
    const result = formatDate("2025-01-15")
    expect(result).not.toBe("—")
    expect(result).toContain("2025")
  })

  it("formats another valid date", () => {
    const result = formatDate("2024-12-01")
    expect(result).not.toBe("—")
    expect(result).toContain("2024")
  })

  it('returns "—" for null', () => {
    expect(formatDate(null)).toBe("—")
  })

  it('returns "—" for empty string', () => {
    expect(formatDate("")).toBe("—")
  })

  it("returns 'Invalid Date' for unparseable input (current impl)", () => {
    expect(formatDate("invalid")).toBe("Invalid Date")
  })
})
