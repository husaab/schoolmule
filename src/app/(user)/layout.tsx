'use client'
import AuthGuard from '@/components/AuthGuard';
import Notification from '../../components/shared/notification';
import { Analytics } from "@vercel/analytics/next"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Notification />
      <Analytics />
      <AuthGuard>{children}</AuthGuard>
    </>
  );
}
