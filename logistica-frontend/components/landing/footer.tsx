"use client"

import Link from "next/link"
import { Globe, MessageCircle, Video, Code2, Mail } from "lucide-react"

const footerLinks = {
  Producto: [
    { label: "Tracking", href: "#features" },
    { label: "Dashboard", href: "#features" },
    { label: "Rutas IA", href: "#features" },
    { label: "App móvil", href: "#features" },
  ],
  Compañía: [
    { label: "Sobre nosotros", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Prensa", href: "#" },
    { label: "Empleo", href: "#" },
  ],
  Recursos: [
    { label: "Documentación", href: "#" },
    { label: "API", href: "#" },
    { label: "Estado del sistema", href: "#" },
    { label: "Contacto", href: "#" },
  ],
  Legal: [
    { label: "Privacidad", href: "#" },
    { label: "Términos", href: "#" },
    { label: "Cookies", href: "#" },
    { label: "ISO 27001", href: "#" },
  ],
}

const socialIcons = [
  { icon: Globe, href: "#", label: "LinkedIn" },
  { icon: MessageCircle, href: "#", label: "Twitter" },
  { icon: Video, href: "#", label: "YouTube" },
  { icon: Code2, href: "#", label: "GitHub" },
  { icon: Mail, href: "#", label: "Email" },
]

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-white/[0.02] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lp-primary text-xs font-bold text-white">
                LW
              </div>
              <span className="font-heading text-lg font-semibold text-white">
                Logistica Web
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
              Mueve más, gestiona menos. Logística inteligente para empresas que no se detienen.
            </p>
            <div className="mt-6 flex gap-3">
              {socialIcons.map((s) => {
                const Icon = s.icon
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition-all hover:bg-white/10 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.15)] cursor-pointer"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-heading text-xs font-semibold uppercase tracking-widest text-white/60">
                {title}
              </h4>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/70 transition-colors hover:text-lp-primary cursor-pointer"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/5 pt-6 text-center text-xs text-white/50">
          &copy; {new Date().getFullYear()} Logistica Web. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
