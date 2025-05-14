import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import AppContainer from '@/components/app-container';
import { Toaster } from "@/components/ui/sonner";
import { DemoBanner } from '@/components/ui/demo-banner';
// Import demo data initializer
import { initDemoData } from '@/lib/mock-data';

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

// Making this function async to properly handle params
export default async function LocaleLayout({ children, params }: Props) {
  // Now we can safely use params.locale since we're in an async function
  const locale = getSafeLocale(params.locale);
  
  // Check if the requested locale is supported
  if (!supportedLocales.includes(locale)) {
    notFound();
  }

  // Access messages for the requested locale
  const localeMessages = messages[locale as keyof typeof messages];

  return (
    <NextIntlClientProvider locale={locale} messages={localeMessages}>
      {/* Add script to initialize demo data */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              if (typeof window !== 'undefined') {
                // Wait for window to be fully loaded before initializing demo data
                window.addEventListener('load', function() {
                  try {
                    // Import and initialize demo data dynamically
                    import('/lib/mock-data.js')
                      .then(module => {
                        if (typeof module.initDemoData === 'function') {
                          module.initDemoData();
                        }
                      })
                      .catch(err => console.error('Error loading demo data:', err));
                  } catch (e) {
                    console.error('Error initializing demo data:', e);
                  }
                });
              }
            } catch (e) {
              console.error('Error in demo data script:', e);
            }
          `
        }}
      />
      <DemoBanner />
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