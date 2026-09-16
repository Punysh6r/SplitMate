// Bizum micro-guide: Bizum P2P lives inside bank apps keyed by mobile
// number (clipboard-bridge only, no deep link exists), so each settlement
// row copies the creditor number and this guide explains the 3 manual steps.

const BIZUM_STEPS = [
  "Copia el número de Bizum",
  "Abre tu banco → Bizum → Enviar dinero",
  "Elige el contacto, pega y envía",
];

export default function BizumGuide() {
  return (
    <div className="mb-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2.5">
      <ol className="flex min-w-0 flex-col gap-1.5">
        {BIZUM_STEPS.map((step, index) => (
          <li key={step} className="flex min-w-0 items-baseline gap-2 text-sm">
            <span
              aria-hidden="true"
              className="shrink-0 text-sm font-bold tabular-nums text-emerald-300"
            >
              {index + 1}
            </span>
            <span className="min-w-0 text-slate-200">{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-slate-400">
        Los móviles solo viven en este navegador, no se envían a ningún servidor.
      </p>
    </div>
  );
}
