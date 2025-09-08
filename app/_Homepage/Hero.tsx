import { Card, CardContent } from "@/components/ui/card";
import { Book, FileText, Map } from "lucide-react";
import Image from "next/image";

export default function Hero() {
  const features = [
    {
      heading: "Past Papers",
      description: "Practice with a comprehensive collection of past papers.",
      icon: FileText
    },
    {
      heading: "Book Bank",
      description: "Free access to medical textbooks in PDF.",
      icon: Book
    },
    {
      heading: "Campus & Hospital Maps",
      description: "Navigate Dow University and Civil Hospital easily.",
      icon: Map
    }
  ]

  return (
    <main className="w-[85%] mx-auto min-h-[calc(100svh-80px)] bg-background flex flex-col">
      {/* Hero Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-1 items-center">
        {/* Left Content */}
        <div className="text-center md:text-left mt-5 md:mb-5">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
            From Chaos to Clarity
          </h1>
          <p className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
            Your one-stop resource hub for past papers, medical books, and hospital maps.
          </p>
        </div>
        {/* Right Illustration */}
        <div className="flex justify-center md:justify-end">
          <Image
            src="/homepage/hero.png"
            alt="Hero illustration"
            width={380}
            height={380}
            className="w-64 sm:w-80 md:w-96 h-auto"
            priority
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {
          features.map(i => {
            const Icons = i.icon
            return (
              <Card key={i.heading} className="rounded-2xl shadow-accent shadow-md hover:shadow-lg transition">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Icons className="h-12 w-12 text-purple-500 mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">
                    {i.heading}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {i.description}
                  </p>
                </CardContent>
              </Card>)
          })
        }
      </section>

      {/* About Section */}
      <section className="flex flex-col items-center my-9 md:my-12 text-center">
        <h2 className="w-fit text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
          About MedEval
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
          Built by students, for students — Medeval is designed to make your medical journey at medschool easier.
          Whether you’re preparing for exams or finding your way around the wards, we’ve got you covered.
        </p>
      </section>
    </main>
  );
}
