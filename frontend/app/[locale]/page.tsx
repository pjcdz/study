import { redirect } from 'next/navigation';

// This component handles the root of each locale (/en or /es)
export default function LocaleIndexPage({ params }: { params: { locale: string } }) {
  // Redirect to the upload page for this locale
  redirect(`/${params.locale}/upload`);
}