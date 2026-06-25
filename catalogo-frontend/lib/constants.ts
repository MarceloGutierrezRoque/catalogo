export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "/placeholder-plushie.svg";
  const cleanPath = path.replace(/_[A-Za-z0-9]{7}(?=\.[\w]+$)/g, "");
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) return cleanPath;
  if (cleanPath.startsWith("/")) return `${API_BASE_URL}${cleanPath}`;
  return cleanPath;
}
