import { Navbar } from "@/components/public/navbar";
import { Hero } from "@/components/public/hero";
import { FeaturedPlushies } from "@/components/plushies/featured-plushies";
import { Testimonials } from "@/components/public/testimonials";
import { About } from "@/components/public/about";
import { Footer } from "@/components/public/footer";

export default function LandingPage() {
  return (
    <div className="h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-y-auto sm:snap-y sm:snap-mandatory pt-20">
        <Hero />
        <FeaturedPlushies />
        <Testimonials />
        <About />
        <Footer />
      </main>
    </div>
  );
}
