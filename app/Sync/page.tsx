import { pageMetadata } from "@/lib/metadata"
import SyncPage from "./SyncPage"

export const metadata = pageMetadata(
  "Sync devices",
  "Move your MedEval progress, attempt history and saved questions between your phone and laptop with a backup file.",
  "/Sync",
)

export default function Page() {
  return <SyncPage />
}
