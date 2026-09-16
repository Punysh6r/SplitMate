"use client";

// Ticket scanner: capture/upload -> preview -> OCR -> editable review.
// Presentational: it never talks to the store, it reports the confirmed
// merchant + total through onConfirm so the page can prefill ExpenseForm.

import { useEffect, useRef, useState } from "react";
import { eurosToCents, isValidAmount } from "@/lib/money";
import { parseTicketText, recognizeTicket } from "@/lib/ocr";

interface ScanTicketProps {
  onConfirm: (result: { merchant: string; totalCents: number }) => void;
  onCancel: () => void;
}

type ScanState = "idle" | "preview" | "scanning" | "review" | "error";

function toTotalText(totalCents: number | null): string {
  if (totalCents === null) return "";
  return (totalCents / 100).toFixed(2).replace(".", ",");
}

/** Mirror of ExpenseForm amount parsing: Spanish comma decimals accepted. */
function parseEuroText(value: string): number {
  const normalized = value.trim().replace(",", ".");
  return normalized === "" ? NaN : Number(normalized);
}

export default function ScanTicket({ onConfirm, onCancel }: ScanTicketProps) {
  const [state, setState] = useState<ScanState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [merchant, setMerchant] = useState("");
  const [totalText, setTotalText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  // Revoke the thumbnail URL when it changes or the panel unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const pickImage = () => inputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null;
    if (!next) return;
    if (!next.type.startsWith("image/")) {
      setError("Elige una foto del ticket (JPG, PNG o similar).");
      setState("error");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
    setError(null);
    setFieldError(null);
    setState("preview");
  };

  const resetPicker = () => {
    if (inputRef.current) inputRef.current.value = "";
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setFieldError(null);
    setState("idle");
  };

  const startScan = async () => {
    if (!file) return;
    cancelledRef.current = false;
    setProgress(null);
    setError(null);
    setFieldError(null);
    setState("scanning");
    try {
      const { text, confidence: score } = await recognizeTicket(file, (p) => {
        if (!cancelledRef.current) setProgress(Math.round(p * 100));
      });
      if (cancelledRef.current) return;
      const parsed = parseTicketText(text);
      setMerchant(parsed.merchant ?? "");
      setTotalText(toTotalText(parsed.totalCents));
      setConfidence(Number.isFinite(score) ? Math.round(score) : null);
      setState("review");
    } catch (err) {
      if (cancelledRef.current) return;
      setError(
        err instanceof Error ? err.message : "No se ha podido analizar el ticket.",
      );
      setState("error");
    }
  };

  const cancelScan = () => {
    cancelledRef.current = true;
    setProgress(null);
    // The worker is terminated inside recognizeTicket; keep the photo for retry.
    setState(file ? "preview" : "idle");
  };

  const handleConfirm = () => {
    const parsed = parseEuroText(totalText);
    if (!merchant.trim()) {
      setFieldError("Escribe el nombre del comercio.");
      return;
    }
    if (!isValidAmount(parsed) || parsed <= 0) {
      setFieldError("Escribe un total válido en euros (p. ej., 24,50).");
      return;
    }
    setFieldError(null);
    onConfirm({ merchant: merchant.trim(), totalCents: eurosToCents(parsed) });
  };

  return (
    <section aria-label="Escanear ticket" className="sm-card mt-3 min-w-0 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-slate-100">Escanear ticket</h3>
      <p className="mt-1 text-sm text-slate-400">
        Haz una foto al ticket o súbela: detectamos el comercio y el total para
        rellenar el gasto. Siempre lo revisas tú antes de guardar.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="Foto del ticket"
        onChange={handleFileChange}
      />

      {state === "idle" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={pickImage} className="sm-btn-primary">
            Hacer foto / Elegir imagen
          </button>
          <button type="button" onClick={onCancel} className="sm-btn-ghost">
            Cancelar
          </button>
        </div>
      ) : null}

      {state === "preview" && previewUrl ? (
        <div className="mt-3 flex min-w-0 flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Vista previa del ticket"
            className="max-h-64 w-auto self-start rounded-lg border border-white/10 object-contain"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={startScan} className="sm-btn-primary">
              Analizar ticket
            </button>
            <button type="button" onClick={resetPicker} className="sm-btn-ghost">
              Cambiar imagen
            </button>
            <button type="button" onClick={onCancel} className="sm-btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {state === "scanning" ? (
        <div className="mt-3 flex min-w-0 flex-col gap-2">
          <p className="text-sm text-slate-200" role="status">
            Analizando ticket…{progress !== null ? ` ${progress} %` : ""}
          </p>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label="Progreso del análisis"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress ?? undefined}
          >
            {progress !== null ? (
              <div
                className="h-full rounded-full bg-emerald-400 motion-safe:transition-[width] motion-safe:duration-300"
                style={{ width: `${progress}%` }}
              />
            ) : (
              <div className="h-full w-1/3 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
            )}
          </div>
          <p className="text-sm text-slate-400">
            La primera vez se descarga el modelo de idioma (unos MB) y puede tardar
            un poco; después queda en caché.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={cancelScan} className="sm-btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {state === "review" ? (
        <div className="mt-3 flex min-w-0 flex-col gap-4">
          {confidence !== null ? (
            <p className="text-sm text-slate-400">Confianza del análisis: {confidence} %</p>
          ) : null}
          <div>
            <label htmlFor="scan-merchant" className="sm-label">
              Comercio
            </label>
            <input
              id="scan-merchant"
              type="text"
              value={merchant}
              onChange={(event) => setMerchant(event.target.value)}
              placeholder="p. ej., Bar Manolo"
              className="sm-input mt-1"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="scan-total" className="sm-label">
              Total (€)
            </label>
            <input
              id="scan-total"
              type="text"
              inputMode="decimal"
              value={totalText}
              onChange={(event) => setTotalText(event.target.value)}
              placeholder="p. ej., 24,50"
              className="sm-input mt-1"
              autoComplete="off"
            />
          </div>
          {fieldError ? (
            <p role="alert" className="text-sm text-rose-400">
              {fieldError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleConfirm} className="sm-btn-primary">
              Usar estos datos
            </button>
            <button type="button" onClick={startScan} className="sm-btn-ghost">
              Reintentar
            </button>
            <button type="button" onClick={onCancel} className="sm-btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {state === "error" ? (
        <div className="mt-3 flex min-w-0 flex-col gap-3">
          <p role="alert" className="text-sm text-rose-400">
            {error ?? "No se ha podido analizar el ticket."} Prueba con una foto más
            nítida y con buena luz.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => (file ? setState("preview") : resetPicker())}
              className="sm-btn-primary"
            >
              Reintentar
            </button>
            <button type="button" onClick={onCancel} className="sm-btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
