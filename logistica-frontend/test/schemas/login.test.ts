import { describe, expect, it } from "vitest"
import { loginSchema } from "@/lib/schemas/login"

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      username: "admin",
      password: "secret123",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty username", () => {
    const result = loginSchema.safeParse({
      username: "",
      password: "secret123",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("username")
      expect(result.error.issues[0].message).toBe("El usuario es obligatorio")
    }
  })

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      username: "admin",
      password: "",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("password")
      expect(result.error.issues[0].message).toBe("La contraseña es obligatoria")
    }
  })

  it("rejects when both fields are empty", () => {
    const result = loginSchema.safeParse({
      username: "",
      password: "",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain("username")
      expect(paths).toContain("password")
    }
  })
})
