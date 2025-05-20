"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCw } from "lucide-react";

// ErrorContent component wrapped in Suspense
function ErrorContent({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');
  const router = useRouter();
  
  useEffect(() => {
    // Opcionalmente podrías enviar el error a un sistema de reportes
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="rounded-full bg-red-100 p-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <h2 className="text-xl font-semibold mb-4 text-center">
        {t('error.title', { defaultValue: 'Algo salió mal' })}
      </h2>
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        {t('error.description', { 
          defaultValue: 'Ha ocurrido un error al procesar tu solicitud. Por favor, intenta nuevamente.' 
        })}
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={reset} variant="outline" className="flex items-center">
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('error.retry', { defaultValue: 'Intentar nuevamente' })}
        </Button>
        <Button 
          onClick={() => {
            const pathParts = window.location.pathname.split('/');
            const locale = pathParts[1]; // Get locale from URL
            router.push(`/${locale}/`);
          }}
        >
          {t('error.backHome', { defaultValue: 'Volver al inicio' })}
        </Button>
      </div>
    </div>
  );
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="h-16 w-16 border-4 border-t-primary border-r-transparent border-b-primary border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    }>
      <ErrorContent error={error} reset={reset} />
    </Suspense>
  );
}