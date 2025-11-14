import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to the default locale (es) and the default page
  redirect('/es/upload');
}
