import type { Metadata } from "next";
import NavBar from "./_NavBar/NavBar";
import "./globals.css";
import ThemedClerkProvider from "./ThemedClerkProvider";

export const metadata: Metadata = {
  // Essentials
  title: "MedEval",
  description: "MedEval is a free, student-built medical study hub. Access past papers, a growing book bank, and hospital maps. All 100% FREE. Study smarter, not harder.",

  // SEO FUNDAMENTALS
  keywords: ['past papers', 'medical exams', 'MBBS resources', 'book band', 'maps', 'MedEval'],
  creator: 'Sheikh Abdul Qadir Jillani',
  publisher: 'MedEval (Student Initiative)',

  // OPEN GRAPH (Social Media Sharing)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://med-eval.vercel.app',
    title: 'MedEval — Free Medical Assessment Hub',
    description: "MedEval is a free, student-built medical study hub. Access past papers, a growing book bank, and hospital maps. All 100% FREE. Study smarter, not harder.",
    siteName: "MedEval",
    images: [
      {
        url: '/android-chrome-384x384.png',
        width: 384,
        height: 384,
        alt: 'Logo'
      }
    ]
  },

  // ICONS & FAVICONS
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg' }
    ]
  },

  // MANIFEST FOR PWA
  manifest: '/manifest.json',

  // APP-SPECIFIC (for mobile apps)
  appleWebApp: {
    capable: true,
    title: 'MedEval',
    statusBarStyle: 'black-translucent'
  },

  other: {
    'application-name': 'MedEval',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'format-detection': 'telephone=no'
  },

  // ROBOTS & CRAWLING
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
};

function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ThemedClerkProvider>
      <html lang="en" data-theme='false'>
        <body>
          <NavBar />
          {children}
        </body>
      </html>
    </ThemedClerkProvider>
  );
}

export default RootLayout