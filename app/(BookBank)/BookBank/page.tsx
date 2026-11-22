import LinkGrid from "@/app/_components/LinkGrid"
import { pageMetadata } from "@/lib/metadata"
import { labelParts } from "@/lib/papers"
import { subjects } from "./subjects"

export const metadata = pageMetadata(
  "Book Bank",
  `Free medical textbooks to download as PDFs, by subject: ${subjects.map(s => labelParts(s)[0]).join(", ")}.`,
  "/BookBank",
)

function page() {
	return <LinkGrid items={subjects} basePath="/BookBank" />
}

export default page
