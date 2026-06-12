"use client"

import { motion } from "framer-motion"
import { MapPin, BarChart3, Route, Database, Smartphone } from "lucide-react"

const features = [
  {
    title: "Tracking en tiempo real",
    description: "Monitorea flotas y envíos con mapa interactivo. Geolocalización precisa y actualizaciones cada segundo.",
    icon: MapPin,
    color: "#2563EB",
    featured: true,
  },
  {
    title: "Dashboard de operaciones",
    description: "KPIs, alertas inteligentes y reportes automáticos para una visión completa de tu operación.",
    icon: BarChart3,
    color: "#3B82F6",
  },
  {
    title: "Rutas optimizadas con IA",
    description: "Algoritmos de inteligencia artificial que reducen costos de combustible hasta un 25%.",
    icon: Route,
    color: "#F97316",
  },
  {
    title: "Integración ERP/SAP",
    description: "Conecta con SAP, Oracle y sistemas de facturación electrónica sin fricción.",
    icon: Database,
    color: "#8B5CF6",
  },
  {
    title: "App móvil para conductores",
    description: "Firma digital, evidencia fotográfica y navegación integrada desde el celular.",
    icon: Smartphone,
    color: "#06B6D4",
  },
]

const iconBgMap: Record<string, string> = {
  "#2563EB": "bg-lp-primary/10",
  "#3B82F6": "bg-lp-secondary/10",
  "#F97316": "bg-lp-cta/10",
  "#8B5CF6": "bg-lp-accent-purple/10",
  "#06B6D4": "bg-lp-accent-cyan/10",
}

const iconTextMap: Record<string, string> = {
  "#2563EB": "text-lp-primary",
  "#3B82F6": "text-lp-secondary",
  "#F97316": "text-lp-cta",
  "#8B5CF6": "text-lp-accent-purple",
  "#06B6D4": "text-lp-accent-cyan",
}

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-block rounded-full border border-lp-primary/15 bg-lp-primary/5 px-3 py-1 text-xs font-medium text-lp-primary backdrop-blur-sm">
            Funcionalidades
          </span>
          <h2 className="font-heading mt-4 text-3xl font-bold text-white sm:text-4xl">
            Todo lo que necesitas para operar
          </h2>
          <p className="mt-4 text-base text-white/80">
            Una plataforma completa que cubre cada aspecto de tu cadena de suministro.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 transition-all hover:shadow-lg hover:shadow-lp-primary/5 will-animate ${
                  feature.featured ? "sm:col-span-2 lg:col-span-2" : ""
                }`}
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${iconBgMap[feature.color] ?? "bg-white/10"}`}>
                  <Icon className={`h-6 w-6 ${iconTextMap[feature.color] ?? "text-white"}`} />
                </div>
                <h3 className="font-heading text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
