import Carousel from "./Carousel";
import { CircleCheckBig } from "lucide-react";

type Props = {
  list: string[],
  heading: string,
  pics: string[],
  index: number,
};

const Section = ({ list, heading, pics, index }: Props) => {
  const isReversed = index % 2 !== 0; // Reverse layout for odd sections

  return (
    <section
      className={`relative w-[85%] mx-auto grid gap-5 sm:gap-10 py-6 sm:grid-cols-2 items-center ${isReversed ? "sm:flex-row-reverse" : ""
        }`}
    >
      {/* Text Section */}
      <div
        className={`space-y-5 animate-fadeIn ${isReversed ? "sm:order-2" : "sm:order-1"
          }`}
      >
        {/* Heading */}
        <h1 className="w-fit text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
          {heading}
        </h1>

        {/* Features List */}
        <ul className="space-y-3 text-sm sm:text-base lg:text-lg text-muted-foreground">
          {list.map((point, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 transition-colors duration-200 hover:text-primary"
            >
              <div className="flex flex-row items-center gap-2">
                <CircleCheckBig className="w-5 h-5 text-primary shrink-0" />
                <span>{point}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Carousel Section */}
      <div
        className={`relative animate-fadeIn delay-150 ${isReversed ? "sm:order-1" : "sm:order-2"
          }`}
      >
        <div className="rounded-xl overflow-hidden shadow-accent shadow-xl ring-1 ring-border hover:scale-[1.02] transition-transform duration-300">
          <Carousel pics={pics} />
        </div>
      </div>
    </section>
  )
}

export default Section;
