import { Heart, Shield, Truck, Sparkles } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Hecho con amor",
    description: "Cada peluche es seleccionado cuidadosamente para brindar la mejor experiencia de abrazo y compañía.",
  },
  {
    icon: Shield,
    title: "Calidad garantizada",
    description: "Trabajamos solo con proveedores certificados que utilizan materiales hipoalergénicos y seguros para todas las edades.",
  },
  {
    icon: Truck,
    title: "Envío seguro",
    description: "Empacamos cada pedido con protección especial para que tu peluche llegue en perfectas condiciones.",
  },
  {
    icon: Sparkles,
    title: "Atención personalizada",
    description: "Nuestro equipo está siempre disponible para ayudarte a encontrar el peluche perfecto para cada ocasión.",
  },
];

export function About() {
  return (
    <section id="nosotros" className="relative overflow-hidden min-h-dvh flex items-center sm:snap-start py-20">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.02] via-transparent to-primary/[0.02]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="relative container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Sobre Catálogo de Peluches
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Somos una empresa dedicada a la venta de peluches de alta calidad. 
            Creemos en el poder de un abrazo y trabajamos cada día para llevar 
            alegría y confort a hogares de todo el país.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <div
                key={i}
                className="rounded-xl border border-border/20 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur-sm p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-base">{v.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{v.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
