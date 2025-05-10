import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import AppContainer from '@/components/app-container';
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

// Importamos los mensajes de internacionalización
import es from '@/messages/es/messages.json';
import en from '@/messages/en/messages.json';

// Definimos los mensajes para cada locale
const messages = {
  es,
  en,
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

type Props = {
  children: React.ReactNode;
  params: { locale: string };
}

export default function LocaleLayout({ children, params }: Props) {
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

// Static metadata
export const metadata = {
  title: 'StudyApp',
  description: 'Upload files or text to generate summaries and flashcards automatically',
};

// Genera rutas estáticas para los locales soportados
export function generateStaticParams() {
  return supportedLocales.map(locale => ({ locale }));
}