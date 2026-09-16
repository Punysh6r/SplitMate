# SplitMate — Divide gastos sin dramas

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-3.15-0AE448?logo=greensock&logoColor=black)
![Vitest](https://img.shields.io/badge/tests-37_passing-brightgreen?logo=vitest&logoColor=white)
![License](https://img.shields.io/badge/licencia-uso_acad%C3%A9mico-lightgrey)

Aplicación web para dividir gastos entre amigos, compañeros de piso y grupos de
viaje. Crea grupos, registra gastos (a mano o **escaneando el ticket**), consulta
saldos, descubre **quién debe pagar a quién con el mínimo de transferencias** y
cobra con enlaces de pago o compartiendo el resumen por WhatsApp.

**Sin APIs de IA de pago, sin mover dinero real, sin datos bancarios**: la
liquidación es código determinista y todos los datos viven en tu navegador
(`localStorage`). Sin cuentas, sin backend, funciona offline tras la primera carga.

---

## Índice

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Guía de uso](#guía-de-uso)
- [Escaneo de tickets (OCR)](#escaneo-de-tickets-ocr)
- [Cobrar: Revolut, Bizum y compartir](#cobrar-revolut-bizum-y-compartir)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Algoritmo de saldos](#algoritmo-de-saldos)
- [Tests](#tests)
- [Despliegue](#despliegue)
- [Privacidad y seguridad](#privacidad-y-seguridad)
- [Limitaciones conocidas](#limitaciones-conocidas)
- [Roadmap (v2)](#roadmap-v2)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Características

### Grupos y participantes

- Crear, renombrar y eliminar grupos.
- Añadir y quitar participantes (con protección: no se puede eliminar a quien
  haya pagado gastos del grupo).
- Tarjeta resumen por grupo: total, número de gastos y participantes.
- Cada participante puede guardar su **tag de Revolut** y su **móvil de Bizum**
  (opcionales, solo locales) para cobrar en un tap.

### Gastos

- Descripción, cantidad (acepta coma decimal española: `12,50`), pagador,
  involucrados (repartos parciales), fecha y moneda.
- Crear, editar y eliminar con validación en español.
- Filtros por participante y por rango de fechas, con animación de transición.
- **Escaneo de tickets con OCR local** que pre-rellena el formulario
  (ver [sección OCR](#escaneo-de-tickets-ocr)).

### Saldos y liquidación

- Total del grupo, pagado / corresponde / saldo por persona.
- Plan de liquidación con el **mínimo número de transferencias**.
- Barras proporcionales, cifras con count-up animado y estado
  «Cuentas saldadas» cuando no hay deudas.

### Cobro y exportación

- **Pagar con Revolut**: deep-link `revolut.me/<usuario>/<importe>EUR`.
- **Copiar número Bizum** + guía de 3 pasos (Bizum no ofrece deep-links a
  terceros: documentado en [Cobrar](#cobrar-revolut-bizum-y-compartir)).
- **Compartir**: resumen en texto a la hoja nativa del móvil (WhatsApp,
  Telegram…) con fallback a portapapeles.
- **Exportar CSV** compatible con Excel en español (`;` como separador).

### Diseño y movimiento

- Fintech oscuro premium: esmeralda sobre negro, glassmorphism, tipografía Geist.
- Hero coreografiado con timeline GSAP, título con revelado palabra a palabra
  (SplitText), reveals por scroll (ScrollTrigger), morphing de listas al filtrar
  (Flip) y contadores animados en todas las cifras.
- Responsive móvil/escritorio, targets táctiles ≥ 44 px y respeto total a
  `prefers-reduced-motion`.

---

## Stack tecnológico

| Capa            | Tecnología                          | Notas                                        |
|-----------------|-------------------------------------|----------------------------------------------|
| Framework       | Next.js 16 (App Router)             | Render híbrido, rutas `/` y `/groups/[id]`   |
| UI              | React 19 + TypeScript               | Client components, tipos estrictos           |
| Estilos         | Tailwind CSS v4                     | Tokens propios en `globals.css`              |
| Animación       | GSAP 3.15 + @gsap/react             | Timeline, ScrollTrigger, Flip, SplitText     |
| OCR             | tesseract.js 7                      | 100 % local, datos en español, lazy-load     |
| Tests           | Vitest 5                            | 37 tests unitarios del dominio               |
| Persistencia    | `localStorage` (`splitmate:v1`)     | Sin backend; seed de ejemplo al inicio       |
| Calidad         | ESLint + `tsc --noEmit`             | Verificados en cada cambio                   |

---

## Arquitectura

```
┌─────────────┐     acciones      ┌──────────────┐     lee/escribe   ┌──────────────┐
│  app/ +     │ ───────────────▶ │ lib/store.tsx │ ───────────────▶ │ localStorage │
│ components/ │ ◀─────────────── │  (contexto)   │                  │ splitmate:v1 │
└─────────────┘     estado       └──────────────┘                  └──────────────┘
       │                                │ pure functions
       │ usa                            ▼
       │                         ┌──────────────┐
       └────────────────────────▶│ lib/ dominio  │
                                 │ money/settle/ │
                                 │ csv/share/ocr │
                                 │ paylinks      │
                                 └──────────────┘
```

Principios:

- **Dominio puro y separado**: `lib/` no importa React ni APIs de navegador
  (salvo el wrapper fino de OCR). Todo el dinero en **céntimos enteros**.
- **Store fino**: contexto React + `localStorage`, hidratación sin mismatches
  (primer render determinista con seed, datos reales en efecto post-montaje).
- **Componentes presentacionales** con props compatibles y callbacks; la lógica
  de negocio nunca vive en la UI.
- **OCR y animación fuera del bundle inicial**: `import()` dinámico y registro
  único de plugins GSAP.

---

## Requisitos

- Node.js 20+ (recomendado 22/24) y npm 10+.
- Navegador moderno (Chrome/Edge/Firefox/Safari de los últimos 2 años).
- Para probar en el móvil en red local: PC y móvil en el mismo Wi-Fi.

---

## Instalación y ejecución

```bash
npm ci            # instalación limpia y reproducible desde el lockfile
npm run dev       # desarrollo → http://localhost:3000
npm run build     # build de producción (verificado: 3 rutas, 0 errores)
npm start         # servir el build → http://localhost:3000
npm test          # 37 tests unitarios (vitest)
npm run lint      # ESLint
```

**Probar desde el móvil (red local):** con `npm run dev` en marcha, abre en el
móvil `http://<IP-de-tu-PC>:3000` (la IP sale en la propia salida de Next como
`Network`, o con `ipconfig`). Si no carga, permite Node.js en el firewall de
Windows (red privada). Nota: por HTTP local el botón Compartir usa el fallback
de copiar; la hoja nativa completa requiere HTTPS (ver [Despliegue](#despliegue)).

**Datos de ejemplo:** al primer arranque se carga el grupo **Viaje a Madrid**
(Pablo, Ana, Luis, Marta + 3 gastos canónicos). Para resetear, borra el
almacenamiento del sitio en el navegador (clave `splitmate:v1`) y recarga.

---

## Guía de uso

1. **Home**: tarjetas de grupo con totales, o crea uno nuevo con el formulario.
2. **Detalle del grupo**: renombra, gestiona participantes (incluye tags de pago).
3. **Gastos**: alta manual o **Escanear ticket** (cámara en móvil); filtra por
   participante o fechas; edita o elimina cuando quieras.
4. **Saldos**: revisa pagado/corresponde/saldo y la lista «quién paga a quién».
5. **Cobrar**: Revolut en un tap, copiar número Bizum o compartir el resumen.
6. **Exportar CSV** para Excel cuando necesites la hoja de cálculo.

### Guion de demo (5 minutos, para clase)

1. Home con el grupo semilla y su total animado (0 min).
2. Crear grupo + 3 participantes (0:30).
3. Escanear un ticket real con el móvil o registrar 2 gastos con distinto pagador (1:30).
4. Filtrar por participante y fecha; mostrar el morphing de la lista (2:30).
5. Saldos + liquidación; copiar número Bizum; Compartir → WhatsApp (3:30).
6. Exportar CSV y abrirlo en Excel (4:15).
7. Cierre: algoritmo en céntimos + tests en vivo con `npm test` (5:00).

---

## Escaneo de tickets (OCR)

Desde el detalle del grupo, **Escanear ticket**: foto o imagen → análisis local
→ pantalla de **revisión** (comercio + total editables, % confianza) → el
formulario de gasto se abre ya relleno para una segunda revisión. El OCR nunca
crea gastos solo.

- Motor [tesseract.js](https://github.com/naptha/tesseract.js) 7, modelo en
  español (+ inglés de apoyo). La primera vez descarga los datos de
  entrenamiento (unos MB, luego en caché).
- Heurísticas deterministas y testeadas: comercio = primera línea; total = mayor
  importe en líneas tipo TOTAL/IMPORTE/€ (entiende `1.234,56` y `18.75`).
- Honestidad técnica: tickets limpios van genial; papel arrugado o poca luz
  exigen corrección manual. Por eso la revisión es obligatoria, no opcional.

---

## Cobrar: Revolut, Bizum y compartir

- **Revolut**: cada acreedor guarda su tag una vez; cada fila de liquidación
  muestra **Pagar con Revolut** → `revolut.me/<tag>/<importe>EUR` en pestaña nueva.
- **Bizum**: investigado y documentado — Bizum solo ofrece integración a
  **comercios** (Redsys/TPV); **no existe deep-link P2P para apps de terceros**,
  así que no inventamos ninguno. El flujo óptimo honesto: móvil del acreedor
  (opcional, local) + botón **Copiar número** + guía de 3 pasos en pantalla.
- **Compartir**: texto formateado (`grupo · total · saldos · liquidación`) a la
  hoja nativa del sistema o al portapapeles como fallback.

---

## Estructura del proyecto

```
app/
  layout.tsx              # idioma es, header, proveedor, contenedor
  page.tsx                # home: hero + grupos (timeline GSAP coreografiado)
  groups/[id]/page.tsx    # detalle: participantes, gastos, saldos, liquidación
  globals.css             # sistema de diseño (tokens, glass, botones, focus)
components/
  AppHeader.tsx  EmptyState.tsx  StatCard.tsx  BalanceBar.tsx
  SettlementList.tsx  ExpenseForm.tsx  ExpenseList.tsx  ExpenseFilters.tsx
  GroupForm.tsx  ParticipantList.tsx  ScanTicket.tsx  ShareButton.tsx
  BizumGuide.tsx  Reveal.tsx  AnimatedNumber.tsx  SplitTitle.tsx
lib/
  types.ts  money.ts  settle.ts  csv.ts  share.ts  ocr.ts  paylinks.ts
  motion.ts  storage.ts  seed.ts  store.tsx
lib/__tests__/           # money, settle, csv, ocr, paylinks, share (37 tests)
odd/tasks/               # bitácora de desarrollo por feature (T1–T9, extras)
```

---

## Algoritmo de saldos

1. Todo en **céntimos enteros** (cero errores de redondeo float).
2. **Pagado** = suma de gastos de cada pagador (aunque no esté entre los involucrados).
3. Cada gasto se reparte a partes iguales; los céntimos resto van a los primeros
   involucrados (determinista, testeado).
4. **Neto** = pagado − parte (la suma siempre da cero).
5. **Greedy**: mayor acreedor contra mayor deudor hasta saldar (desempate por id)
   → mínimo de transferencias en la práctica.

Caso canónico (Madrid, 240 €): Pablo +60, Ana +20, Luis −20, Marta −60 →
`Luis → Ana 20 €`, `Marta → Pablo 60 €`. Cubierto por test con comparación
independiente del orden, más casos de reparto parcial, restos (`10 € / 3`),
grupos vacíos y validación de negativos.

---

## Tests

```bash
npm test            # 37 tests, ~200 ms
```

| Suite      | Qué cubre                                                        |
|------------|------------------------------------------------------------------|
| money      | conversión €↔céntimos, formato `es-ES`/EUR, validación           |
| settle     | caso Madrid, subconjuntos, restos deterministas, bordes, errores |
| csv        | secciones, cifras, escapado de `;` y `"`                         |
| ocr        | comercio/total, miles con punto, decimales con punto, sin total  |
| paylinks   | formato revolut.me, céntimos→enlace, tags/teléfonos inválidos    |
| share      | líneas del resumen, variante saldada, decimales con coma         |

---

## Despliegue

**Vercel (recomendado):** importa el repo `Punysh6r/SplitMate` → framework
Next.js → `npm run build`. Sin variables de entorno. HTTPS incluido (activa la
hoja nativa de Compartir en móvil).

**Probar en móvil sin desplegar:** túnel Cloudflare (`cloudflared tunnel --url
http://localhost:3001` con el build en marcha) → URL `https://…` temporal con
HTTPS. Ideal para la demo en clase sin publicar nada.

---

## Privacidad y seguridad

- **Sin backend**: todo vive en `localStorage` de tu navegador. No hay cuentas,
  tracking ni envío de datos a ningún servidor (salvo la descarga inicial del
  modelo OCR y las CDNs del propio navegador).
- **Móviles y tags**: opcionales, editables, borrables y exclusivamente locales.
  La UI lo declara junto a la guía Bizum.
- **Sin dinero real**: la app genera enlaces y textos; ningún pago se ejecuta
  dentro de SplitMate. Sin credenciales bancarias en ningún punto.
- Commits con identidad configurada y escaneo de secretos previo al push.

---

## Limitaciones conocidas

- El OCR local no es infalible (luz, enfoque, papel): siempre con revisión.
- Compartir nativo exige contexto seguro (HTTPS o localhost); si no, copia.
- `localStorage` ≈ 5 MB y es por navegador/dispositivo: sin sincronización
  multi-dispositivo (ver Roadmap).
- Moneda única por grupo (EUR por defecto); sin conversión entre monedas.

---

## Roadmap (v2, no implementado)

Cuentas + backend compartido (un grupo, varios dispositivos) · multi-moneda con
conversión · PayPal.me como tercer rail de cobro · fotos de tickets adjuntas ·
PWA/offline total · gráficos de evolución · modo claro · recordatorios de deuda.

---

## Contribuir

Proyecto de grupo para clase. Flujo sugerido:

1. Rama por feature (`feat/...`, `fix/...`).
2. Cambios pequeños y revisables; tests para toda lógica de `lib/`.
3. `npm test`, `npx tsc --noEmit` y `npm run build` en verde antes del push.
4. Nunca commitear secretos; revisar `.gitignore` ante la duda.

---

## Licencia

Uso académico. Las dependencias pertenecen a sus autores (ver `package.json`):
Next.js, React, Tailwind CSS, GSAP (gratis incluso plugins desde la adquisición
por Webflow) y Tesseract.js (Apache-2.0).
