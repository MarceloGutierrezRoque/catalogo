import type { JwtPayload } from "@/types/api";

/**
 * Decodes a JWT payload (without verifying signature).
 * Useful to extract user_id, exp, etc.
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/**
 * Checks if a JWT token is expired.
 * Returns true if exp < Date.now() / 1000.
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now();
}

/**
 * Extracts basic user info from the access token.
 */
export function getUserFromToken(token: string): {
  id: number;
  username: string;
  email: string;
} | null {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  return {
    id: decoded.user_id,
    username: decoded.username ?? "",
    email: decoded.email ?? "",
  };
}
