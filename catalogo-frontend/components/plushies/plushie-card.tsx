"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart";
import type { Plushie } from "@/types/api";
import { getImageUrl } from "@/lib/constants";

interface PlushieCardProps {
  plushie: Plushie;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "51999888777";

export function PlushieCard({ plushie }: PlushieCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const imageUrl = getImageUrl(plushie.image);
  const isOutOfStock = plushie.stock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      plushie_id: plushie.id,
      name: plushie.name,
      price: plushie.price,
      stock: plushie.stock,
    });
    toast.success("Agregado al carrito", {
      description: `${plushie.name} — S/ ${plushie.price}`,
    });
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const message = encodeURIComponent(
      `Hola, me interesa el peluche ${plushie.name} (S/ ${plushie.price}). ¿Está disponible?`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1.5 h-full flex flex-col border-border/60 pt-0">
      <Link href={`/plushies/${plushie.id}`} className="block">
        <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={plushie.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Badge variant="secondary" className="text-lg px-4 py-1">Agotado</Badge>
            </div>
          )}
        </div>
        <CardContent className="pt-3">
          <h3 className="font-heading font-semibold text-base truncate group-hover:text-primary transition-colors">
            {plushie.name}
          </h3>
        </CardContent>
      </Link>
      <CardFooter className="mt-auto flex items-center justify-between gap-3">
        <span className="text-lg font-bold text-primary">S/ {plushie.price}</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleWhatsApp}
            title="Consultar por WhatsApp"
            className="hover:border-green-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950 hover:scale-110 transition-all duration-200"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
          {!isOutOfStock && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddToCart}
              title="Agregar al carrito"
              className="hover:border-primary hover:text-primary hover:bg-primary/5 hover:scale-110 transition-all duration-200"
            >
              <ShoppingCart className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
