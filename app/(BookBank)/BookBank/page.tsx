import BookBank from "../BookBank"

function page() {
	const subjects = ['biochemistry', 'embryology', 'gross-anatomy', 'histology', 'physiology', 'pathology', 'microbiology', 'pharmacology', 'forensics', 'neuroscience', 'medicine', 'surgery', 'radiology', 'pediatrics', 'obgyn', 'otorhinolaryngology', 'ophthalmology', 'usmle']

	return (
		<BookBank subjects={subjects} />
	)
}

export default page