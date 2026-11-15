import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/lib/react-query/QueryProvider';
import { NetworkStatusBar } from '@/components/NetworkStatusBar';
import { PWARegistration } from '@/components/PWARegistration';

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-arabic',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#1e3a8a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'رفاق - صندوق الجمعية التعاونية',
  description: 'نظام إدارة الاشتراكات الشهرية والمصروفات والأصول لجمعية رفاق التعاونية',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'رفاق',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${ibmPlexSansArabic.variable} h-full antialiased`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col font-sans selection:bg-purple-500/30">
        <QueryProvider>
          <PWARegistration />
          <NetworkStatusBar />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
