import Footer from "./_Homepage/Footer";
import Hero from "./_Homepage/Hero";
import Section from "./_Homepage/Section";

export default function Home() {
  const headingP = 'Past Papers'
  const listP = [
    "Access exams from all years and all modules",
    "Study with compiled papers or focus on individual modules",
    "Resume anytime, without losing progress",
    "Sync seamlessly across devices",
    "Receive detailed performance insights after each attempt"
  ]
  const picsP = ["/homepage/slideshow/slide1.png", "/homepage/slideshow/slide2.png", "/homepage/slideshow/slide3.png", "/homepage/slideshow/slide4.png"]
  const indexP = 0

  const headingB = 'Book Bank'
  const listB = [
    "A comprehensive digital library of essential medical textbooks",
    "All resources available in downloadable PDF format",
    "Organized for quick access throughout your med school journey",
    "Available anytime, anywhere"
  ]
  const picsB = ["/homepage/slideshow/slide5.png", "/homepage/slideshow/slide6.png", "/homepage/slideshow/slide7.png", "/homepage/slideshow/slide8.png"]
  const indexB = 1

  const headingM = 'Campus & Hospital Maps'
  const listM = [
    "Interactive hospital and campus navigation at your fingertips",
    "Explore the entire hospital layout with ease",
    "Find wards and locations instantly using the dropdown",
    "Never get lost again — precise routes for stress-free navigation",
  ]
  const picsM = ["/homepage/slideshow/slide9.png", "/homepage/slideshow/slide10.png", "/homepage/slideshow/slide11.png", "/homepage/slideshow/slide12.png"]
  const indexM = 2

  return (
    <>
      <Hero />
      <Section heading={headingP} list={listP} pics={picsP} index={indexP} />
      <Section heading={headingB} list={listB} pics={picsB} index={indexB} />
      <Section heading={headingM} list={listM} pics={picsM} index={indexM} />
      <Footer />
    </>
  );
}
