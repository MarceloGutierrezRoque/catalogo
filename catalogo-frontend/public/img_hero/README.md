# Hero Animation — Image Layers

3 capas SVG animadas que aparecen secuencialmente de abajo arriba en el Hero (`components/public/hero.tsx`).

## Capas

| Orden | Archivo | Delay | Descripción |
|---|---|---|---|
| 1 | `cesped.png` | 0s | Césped, fondo inferior |
| 2 | `peluche-placeholder.svg` | 0.5s | Peluche central flotante |
| 3 | `nubes-placeholder.svg` | 1s | Nubes en la parte superior |
| Texto | — | 1.8s | Título, subtítulo y CTA |

## Animaciones (`app/globals.css`)

- `rise-up`: translateY(60px) → 0 + opacity 0→1 (0.9s, cubic-bezier)
- `rise-up-slow`: igual pero 1.1s (para nubes)
- `fade-in`: translateY(20px) → 0 + opacity 0→1 (0.7s, ease-out)

Cada capa usa `pointer-events-none` para no interferir con clics.

## Reemplazar placeholders

Mantener nombre de archivo, solo cambiar el SVG interno:

| Placeholder | Reemplazar con |
|---|---|
| `peluche-placeholder.svg` | Imagen real del peluche (PNG/SVG) |
| `nubes-placeholder.svg` | Nubes realistas o decorativas |

`cesped.png` es el archivo definitivo.
