import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { PlushieGrid } from "@/components/plushies/plushie-grid";

export default function PlushiesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-28 pb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight mb-2">Catálogo de Peluches</h1>
        <p className="text-muted-foreground mb-8">
          Explora nuestra colección de peluches
        </p>
        <PlushieGrid />
      </main>
      <Footer />
    </div>
  );
}
