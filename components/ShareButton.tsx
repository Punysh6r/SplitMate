"use client";

// Share button: opens the native share sheet (navigator.share) with a
// clipboard fallback. Transient Spanish feedback for both paths.

import { useEffect, useRef, useState } from "react";

interface ShareButtonProps {
  text: string;
  title?: string;
}

/**
 * Copy text to the clipboard: Clipboard API first, hidden-textarea
 * execCommand('copy') fallback for insecure contexts. Returns success.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the textarea fallback below.
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

export default function ShareButton({ text, title }: ShareButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the transient feedback timer on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const flash = (message: string) => {
    setFeedback(message);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setFeedback(null), 1500);
  };

  const handleClick = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: title ?? "SplitMate", text });
        flash("¡Compartido!");
        return;
      } catch (error) {
        // User dismissed the sheet: stay silent.
        if (error instanceof Error && error.name === "AbortError") return;
        // Other share errors fall through to the clipboard fallback.
      }
    }
    const ok = await copyText(text);
    if (ok) flash("¡Copiado!");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-live="polite"
      className="sm-btn-primary shrink-0"
    >
      {feedback ?? "Compartir"}
    </button>
  );
}
