import { Suspense } from 'react'
import WebsiteRedirect from '@/components/landing/WebsiteRedirect'

// The marketing website. Signed-in users who arrive here go to their home
// page (lib/websiteVisit); useSearchParams needs the Suspense.
export default function PreloginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <WebsiteRedirect />
      </Suspense>
      {children}
    </>
  );
}
