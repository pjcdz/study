import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is always a string
  if (!locale) {
    throw new Error('Locale is required');
  }
  
  return {
    locale, // At this point locale is guaranteed to be a string
    messages: (await import(`./messages/${locale}/messages.json`)).default
  };
});