import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "Trabajar con Peluchel ha sido una experiencia increíble. Su atención al detalle y calidad superan nuestras expectativas. Entregas puntuales y comunicación impecable.",
    author: "María García",
    role: "Proveedora de Telas",
    company: "Textiles del Sur",
    rating: 5,
  },
  {
    quote: "Llevamos más de 3 años colaborando y nunca hemos tenido un problema. Son serios, responsables y siempre buscan lo mejor para sus clientes. Un aliado estratégico de confianza.",
    author: "Carlos Mendoza",
    role: "Distribuidor Mayorista",
    company: "Distribuciones Mendoza",
    rating: 5,
  },
  {
    quote: "La calidad de los materiales que seleccionan es de primer nivel. Es un orgullo ser parte de su cadena de producción. Recomiendo trabajar con ellos sin reservas.",
    author: "Ana Lucía Torres",
    role: "Diseñadora Textil",
    company: "Studio Textil Peruano",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section id="testimonios" className="relative overflow-hidden min-h-dvh flex items-center sm:snap-start py-20">
      <div className="absolute inset-0 bg-gradient-to-t from-accent/[0.03] via-transparent to-primary/[0.02]" />
      <div className="absolute top-1/3 left-0 -translate-x-1/3 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-1/3 right-0 translate-x-1/3 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
      <div className="relative container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Lo que dicen nuestros proveedores
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            La confianza de nuestros aliados es nuestro mejor respaldo
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="relative rounded-xl border border-border/20 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur-sm p-6 flex flex-col"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <blockquote className="text-sm text-muted-foreground leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-5 pt-4 border-t border-border/10">
                <p className="font-medium text-sm">{t.author}</p>
                <p className="text-xs text-muted-foreground/70">{t.role} &middot; {t.company}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
