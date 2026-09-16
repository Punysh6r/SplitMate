'use client';

// Reusable mount-only entrance wrapper (GSAP + useGSAP with scoped ref).
// Renders children statically when the user prefers reduced motion.

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface RevealProps {
  children: ReactNode;
  /** Start delay in seconds. */
  delay?: number;
  /** Vertical offset in px the element rises from. */
  y?: number;
  className?: string;
}

export default function Reveal({ children, delay = 0, y = 16, className }: RevealProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ reduceMotion: "(prefers-reduced-motion: reduce)" }, (context) => {
        // Static render for reduced motion; animate only on mount otherwise.
        if (context.conditions?.reduceMotion) return;
        if (!scope.current) return;
        gsap.fromTo(
          scope.current,
          { opacity: 0, y },
          { opacity: 1, y: 0, duration: 0.5, delay, ease: "power2.out" },
        );
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
