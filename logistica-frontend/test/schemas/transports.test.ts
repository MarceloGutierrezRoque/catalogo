import { describe, expect, it } from "vitest"
import { vehicleTypeLabel, formatNumber, vehicleTypeItems } from "@/components/columns/transports"

describe("vehicleTypeLabel", () => {
  it('returns "Camión" for truck', () => {
    expect(vehicleTypeLabel("truck")).toBe("Camión")
  })

  it('returns "Furgoneta" for van', () => {
    expect(vehicleTypeLabel("van")).toBe("Furgoneta")
  })

  it('returns "Camioneta" for pickup', () => {
    expect(vehicleTypeLabel("pickup")).toBe("Camioneta")
  })

  it('returns "Otro" for other', () => {
    expect(vehicleTypeLabel("other")).toBe("Otro")
  })

  it("returns raw string for unknown type", () => {
    expect(vehicleTypeLabel("bus")).toBe("bus")
  })

  it("returns em dash for null", () => {
    expect(vehicleTypeLabel(null)).toBe("—")
  })
})

describe("formatNumber", () => {
  it("formats a valid number string", () => {
    const result = formatNumber("1500.00")
    expect(result).toEqual(expect.any(String))
    expect(result.length).toBeGreaterThan(0)
  })

  it("formats a number without decimals", () => {
    expect(formatNumber("10")).toBe("10")
  })

  it("returns em dash for null", () => {
    expect(formatNumber(null)).toBe("—")
  })

  it("returns em dash for non-numeric string", () => {
    expect(formatNumber("abc")).toBe("—")
  })
})

describe("vehicleTypeItems", () => {
  it("contains all expected vehicle types", () => {
    expect(vehicleTypeItems).toEqual({
      truck: "Camión",
      van: "Furgoneta",
      pickup: "Camioneta",
      other: "Otro",
    })
  })
})
