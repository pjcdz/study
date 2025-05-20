import { redirect } from 'next/navigation';

// This component handles the root of each locale (/en or /es)
export default async function LocaleIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  // Await params before accessing locale to comply with Next.js dynamic API requirements
  const { locale } = await params;
  redirect(`/${locale}/upload`);
}