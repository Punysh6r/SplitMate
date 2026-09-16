// Shared GSAP plugin registration + reduced-motion helper (no "use client":
// pure module, safe to import from client components; never touches window
// at module scope so SSR stays clean).

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";

let motionPluginsRegistered = false;

/** Register every GSAP plugin used by the Motion Pro pack (idempotent). */
export function registerMotionPlugins(): void {
  if (motionPluginsRegistered) return;
  motionPluginsRegistered = true;
  gsap.registerPlugin(useGSAP, ScrollTrigger, Flip, SplitText);
}

/** True when the user prefers reduced motion (SSR-safe: false on server). */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
