'use client'
import { Suspense } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Notification from '@/components/shared/notification';
import ImpersonationBar from '@/components/impersonation/ImpersonationBar';
import { Analytics } from "@vercel/analytics/next"
import ClientErrorReporter from '@/components/observe/ClientErrorReporter';
import StudentProfileHost from '@/components/student/profile/StudentProfileHost';

// Everything inside the app (signed-in pages, sign-in and sign-up): the auth
// guard and the app-wide overlays. app/(user)/layout.tsx wraps it so the
// layout can stay a server component and set the pages' robots rule.
export default function UserShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Notification />
      <Analytics />
      <ClientErrorReporter />
      <AuthGuard>
        {children}
        {/* The student profile modal, opened over any page by ?profile=. useSearchParams needs Suspense. */}
        <Suspense fallback={null}>
          <StudentProfileHost />
        </Suspense>
      </AuthGuard>
      <ImpersonationBar />
    </>
  );
}
