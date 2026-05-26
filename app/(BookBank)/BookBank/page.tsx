import LinkGrid from "@/app/_components/LinkGrid"
import { subjects } from "./subjects"

function page() {
	return <LinkGrid items={subjects} basePath="/BookBank" />
}

export default page
