import { pageMetadata } from "@/lib/metadata"

// page.tsx is a client component, which can't export metadata
export const metadata = pageMetadata(
  "Performance",
  "Your quiz history: accuracy over time and by module, with your weakest module first.",
  "/Performance",
)

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
