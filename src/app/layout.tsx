import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import AuthGuard from '@/components/AuthGuard';
import Notification from '../components/shared/notification';
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
})

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-roboto-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "SchoolMule",
  description: "A student management software",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${roboto.className} antialiased`}
      >
        <Notification />
        <AuthGuard> 
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}
