import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from "next";
import NavBar from "./_components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedEval",
  description: "Medical Assessment App",
};

function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <NavBar/>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

export default RootLayout