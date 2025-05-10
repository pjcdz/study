import { redirect } from 'next/navigation';

// This component handles the root of each locale (/en or /es)
export default function LocaleIndexPage({ params }: { params: { locale: string } }) {
  // Use synchronous access for redirect
  redirect(`/${params.locale}/upload`);
}