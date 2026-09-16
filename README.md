# SplitMate — Divide gastos sin dramas

Aplicación web para dividir gastos entre amigos, compañeros de piso y grupos de viaje.
Crea grupos, registra gastos, consulta saldos, descubre quién debe pagar a quién y exporta el resumen en CSV.

Sin IA de pago, sin pagos reales, sin datos bancarios: toda la lógica es código determinista y los datos viven en tu navegador (`localStorage`).

## Funcionalidades (MVP)

- **Grupos**: crear, renombrar, eliminar; añadir/quitar participantes.
- **Gastos**: descripción, cantidad (acepta coma decimal: `12,50`), pagador, involucrados, fecha. Crear, editar, eliminar.
- **Filtros**: por participante y por rango de fechas.
- **Saldos**: total, pagado/corresponde/saldo por persona y plan de liquidación con el mínimo de transferencias.
- **Exportación**: resumen del grupo en CSV (separado por `;`, abre directo en Excel en español).
- **Diseño**: fintech oscuro, responsive móvil/escritorio, animaciones GSAP con respeto a `prefers-reduced-motion`.

## Tecnologías

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · GSAP (+ @gsap/react) · Vitest · persistencia en `localStorage` (`splitmate:v1`).

## Requisitos

Node.js 20+ (recomendado 22/24) y npm.

## Instalación y ejecución

```bash
npm ci          # instalación limpia desde el lockfile
npm run dev     # desarrollo en http://localhost:3000
npm run build   # build de producción
npm start       # servir el build (tras npm run build)
npm test        # tests unitarios (vitest)
npm run lint    # eslint
```

## Datos de ejemplo

En el primer arranque se carga el grupo **Viaje a Madrid** (Pablo, Ana, Luis, Marta + 3 gastos). Para resetear: borra el almacenamiento del sitio en el navegador (clave `splitmate:v1`) y recarga.

## Guion de demo (5 minutos)

1. Home: muestra el grupo semilla con su total.
2. Crea un grupo nuevo y añade 3 participantes.
3. Registra 2 gastos con distinto pagador e involucrados parciales.
4. Abre el detalle: filtra por participante y por fecha.
5. Sección Saldos: explica pagado/corresponde/saldo y la lista «quién paga a quién».
6. Pulsa Exportar y abre el CSV en Excel.
7. Edita un gasto y muestra cómo se recalcula todo al instante.
8. Redimensiona a móvil: todo apilado y usable.

## Estructura

```
app/                  # layout, home, groups/[id] (client components)
components/           # StatCard, GroupForm, ParticipantList, ExpenseForm,
                      # ExpenseList, ExpenseFilters, BalanceBar,
                      # SettlementList, Reveal (animación GSAP)
lib/                  # types, money (céntimos), settle (algoritmo),
                      # csv, storage (localStorage), seed, store (React)
lib/__tests__/        # 16 tests vitest (money, settle, csv)
```

## Algoritmo de saldos

1. Todo el dinero en **céntimos enteros** (cero errores de redondeo float).
2. Pagado = suma de gastos de cada pagador (aunque no esté entre los involucrados).
3. Cada gasto se reparte a partes iguales; los céntimos resto van a los primeros involucrados (determinista).
4. Neto = pagado − parte (la suma siempre da cero).
5. Greedy: el mayor acreedor contra el mayor deudor hasta saldar (desempate por id). Mínimo de transferencias en la práctica.

Caso Madrid: total 240 € → Pablo +60, Ana +20, Luis −20, Marta −60 → Luis→Ana 20 €, Marta→Pablo 60 € (cubierto por test).

## Despliegue

Vercel: importa el repo, framework Next.js, `npm run build` (salida estándar). No requiere variables de entorno.

## Mejoras futuras (v2, no implementadas)

Cuentas de usuario + backend compartido (un grupo, varios dispositivos) · multi-moneda con conversión · pagos Bizum enlazados (sin mover dinero real desde la app) · fotos de tickets · PWA/offline · gráficos de evolución · modo claro.

## Escaneo de tickets (OCR)

Desde el detalle del grupo, **Escanear ticket** abre el escáner: haz una foto
(o sube una imagen) del ticket, se analiza en local con
[tesseract.js](https://github.com/naptha/tesseract.js) y obtienes una pantalla
de revisión con el comercio y el total detectados (editables). Al confirmar,
se abre el formulario normal de gasto ya relleno para una segunda revisión.

- 100 % local y gratis: sin claves, sin cuentas, sin coste.
- Modelo en español (+ inglés de apoyo). La primera vez se descargan los datos
  de entrenamiento (unos MB) y puede tardar un poco; después quedan en caché
  del navegador.
- La precisión no es del 100 % (depende de la luz, el enfoque y el papel):
  revisa siempre los datos antes de guardar.

## Licencia

Uso académico. Las dependencias pertenecen a sus autores (ver `package.json`).
