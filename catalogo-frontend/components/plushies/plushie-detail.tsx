"use client";

import Link from "next/link";
import { usePlushie } from "@/hooks/use-plushies";
import { DetailSkeleton } from "@/components/plushies/detail-skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle, RefreshCw, ShoppingCart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart";
import { getImageUrl } from "@/lib/constants";

interface PlushieDetailProps {
  id: number;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "51999888777";

export function PlushieDetail({ id }: PlushieDetailProps) {
  const { data: plushie, isLoading, isError, refetch, isFetching } = usePlushie(id);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = () => {
    if (!plushie) return;
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

  const handleWhatsApp = () => {
    if (!plushie) return;
    const message = encodeURIComponent(
      `Hola, quiero comprar el peluche ${plushie.name} (S/ ${plushie.price}). ¿Está disponible?`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  if (isLoading) return <DetailSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Peluche no encontrado</h2>
        <p className="text-muted-foreground mb-6">
          El peluche que buscas no existe o ha sido removido.
        </p>
        <div className="flex gap-4">
          <Link href="/plushies">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al catálogo
            </Button>
          </Link>
          <Button onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!plushie) return null;

  const imageUrl = getImageUrl(plushie.image);
  const isOutOfStock = plushie.stock === 0;

  return (
    <div>
      <Link href="/plushies">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al catálogo
        </Button>
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="aspect-square relative overflow-hidden rounded-xl bg-gradient-to-br from-muted to-muted/50 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={plushie.name}
            className="object-cover w-full h-full"
          />
        </div>

        <div className="flex flex-col justify-center space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">{plushie.name}</h1>
            {isOutOfStock && (
              <Badge variant="secondary" className="mt-2 text-base px-3 py-1">
                Agotado
              </Badge>
            )}
          </div>

          {plushie.description && (
            <p className="text-muted-foreground text-lg leading-relaxed">
              {plushie.description}
            </p>
          )}

          <div className="text-4xl font-bold text-primary">
            S/ {plushie.price}
          </div>

          {!isOutOfStock && (
            <div className="text-sm text-muted-foreground">
              Stock disponible: <span className="font-semibold">{plushie.stock} unidades</span>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-4 pt-2">
            {!isOutOfStock && (
              <Button size="lg" onClick={handleAddToCart} className="group/add-cart shadow-md hover:shadow-lg transition-all duration-300">
                <ShoppingCart className="mr-2 h-5 w-5 transition-transform duration-300 group-hover/add-cart:scale-110" />
                Agregar al carrito
              </Button>
            )}
            <Button variant="outline" size="lg" onClick={handleWhatsApp} className="group/whatsapp transition-all duration-300 hover:shadow-md">
              <MessageCircle className="mr-2 h-5 w-5 text-green-600 transition-transform duration-300 group-hover/whatsapp:scale-110" />
              Consultar por WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
