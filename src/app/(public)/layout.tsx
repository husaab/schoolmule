import type { Metadata } from 'next'

// Schools' public forms and shared schedule links: pages for the families a
// school sends there, not search results. "follow" lets the links on them
// (the SchoolMule logo and "Powered by SchoolMule") count for the website.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function PublicFormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}
