"use client"

import { motion } from "framer-motion"

const logos = [
  "MercadoLog",
  "ShipPro",
  "CargoX",
  "Logisys",
  "TransFast",
  "DistriNet",
]

export function LogoBar() {
  const doubled = [...logos, ...logos]

  return (
    <section className="relative border-y border-white/[0.06] bg-white/[0.02] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-white/60">
          Empresas que confían en nosotros
        </p>
        <div className="relative overflow-hidden mask-fade-x">
          <motion.div
            className="flex gap-16"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {doubled.map((name, i) => (
              <span
                key={i}
                className="font-heading shrink-0 text-lg font-semibold text-white/50 select-none"
              >
                {name}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      <style>{`
        .mask-fade-x::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(to right, rgb(11 17 32), transparent 15%, transparent 85%, rgb(11 17 32));
        }
      `}</style>
    </section>
  )
}
