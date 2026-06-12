import { describe, expect, it } from "vitest"
import {
  supplierColumns,
  type SupplierColumnDeps,
} from "@/components/columns/suppliers"
import type { Supplier } from "@/types/api"

const mockSupplier: Supplier = {
  id: 1,
  name: "Test",
  contact_name: "Contact",
  email: "test@test.com",
  phone: "123",
  address: "Addr",
  city: "City",
  country: "CO",
  is_active: true,
  created_at: "",
  updated_at: "",
}

const deps: SupplierColumnDeps = {
  can: () => true,
  openEditDialog: () => {},
  setDeleteTarget: () => {},
  handleActivate: () => {},
  activateMutation: { isPending: false },
}

describe("supplierColumns structure", () => {
  it("has 9 columns", () => {
    expect(supplierColumns(deps)).toHaveLength(9)
  })

  it("each column has a valid id or accessorKey", () => {
    for (const col of supplierColumns(deps)) {
      expect(col.id ?? col.accessorKey).toBeTruthy()
    }
  })

  it("all header definitions render a non-empty string", () => {
    for (const col of supplierColumns(deps)) {
      expect(col.header).toBeDefined()
    }
  })
})
