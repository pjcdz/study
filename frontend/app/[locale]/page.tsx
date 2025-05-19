import { redirect } from 'next/navigation';

// This component handles the root of each locale (/en or /es)
export default async function LocaleIndexPage({ params }: { params: { locale: string } }) {
  // Make sure to properly await any async operations that depend on params
  const locale = params.locale;
  redirect(`/${locale}/upload`);
}