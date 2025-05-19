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
  // In Next.js 15+, params is a Promise that must be awaited
  const { locale: rawLocale } = await Promise.resolve(params);
  
  // Now use the local copy which has been properly awaited
  const locale = getSafeLocale(rawLocale);
  
  // Check if the requested locale is supported
  if (!supportedLocales.includes(locale)) {
    notFound();
  }

  // Access messages for the requested locale
  const localeMessages = messages[locale as keyof typeof messages];

  // Return the JSX with properly awaited params
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
                    // Only try to import if we're not explicitly in non-demo mode
                    const envDemoContent = '${process.env.USE_DEMO_CONTENT || 'undefined'}';
                    const localStorageDemoContent = window.localStorage.getItem('USE_DEMO_CONTENT');
                    
                    // Check if we're explicitly NOT in demo mode
                    if (envDemoContent === 'false') {
                      // If localStorage has 'true', clear it to maintain consistency
                      if (localStorageDemoContent === 'true') {
                        window.localStorage.removeItem('USE_DEMO_CONTENT');
                      }
                      // Don't even try to import the module
                      console.log('Demo mode explicitly disabled, skipping import');
                      return;
                    }
                    
                    // Only import if we might be in demo mode
                    if (envDemoContent === 'true' || localStorageDemoContent === 'true') {
                      // Import and initialize demo data dynamically with the correct path
                      import('@/lib/mock-data.js')
                        .then(module => {
                          if (typeof module.initDemoData === 'function') {
                            module.initDemoData();
                          }
                        })
                        .catch(err => console.error('Error loading demo data:', err));
                    }
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