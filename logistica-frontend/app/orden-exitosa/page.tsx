"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">¡Compra exitosa!</CardTitle>
          <CardDescription className="text-base">
            Gracias por tu compra. Recibirás un email con los detalles de tu
            pedido.
          </CardDescription>
        </CardHeader>
        {sessionId && (
          <CardContent>
            <p className="text-xs text-muted-foreground break-all">
              ID de transacción: <span className="font-mono">{sessionId}</span>
            </p>
          </CardContent>
        )}
        <CardFooter className="justify-center">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Volver al inicio
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60dvh] items-center justify-center">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
