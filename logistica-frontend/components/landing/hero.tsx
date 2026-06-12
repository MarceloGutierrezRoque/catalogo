"use client"

import { useRef } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

const headline = "Mueve más, gestiona menos."

const staggerWords = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03, delayChildren: 0.3 },
  },
}

const wordVariant = {
  hidden: { y: 60, opacity: 0, filter: "blur(8px)" },
  visible: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
}

const badgeColors: Record<string, string> = {
  "#2563EB": "bg-lp-primary",
  "#F97316": "bg-lp-cta",
  "#3B82F6": "bg-lp-secondary",
}

const floatingBadges = [
  { label: "+30% eficiencia", color: "#2563EB", x: "10%", y: "20%" },
  { label: "Tracking实时", color: "#F97316", x: "80%", y: "15%" },
  { label: "IA integrada", color: "#3B82F6", x: "85%", y: "60%" },
]

export function Hero() {
  const magneticRef = useRef<HTMLButtonElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const springX = useSpring(mx, { stiffness: 300, damping: 20 })
  const springY = useSpring(my, { stiffness: 300, damping: 20 })

  const handleMouse = (e: React.MouseEvent) => {
    const rect = magneticRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    mx.set(x * 0.2)
    my.set(y * 0.2)
  }

  const handleLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <section className="relative flex min-h-dvh items-center overflow-hidden pt-16">
      <div className="noise-bg pointer-events-none absolute inset-0" />
      <div className="mesh-gradient pointer-events-none absolute inset-0" />
      <div className="grid-lines pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-lp-primary/15 bg-lp-primary/5 px-3 py-1 text-xs font-medium text-lp-primary backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-lp-cta animate-pulse" />
              Plataforma #1 en logística LATAM
            </motion.div>

            <motion.h1
              variants={staggerWords}
              initial="hidden"
              animate="visible"
              className="font-heading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              {headline.split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  variants={wordVariant}
                  className="inline-block mr-[0.25em] will-animate"
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-6 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg"
            >
              Optimiza tu cadena de suministro con tracking en tiempo real, rutas inteligentes y dashboards operativos. La plataforma que grandes empresas de LATAM ya usan para mover su negocio.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <button
                ref={magneticRef}
                onMouseMove={handleMouse}
                onMouseLeave={handleLeave}
                className="cursor-pointer"
              >
                <motion.div
                  style={{ x: springX, y: springY }}
                  className="inline-flex items-center gap-2 rounded-xl bg-lp-cta px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-lp-cta/25 transition-all hover:bg-lp-cta/90 active:scale-[0.98]"
                >
                  Solicitar demo gratuita
                  <ArrowRight className="h-4 w-4" />
                </motion.div>
              </button>
              <Button
                variant="outline"
                className="cursor-pointer rounded-xl border-2 border-white/20 px-6 h-auto py-3 text-sm font-semibold text-white hover:bg-white/5"
              >
                <Play className="mr-2 h-4 w-4" />
                Ver video
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="mt-10 flex items-center gap-4"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-lp-primary to-lp-secondary flex items-center justify-center text-[10px] font-bold text-white"
                  >
                    U{i}
                  </div>
                ))}
              </div>
              <div className="text-sm text-white/70">
                <span className="font-semibold text-white">+200</span> empresas confían en nosotros
              </div>
            </motion.div>
          </div>

          {/* Right - glass visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative hidden lg:block will-animate"
          >
            <div className="relative mx-auto h-[500px] w-full max-w-[500px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-lp-primary/5 via-transparent to-lp-cta/5" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-lp-primary/10 backdrop-blur-sm">
                    <svg className="h-10 w-10 text-lp-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                  </div>
                  <p className="font-heading text-lg font-semibold text-white">Dashboard en vivo</p>
                  <p className="mt-1 text-sm text-white/70">KPIs, alertas y reportes</p>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_80px_rgba(37,99,235,0.1)]" />
            </div>

            {/* Floating badges with CSS animation */}
            {floatingBadges.map((badge, i) => (
              <div
                key={i}
                className="absolute flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl px-3 py-2 shadow-lg animate-float"
                style={{ left: badge.x, top: badge.y, animationDelay: `${i * 0.5}s` }}
              >
                <div className={`h-2 w-2 rounded-full ${badgeColors[badge.color] ?? "bg-white"}`} />
                <span className="text-xs font-medium text-white">{badge.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
