import { describe, expect, it } from "vitest"
import {
  customerTypeLabel,
  customerTypeItems,
  docTypeItems,
} from "@/components/columns/customers"

describe("customerTypeLabel", () => {
  it('maps "company" to "Empresa"', () => {
    expect(customerTypeLabel("company")).toBe("Empresa")
  })

  it('maps "person" to "Persona"', () => {
    expect(customerTypeLabel("person")).toBe("Persona")
  })

  it('returns "Persona" for unknown types (default fallback)', () => {
    expect(customerTypeLabel("other")).toBe("Persona")
  })
})

describe("customerTypeItems", () => {
  it("contains company and person with correct labels", () => {
    expect(customerTypeItems.company).toBe("Empresa")
    expect(customerTypeItems.person).toBe("Persona")
  })

  it("has exactly 2 entries", () => {
    expect(Object.keys(customerTypeItems)).toHaveLength(2)
  })
})

describe("docTypeItems", () => {
  it("contains all four document types", () => {
    expect(docTypeItems).toEqual({
      ruc: "RUC",
      dni: "DNI",
      ce: "Carné de Extranjería",
      other: "Otro",
    })
  })

  it("has exactly 4 entries", () => {
    expect(Object.keys(docTypeItems)).toHaveLength(4)
  })
})
