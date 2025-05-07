import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import AppContainer from '@/components/app-container';
import { Toaster } from "@/components/ui/sonner";

// Importamos los mensajes de internacionalización
import es from '@/messages/es/messages.json';
import en from '@/messages/en/messages.json';

// Definimos los mensajes para cada locale
const messages = {
  es,
  en,
};

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: {
    locale: string;
  };
};

// Solo permitimos estos locales
export const supportedLocales = ['en', 'es'];

// Helper function to safely get locale
function getSafeLocale(locale: string | undefined): string {
  if (!locale || !supportedLocales.includes(locale)) {
    return 'es'; // Default fallback
  }
  return locale;
}

export default function LocaleLayout({ 
  children, 
  params 
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Get the locale from params directly
  const locale = getSafeLocale(params.locale);
  
  // Verificar si el locale solicitado está soportado
  if (!supportedLocales.includes(locale)) {
    notFound();
  }

  // Acceder a los mensajes para el locale solicitado
  const localeMessages = messages[locale as keyof typeof messages];

  return (
    <NextIntlClientProvider locale={locale} messages={localeMessages}>
      <AppContainer>
        {children}
      </AppContainer>
      <Toaster position="top-center" richColors />
    </NextIntlClientProvider>
  );
}

// Generar metadatos dinámicamente basados en el locale
export function generateMetadata({ 
  params 
}: {
  params: { locale: string };
}) {
  // Get the locale directly from params
  const locale = getSafeLocale(params.locale);
  
  // Título y descripción localizados
  return {
    title: locale === 'es' ? 'StudyApp - Tu asistente de estudio' : 'StudyApp - Your study assistant',
    description: locale === 'es' 
      ? 'Sube archivos o texto para generar resúmenes y flashcards automáticamente'
      : 'Upload files or text to generate summaries and flashcards automatically',
  };
}

// Genera rutas estáticas para los locales soportados
export function generateStaticParams() {
  return supportedLocales.map(locale => ({ locale }));
}