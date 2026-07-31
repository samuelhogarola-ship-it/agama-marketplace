"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  { src: "/todoplastico-hero.png", alt: "Productos y materiales plásticos industriales" },
  { src: "/todoplastico-hero-2.png", alt: "Envases, tubos y materiales plásticos" },
];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 bg-brand-dark" aria-hidden="true">
      {slides.map((slide, index) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={index === 0}
          sizes="100vw"
          className={`object-cover object-center transition-opacity duration-1000 ${index === active ? "opacity-100" : "opacity-0"}`}
        />
      ))}
    </div>
  );
}
