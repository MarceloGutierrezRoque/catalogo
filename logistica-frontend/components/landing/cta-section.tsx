"use client"

import { motion } from "framer-motion"
import { ArrowRight, Mail } from "lucide-react"

export function CtaSection() {
  return (
    <section id="cta" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl"
        >
          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full opacity-15 blur-md"
            style={{
              background: "conic-gradient(from 0deg, #2563EB, #3B82F6, #F97316, #2563EB)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 sm:p-12 lg:p-16 flex flex-col items-center text-center">
            <span className="inline-block rounded-full border border-lp-cta/15 bg-lp-cta/5 px-3 py-1 text-xs font-medium text-lp-cta backdrop-blur-sm">
              Comienza hoy
            </span>
            <h2 className="font-heading mt-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              ¿Listo para transformar tu logística?
            </h2>
            <p className="mt-4 max-w-lg text-base text-white/80">
              Solicita una demo gratuita y descubre cómo Logistica Web puede optimizar tu cadena de suministro.
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <input
                  type="email"
                  placeholder="tu@empresa.com"
                  required
                  className="w-full rounded-xl border border-white/15 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-white/60 backdrop-blur-sm outline-none transition-all focus:border-lp-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] cursor-pointer"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-lp-cta px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-lp-cta/25 transition-all hover:bg-lp-cta/90 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
              >
                Solicitar demo
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-4 text-xs text-white/60">
              Sin compromiso. Implementación en 2 semanas.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
