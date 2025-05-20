"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

// NotFoundContent component that uses useSearchParams
function NotFoundContent() {
  // Esta función usará useSearchParams(), necesita estar en un componente separado
  // que luego será envuelto en Suspense
  const searchParams = useSearchParams();
  const t = useTranslations('common');
  
  // Podemos usar searchParams para personalizar mensajes o comportamientos si es necesario
  const from = searchParams?.get('from') || '';
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl mb-6 text-center">{t('notFound.title', { defaultValue: 'Página no encontrada' })}</p>
      <p className="text-muted-foreground text-center mb-8">
        {t('notFound.description', { defaultValue: 'Lo sentimos, la página que estás buscando no existe o ha sido movida.' })}
      </p>
      <Button asChild>
        <Link href="/">
          {t('notFound.backHome', { defaultValue: 'Volver al inicio' })}
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