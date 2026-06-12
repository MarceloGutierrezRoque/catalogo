"use client"

import { motion } from "framer-motion"
import { Search, Settings, BarChart, GitPullRequest } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Conecta tu operación",
    description: "Integra tu ERP, SAP o sistema actual en minutos. Nuestro equipo técnico te guía paso a paso sin interrumpir tus operaciones.",
    icon: Search,
    color: "#2563EB",
  },
  {
    number: "02",
    title: "Configura tus rutas",
    description: "Define flotas, conductores y zonas de cobertura. La IA analiza variables como tráfico, clima y horarios para proponer rutas óptimas.",
    icon: Settings,
    color: "#3B82F6",
  },
  {
    number: "03",
    title: "Monitorea en vivo",
    description: "Sigue cada envío en tiempo real desde el dashboard. Alertas proactivas te notifican desviaciones, retrasos o incidentes al instante.",
    icon: BarChart,
    color: "#F97316",
  },
  {
    number: "04",
    title: "Optimiza continuamente",
    description: "Reportes automáticos con insights de rendimiento, costos y eficiencia. Toma decisiones basadas en datos para mejorar cada mes.",
    icon: GitPullRequest,
    color: "#8B5CF6",
  },
]

const numColorMap: Record<string, string> = {
  "#2563EB": "text-lp-primary/40",
  "#3B82F6": "text-lp-secondary/40",
  "#F97316": "text-lp-cta/40",
  "#8B5CF6": "text-lp-accent-purple/40",
}

const iconBgMap: Record<string, string> = {
  "#2563EB": "bg-lp-primary/20",
  "#3B82F6": "bg-lp-secondary/20",
  "#F97316": "bg-lp-cta/20",
  "#8B5CF6": "bg-lp-accent-purple/20",
}

const iconTextMap: Record<string, string> = {
  "#2563EB": "text-lp-primary",
  "#3B82F6": "text-lp-secondary",
  "#F97316": "text-lp-cta",
  "#8B5CF6": "text-lp-accent-purple",
}

const panelBorderMap: Record<string, string> = {
  "#2563EB": "border-lp-primary/30",
  "#3B82F6": "border-lp-secondary/30",
  "#F97316": "border-lp-cta/30",
  "#8B5CF6": "border-lp-accent-purple/30",
}

const panelIconMap: Record<string, string> = {
  "#2563EB": "text-lp-primary/60",
  "#3B82F6": "text-lp-secondary/60",
  "#F97316": "text-lp-cta/60",
  "#8B5CF6": "text-lp-accent-purple/60",
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      <div className="noise-bg pointer-events-none absolute inset-0 opacity-50" />
      <div className="mesh-gradient pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-block rounded-full border border-lp-primary/15 bg-lp-primary/5 px-3 py-1 text-xs font-medium text-lp-primary backdrop-blur-sm">
            Proceso
          </span>
          <h2 className="font-heading mt-4 text-3xl font-bold text-white sm:text-4xl">
            Cómo funciona
          </h2>
          <p className="mt-4 text-base text-white/80">
            Cuatro pasos simples para transformar tu logística.
          </p>
        </motion.div>

        <div className="mt-16 space-y-12 lg:space-y-16">
          {steps.map((step, i) => {
            const Icon = step.icon
            const isLeft = i % 2 === 0

            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`flex flex-col gap-6 ${
                  isLeft ? "lg:flex-row" : "lg:flex-row-reverse"
                } items-center will-animate`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <span className={`font-heading text-5xl font-bold ${numColorMap[step.color] ?? "text-white/40"}`}>
                      {step.number}
                    </span>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBgMap[step.color] ?? "bg-white/10"}`}>
                      <Icon className={`h-5 w-5 ${iconTextMap[step.color] ?? "text-white"}`} />
                    </div>
                  </div>
                  <h3 className="font-heading mt-4 text-xl font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">
                    {step.description}
                  </p>
                </div>

                <div className="hidden flex-1 lg:block">
                  <div className={`mx-auto h-48 w-full max-w-sm rounded-2xl border bg-white/5 backdrop-blur-xl p-6 shadow-lg ${panelBorderMap[step.color] ?? "border-white/10"}`}>
                    <div className="flex h-full items-center justify-center">
                      <Icon className={`h-12 w-12 ${panelIconMap[step.color] ?? "text-white/40"}`} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
