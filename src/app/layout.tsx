import type { Metadata } from "next";
import { Roboto, Outfit } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { WEBSITE_REDIRECT_SCRIPT } from "@/lib/websiteVisit";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
  // The app's body face. Not preloaded: the website (Outfit) never uses it,
  // and preloading it there competed with each page's largest paint.
  preload: false,
})

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: 'SchoolMule: School Management for Independent Schools',
    template: '%s - SchoolMule'
  },
  description: "Attendance, grades, report cards and parent messages in one system, with a view for the office, teachers, parents and students. Built for small independent schools in Ontario.",
  // No site-wide canonical: each marketing page sets its own (lib/marketing/seo).
  robots: { index: true, follow: true },
  applicationName: 'SchoolMule',
  authors: [{ name: "SchoolMule" }],
  metadataBase: new URL('https://schoolmule.ca'),
  openGraph: {
    title: "SchoolMule: School Management for Independent Schools",
    description: 'Attendance, grades, report cards and parent messages in one system, with a view for the office, teachers, parents and students.',
    type: "website",
    siteName: "SchoolMule",
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: "SchoolMule: School Management for Independent Schools",
    description: 'Attendance, grades, report cards and parent messages in one system, with a view for the office, teachers, parents and students.',
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
            url: "https://schoolmule.ca"
          })}
        </Script>
        {/* Before anything paints: a signed-in user arriving at the website goes to their home page (lib/websiteVisit). */}
        <script dangerouslySetInnerHTML={{ __html: WEBSITE_REDIRECT_SCRIPT }} />
      </head>
      <body
        className={`${roboto.variable} ${outfit.variable} antialiased`}
      >
          {children}
      </body>
    </html>
  );
}
