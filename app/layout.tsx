import type { Metadata } from "next";
import NavBar from "./_NavBar/NavBar";
import "./globals.css";
import ThemedClerkProvider from "./ThemedClerkProvider";

export const metadata: Metadata = {
  title: "MedEval",
  description: "Medical Assessment App",
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