import { redirect } from 'next/navigation';

// This component handles the root of each locale (/en or /es)
export default async function LocaleIndexPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/upload`);
}