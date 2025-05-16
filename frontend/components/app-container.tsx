"use client";

import { Progress } from "@/components/ui/progress";
import { WorkflowTabs } from "@/components/navigation/tab-nav";
import { useUploadStore } from "@/store/use-upload-store";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { LanguageSwitcher } from "@/components/settings/language-switcher";
import { ThemeSwitcher } from "@/components/settings/theme-switcher";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";
import { useApiKey } from "@/lib/hooks/useApiKey";

export default function AppContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentStep, setCurrentStep } = useUploadStore();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("app");
  const { isAvailable } = useApiKey();

  // Actualizar el paso actual basado en la URL
  useEffect(() => {
    if (pathname.includes('/upload')) {
      setCurrentStep('upload');
    } else if (pathname.includes('/summary')) {
      setCurrentStep('summary');
    } else if (pathname.includes('/flashcards')) {
      setCurrentStep('flashcards');
    }
  }, [pathname, setCurrentStep]);

  // Redireccionar a /api si no hay API key
  useEffect(() => {
    // No redireccionar si ya estamos en /api o si es la página raíz
    if (!isAvailable && !pathname.includes('/api') && 
        pathname.split('/').length > 2 && pathname !== `/${pathname.split('/')[1]}`) {
      const locale = pathname.split('/')[1];
      router.push(`/${locale}/api`);
    }
  }, [isAvailable, pathname, router]);

  // Calcular progreso basado en el paso actual
  const getProgress = () => {
    switch (currentStep) {
      case 'upload': return 33;
      case 'summary': return 66;
      case 'flashcards': return 100;
      default: return 33;
    }
  };

  // Ir a la página de API
  const goToApiPage = () => {
    const locale = pathname.split('/')[1];
    router.push(`/${locale}/api`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="py-4">
        <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* Logo y nombre de la aplicación ahora son clickeables y redirigen a upload */}
            <Link 
              href={`/${pathname.split('/')[1]}/upload`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Image 
                src="/logo.png" 
                alt="Study App Logo" 
                width={24}
                height={24}
                unoptimized
                className="w-6 h-6"
              />
              <h1 className="text-2xl font-bold">{t("name")}</h1>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            {/* Botón de API */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToApiPage}
              className={`mr-2 ${!isAvailable ? "border-red-500 text-red-500 hover:bg-red-100 hover:text-red-600" : ""}`}
            >
              <KeyRound className="h-4 w-4 mr-1" />
              API
              {!isAvailable && <span className="ml-1 text-xs">⚠️</span>}
            </Button>
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      
      {/* Barra de progreso */}
      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto py-2 border-none">
        <Progress value={getProgress()} className="h-2" />
      </div>
      
      {/* Navegación por pestañas */}
      <WorkflowTabs />
      
      {/* Contenido principal */}
      <main className="flex-1 w-full">
        <div className="mx-auto">
          {children}
        </div>
      </main>
      
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto">
          <Link href="https://cardozo.com.ar" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:underline">
            cardozo.com.ar
          </Link>
        </div>
      </footer>
    </div>
  );
}