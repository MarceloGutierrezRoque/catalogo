"use client";

import { useParams } from "next/navigation";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { PlushieDetail } from "@/components/plushies/plushie-detail";

export default function PlushieDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-28 pb-8">
        <PlushieDetail id={Number(id)} />
      </main>
      <Footer />
    </div>
  );
}
