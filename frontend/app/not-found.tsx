"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// NotFoundContent component that uses useSearchParams
function NotFoundContent() {
  // Usamos useSearchParams() en un componente separado para envolverlo en Suspense
  const searchParams = useSearchParams();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl mb-6 text-center">Página no encontrada</p>
      <p className="text-muted-foreground text-center mb-8">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>
      <Button asChild>
        <Link href="/">
          Volver al inicio
        </Link>
      </Button>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl mb-6">Página no encontrada</p>
      </div>
    }>
      <NotFoundContent />
    </Suspense>
  );
}