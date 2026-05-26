import BookBank from "../BookBank"
import { subjects } from "./subjects"

function page() {
	return (
		<BookBank subjects={subjects} />
	)
}

export default page