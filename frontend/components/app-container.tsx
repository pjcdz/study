"use client";

import { Progress } from "@/components/ui/progress";
import { WorkflowTabs } from "@/components/navigation/tab-nav";
import { useUploadStore } from "@/store/use-upload-store";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import LanguageSwitcher from "@/components/settings/language-switcher";
import ThemeSwitcher from "@/components/settings/theme-switcher";
import Link from "next/link";

export default function AppContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentStep, setCurrentStep } = useUploadStore();
  const pathname = usePathname();
  const t = useTranslations("app");

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

  // Calcular progreso basado en el paso actual
  const getProgress = () => {
    switch (currentStep) {
      case 'upload': return 33;
      case 'summary': return 66;
      case 'flashcards': return 100;
      default: return 33;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b py-4">
        <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t("name")}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      
      {/* Barra de progreso */}
      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto py-2">
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
      
      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto">
          <Link href="https://cardozo.com.ar" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:underline">
            cardozo.com.ar
          </Link>
        </div>
      </footer>
    </div>
  );
}