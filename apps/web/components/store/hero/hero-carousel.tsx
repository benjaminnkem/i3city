"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { HERO_AUTOPLAY_MS } from "@/lib/motion";
import { cn } from "@/lib/utils";

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function HeroCarousel({
  slides,
  labels,
}: Readonly<{ slides: React.ReactNode[]; labels: string[] }>) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const reduced = useReducedMotion();
  const count = slides.length;
  const playing = !stopped && !reduced;
  const moving = playing && !hovered && !focused;

  const goTo = useCallback(
    (index: number) => {
      const element = track.current;
      if (!element) return;
      const target = (index + count) % count;
      element.scrollTo({
        left: target * element.clientWidth,
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [count, reduced],
  );

  useEffect(() => {
    if (!moving) return;
    const timer = window.setTimeout(() => goTo(active + 1), HERO_AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [moving, active, goTo]);

  function onScroll(event: React.UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    const index = Math.round(element.scrollLeft / element.clientWidth);
    setActive((current) => (current === index ? current : index));
  }

  function navigate(index: number) {
    setStopped(true);
    goTo(index);
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      className="flex flex-col gap-3"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
        }
      }}
    >
      <div
        ref={track}
        onScroll={onScroll}
        onTouchStart={() => setStopped(true)}
        aria-live={moving ? "off" : "polite"}
        className="-m-2 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => (
          <div
            key={labels[index] ?? index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}`}
            inert={index !== active}
            className="flex w-full shrink-0 snap-center snap-always items-stretch p-2"
          >
            {slide}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Previous slide"
          onClick={() => navigate(active - 1)}
          className="hidden md:inline-flex"
        >
          <ChevronLeftIcon />
        </Button>
        <ol className="flex items-center">
          {labels.map((label, index) => (
            <li key={`${index}-${label}`}>
              <button
                type="button"
                aria-label={`Show slide ${index + 1}: ${label}`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => navigate(index)}
                className="flex h-11 items-center px-1.5"
              >
                <span
                  className={cn(
                    "bg-border block h-2 w-2 rounded-pill transition-all duration-300",
                    index === active && "bg-primary w-6",
                  )}
                />
              </button>
            </li>
          ))}
        </ol>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Next slide"
          onClick={() => navigate(active + 1)}
          className="hidden md:inline-flex"
        >
          <ChevronRightIcon />
        </Button>
        {reduced ? null : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={stopped ? "Play slides" : "Pause slides"}
            onClick={() => setStopped((current) => !current)}
          >
            {stopped ? <PlayIcon /> : <PauseIcon />}
          </Button>
        )}
      </div>
    </section>
  );
}
