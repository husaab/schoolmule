'use client'
import AuthGuard from '@/components/AuthGuard';
import Notification from '../../components/shared/notification';
import ImpersonationBar from '@/components/impersonation/ImpersonationBar';
import { Analytics } from "@vercel/analytics/next"
import ClientErrorReporter from '@/components/observe/ClientErrorReporter';

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
      <AuthGuard>{children}</AuthGuard>
      <ImpersonationBar />
    </>
  );
}
