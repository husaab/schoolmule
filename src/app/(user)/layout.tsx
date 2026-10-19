'use client'
import { Suspense } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Notification from '../../components/shared/notification';
import ImpersonationBar from '@/components/impersonation/ImpersonationBar';
import { Analytics } from "@vercel/analytics/next"
import ClientErrorReporter from '@/components/observe/ClientErrorReporter';
import StudentProfileHost from '@/components/student/profile/StudentProfileHost';

export default function UserLayout({
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
