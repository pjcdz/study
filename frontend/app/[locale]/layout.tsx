import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import AppContainer from '@/components/app-container';
import { Toaster } from "@/components/ui/sonner";

// Import internationalization messages
import es from '@/messages/es/messages.json';
import en from '@/messages/en/messages.json';

// Define messages for each locale
const messages = {
  es,
  en,
};

// Only allow these locales
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
  // Fix the NextJS warning by getting the locale without directly accessing params.locale
  // This is a workaround for "Route used `params.locale`. `params` should be awaited"
  const localeParam = params?.locale || '';
  const locale = getSafeLocale(localeParam);
  
  // Check if the requested locale is supported
  if (!supportedLocales.includes(locale)) {
    notFound();
  }

  // Access messages for the requested locale
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

// Generate static routes for supported locales
export function generateStaticParams() {
  return supportedLocales.map(locale => ({ locale }));
}