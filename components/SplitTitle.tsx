'use client';

// Hero title with a SplitText word-mask reveal. Static h1 under reduced
// motion; split markup is reverted on cleanup so nothing leaks on unmount.

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { prefersReducedMotion, registerMotionPlugins } from "@/lib/motion";

registerMotionPlugins();

interface SplitTitleProps {
  text: string;
  className?: string;
}

export default function SplitTitle({ text, className }: SplitTitleProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const el = headingRef.current;
      if (!el) return;
      if (prefersReducedMotion()) return;
      const split = SplitText.create(el, { type: "words", mask: "words" });
      const tween = gsap.from(split.words, {
        yPercent: 110,
        duration: 0.7,
        ease: "expo.out",
        stagger: 0.06,
      });
      return () => {
        tween.kill();
        split.revert();
      };
    },
    { scope: headingRef, dependencies: [text] },
  );

  return (
    <h1 ref={headingRef} className={className}>
      {text}
    </h1>
  );
}
