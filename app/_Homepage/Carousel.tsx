"use client"

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType } from "embla-carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Pics = {
  pics: string[];
};

export default function Carousel({ pics }: Pics) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);
  const autoplayRef = React.useRef<NodeJS.Timeout | null>(null);

  // Handle slide change
  const onSelect = React.useCallback((api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  // Setup Embla listeners
  React.useEffect(() => {
    if (!emblaApi) return;

    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", () => onSelect(emblaApi));
    onSelect(emblaApi);
  }, [emblaApi, onSelect]);

  // Autoplay with pause on hover
  React.useEffect(() => {
    if (!emblaApi) return;

    const play = () => {
      stop();
      autoplayRef.current = setInterval(() => {
        emblaApi.scrollNext();
      }, 3500); // Slightly slower for smoother feel
    };

    const stop = () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };

    play();

    const node = emblaApi.containerNode();
    node.addEventListener("mouseenter", stop);
    node.addEventListener("mouseleave", play);

    return () => {
      stop();
      node.removeEventListener("mouseenter", stop);
      node.removeEventListener("mouseleave", play);
    };
  }, [emblaApi]);

  return (
    <div className="relative w-full max-w-3xl mx-auto group">
      {/* Carousel */}
      <div
        className="overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500"
        ref={emblaRef}
      >
        <div className="flex">
          {pics.map((src, i) => (
            <div
              key={i}
              className="flex-[0_0_100%] relative"
            >
              <img
                src={src}
                alt={`Slide ${i + 1}`}
                className="w-full aspect-[16/9] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => emblaApi?.scrollPrev()}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all duration-300"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => emblaApi?.scrollNext()}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all duration-300"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {scrollSnaps.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${i === selectedIndex
              ? "bg-white scale-125 shadow-md"
              : "bg-white/40 hover:bg-white/70"
              }`}
          />
        ))}
      </div>
    </div>
  );
}
