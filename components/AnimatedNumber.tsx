'use client';

// Animated count-up for integer-cent money figures. Renders the final
// formatted value on first paint (SSR-safe), then tweens a local object
// (snap to whole cents) and writes text via ref — no React state per tick.

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion, registerMotionPlugins } from "@/lib/motion";

registerMotionPlugins();

interface AnimatedNumberProps {
  /** Integer cents to display. */
  value: number;
  /** Formats cents for display (e.g. formatEUR). */
  format: (cents: number) => string;
  /** Tween duration in seconds. */
  duration?: number;
  className?: string;
}

export default function AnimatedNumber({
  value,
  format,
  duration = 0.9,
  className,
}: AnimatedNumberProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  // Latest format without retriggering the tween when its identity changes.
  const formatRef = useRef(format);
  formatRef.current = format;
  // Previous settled value; first mount plays from 0 for the count-up feel.
  const prevRef = useRef(0);
  const mountedRef = useRef(false);

  useGSAP(
    () => {
      const el = spanRef.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        el.textContent = formatRef.current(value);
        prevRef.current = value;
        mountedRef.current = true;
        return;
      }
      // StrictMode remount: replay from 0 so mount always counts up.
      const from = mountedRef.current ? prevRef.current : 0;
      mountedRef.current = true;
      prevRef.current = value;
      const counter = { v: from };
      const tween = gsap.to(counter, {
        v: value,
        duration,
        ease: "power2.out",
        snap: { v: 1 },
        onUpdate: () => {
          if (spanRef.current) {
            spanRef.current.textContent = formatRef.current(Math.round(counter.v));
          }
        },
      });
      return () => {
        tween.kill();
      };
    },
    { scope: spanRef, dependencies: [value, duration] },
  );

  return (
    <span ref={spanRef} className={className}>
      {format(value)}
    </span>
  );
}
