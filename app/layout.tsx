import type { Metadata, Viewport } from "next";
import NavBar from "./_NavBar/NavBar";
import { baseOpenGraph } from "@/lib/metadata";
import { EXPLAIN_KEY_STORAGE } from "@/lib/explanations";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#00ACE6",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  // Essentials
  metadataBase: new URL("https://med-eval.vercel.app"),
  title: { default: "MedEval", template: "%s | MedEval" },
  description: "MedEval is a free, student-built medical study hub. Access past papers, a growing book bank, and hospital maps. All 100% FREE. Study smarter, not harder.",

  // SEO FUNDAMENTALS
  keywords: ['past papers', 'medical exams', 'MBBS resources', 'book band', 'maps', 'MedEval'],
  creator: 'Sheikh Abdul Qadir Jillani',
  publisher: 'MedEval (Student Initiative)',

  // OPEN GRAPH (Social Media Sharing)
  openGraph: {
    ...baseOpenGraph,
    url: 'https://med-eval.vercel.app',
    title: 'MedEval — Free Medical Assessment Hub',
    description: "MedEval is a free, student-built medical study hub. Access past papers, a growing book bank, and hospital maps. All 100% FREE. Study smarter, not harder.",
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

// A ?key= link stores its explanations key on this device ("off" or empty
// forgets it) and drops the param. It must run before hydration: a React
// effect runs before Next patches history, so its replaceState wiped Next's
// state, and the router kept (and re-sent) the key from the original URL.
const explainKeyScript = `(function(){try{var u=new URL(location.href);if(!u.searchParams.has('key'))return;var v=(u.searchParams.get('key')||'').trim();try{if(v===''||v==='off')localStorage.removeItem('${EXPLAIN_KEY_STORAGE}');else localStorage.setItem('${EXPLAIN_KEY_STORAGE}',v)}catch(e){}u.searchParams.delete('key');var s=u.searchParams.toString();history.replaceState(history.state,'',u.pathname+(s?'?'+s:'')+u.hash)}catch(e){}})()`

function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('theme')==='true'){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: explainKeyScript }} />
        <NavBar />
        {children}
      </body>
    </html>
  );
}

export default RootLayout