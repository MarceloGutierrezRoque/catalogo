"use client";

import { useRouter } from "next/navigation";
import { Footer } from "@/components/public/footer";
import { OrderForm } from "@/components/orders/order-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import { useCartStore } from "@/stores/cart";

export default function OrderPage() {
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clear);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar with back + cancel */}
      <div className="border-b border-border/60">
        <div className="container mx-auto flex items-center justify-between px-4 h-14">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { clearCart(); router.push("/plushies"); }}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        </div>
      </div>
      <main className="flex-1 container mx-auto px-4 py-8">
        <OrderForm />
      </main>
      <Footer />
    </div>
  );
}
