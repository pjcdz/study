import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({locale}) => {
  // Handle potential undefined locale with a fallback
  const safeLocale = locale || 'es'; // Using 'es' as fallback based on your configuration
  
  // Load messages for the requested locale
  const messages = (await import(`../messages/${safeLocale}/messages.json`)).default;
  
  return {
    locale: safeLocale,
    messages,
    // You can add timeZone configuration here if needed
    // timeZone: 'Europe/Vienna'
  };
});