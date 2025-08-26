import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: 'SchoolMule: Student Management System',
    template: '%s - SchoolMule'
  },
  description: "SchoolMule is a simple, modern platform for attendance, grades, report cards, and parent communication. Streamline your school administration with SchoolMule.",
  alternates: { canonical: 'https://schoolmule.ca' },
  robots: { index: true, follow: true },
  applicationName: 'SchoolMule',
  keywords: ["school management", "student information system", "attendance tracking", "gradebook", "parent portal", "education software"],
  authors: [{ name: "SchoolMule" }],
  metadataBase: new URL('https://schoolmule.ca'),
  openGraph: {
    title: "SchoolMule: School Management System",
    description: 'All-in-one platform for attendance, grading, report cards, and parent communication.',
    type: "website",
    siteName: "SchoolMule",
  },
  twitter: {
    card: "summary_large_image",
    title: "SchoolMule: School Management System",
    description: 'All-in-one platform for attendance, grading, report cards, and parent communication.',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
       <head>
        <Script id="schema-website" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "SchoolMule",
            alternateName: ["SchoolMule"],
            url: "https://schoolmule.ca/"
          })}
        </Script>
      </head>
      <body
        className={`${roboto.className} antialiased`}
      >
          {children}
      </body>
    </html>
  );
}
