"use client"

import { useRef } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Carlos Mendoza",
    role: "Gerente de Supply Chain",
    company: "Distribuidora del Sur",
    content: "Redujimos costos de combustible en un 28% durante el primer trimestre. Las rutas optimizadas con IA son un game changer.",
    rating: 5,
  },
  {
    name: "María Fernanda López",
    role: "Directora de Operaciones",
    company: "Logística Integral MX",
    content: "El dashboard nos dio visibilidad que antes no teníamos. Ahora tomamos decisiones en minutos, no en días.",
    rating: 5,
  },
  {
    name: "Andrés García",
    role: "CEO",
    company: "Transportes Rápidos CO",
    content: "La integración con SAP fue impecable. En dos semanas estábamos operando con datos en tiempo real en toda la compañía.",
    rating: 5,
  },
  {
    name: "Laura Castillo",
    role: "Jefa de Flota",
    company: "Fletes del Pacífico",
    content: "La app para conductores simplificó todo el proceso de entregas. Las firmas digitales eliminaron el papeleo.",
    rating: 4,
  },
  {
    name: "Ricardo Palma",
    role: "VP Logística",
    company: "Comercial Andina",
    content: "El soporte técnico es excepcional. Implementaron todo sin afectar nuestras operaciones en curso.",
    rating: 5,
  },
  {
    name: "Ana Sofía Ramírez",
    role: "Supply Chain Manager",
    company: "Grupo Logístico GT",
    content: "Pasamos de 15 sistemas aislados a una sola plataforma. La eficiencia operativa se disparó.",
    rating: 5,
  },
]

function TiltCard({
  children,
}: {
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 })
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 })

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    rotateX.set(-y * 5)
    rotateY.set(x * 5)
  }

  const handleLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ transformStyle: "preserve-3d", rotateX: springRotateX, rotateY: springRotateY }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-lg transition-shadow hover:shadow-xl"
    >
      {children}
    </motion.div>
  )
}

export function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-block rounded-full border border-lp-primary/15 bg-lp-primary/5 px-3 py-1 text-xs font-medium text-lp-primary backdrop-blur-sm">
            Testimonios
          </span>
          <h2 className="font-heading mt-4 text-3xl font-bold text-white sm:text-4xl">
            Lo que dicen nuestros clientes
          </h2>
          <p className="mt-4 text-base text-white/80">
            Empresas de toda LATAM confían en Logistica Web para su operación diaria.
          </p>
        </motion.div>

        <div className="mt-16 columns-1 gap-6 sm:columns-2 lg:columns-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="mb-6 break-inside-avoid will-animate"
            >
              <TiltCard>
                <div className="mb-3 flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`h-4 w-4 ${j < t.rating ? "text-lp-cta fill-lp-cta" : "text-white/20"}`}
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-white/70">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="mt-4 border-t border-lp-primary/5 pt-4">
                  <p className="font-heading text-sm font-semibold text-white">
                    {t.name}
                  </p>
                  <p className="text-xs text-white/70">
                    {t.role}, {t.company}
                  </p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
