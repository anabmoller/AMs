// ============================================================
// CurrencyDisplay — Reusable currency flag + badge components
// Supports: CurrencyFlag, CurrencyBadge, CurrencyPair, ExchangeRate
// ============================================================

// ---- Currency Map (ISO 4217 → metadata) ----
const CURRENCY_MAP = {
  USD: { code: "USD", symbol: "$",  flag: "🇺🇸", label: "Dólar",   locale: "en-US" },
  PYG: { code: "PYG", symbol: "₲",  flag: "🇵🇾", label: "Guaraní", locale: "es-PY" },
  BRL: { code: "BRL", symbol: "R$", flag: "🇧🇷", label: "Real",    locale: "pt-BR" },
  ARS: { code: "ARS", symbol: "$",  flag: "🇦🇷", label: "Peso",    locale: "es-AR" },
  EUR: { code: "EUR", symbol: "€",  flag: "🇪🇺", label: "Euro",    locale: "de-DE" },
};

// Aliases (Gs → PYG, etc.)
const ALIASES = { GS: "PYG", GUARANI: "PYG", GUARANIES: "PYG", DOLAR: "USD", DOLLAR: "USD" };

/**
 * Resolve a currency string to its map entry.
 * Handles: "USD", "PYG", "Gs", "Gs.", "gs", etc.
 */
export function resolveCurrency(input) {
  if (!input) return null;
  const key = String(input).toUpperCase().replace(/[.\s]/g, "");
  return CURRENCY_MAP[key] || CURRENCY_MAP[ALIASES[key]] || null;
}

/** Export map for external use */
export { CURRENCY_MAP };

// ---- Sizes ----
const SIZES = {
  xs: "text-[12px] leading-none",
  sm: "text-[14px] leading-none",
  md: "text-[16px] leading-none",
  lg: "text-[20px] leading-none",
};

// ============================================================
// CurrencyFlag — Just the flag emoji, vertically aligned
// Usage: <CurrencyFlag currency="USD" />
//        <CurrencyFlag currency="Gs" size="lg" />
// ============================================================
export function CurrencyFlag({ currency, size = "sm", className = "" }) {
  const c = resolveCurrency(currency);
  if (!c) return null;
  return (
    <span
      className={`inline-flex items-center justify-center select-none ${SIZES[size] || SIZES.sm} ${className}`}
      role="img"
      aria-label={`Bandera ${c.label}`}
      title={`${c.code} — ${c.label}`}
    >
      {c.flag}
    </span>
  );
}

// ============================================================
// CurrencyBadge — Flag + currency code in a pill
// Usage: <CurrencyBadge currency="USD" />
//        <CurrencyBadge currency="PYG" variant="subtle" />
// ============================================================
export function CurrencyBadge({ currency, size = "sm", variant = "default", className = "" }) {
  const c = resolveCurrency(currency);
  if (!c) return null;

  const variants = {
    default: "bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300",
    subtle:  "bg-transparent text-slate-600 dark:text-slate-400",
    gold:    "bg-[#C8A03A]/[0.08] text-[#C8A03A]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold whitespace-nowrap ${
        SIZES[size] || SIZES.sm
      } ${variants[variant] || variants.default} ${className}`}
    >
      <span className="select-none" role="img" aria-label={c.label}>{c.flag}</span>
      <span className="text-[0.85em] tracking-wide">{c.code}</span>
    </span>
  );
}

// ============================================================
// CurrencyPair — Two flags with arrow: 🇺🇸 USD → 🇵🇾 PYG
// Usage: <CurrencyPair from="USD" to="PYG" />
// ============================================================
export function CurrencyPair({ from, to, size = "sm", showCodes = true, className = "" }) {
  const fromC = resolveCurrency(from);
  const toC = resolveCurrency(to);
  if (!fromC || !toC) return null;

  return (
    <span className={`inline-flex items-center gap-1 ${SIZES[size] || SIZES.sm} ${className}`}>
      <span className="select-none" role="img" aria-label={fromC.label}>{fromC.flag}</span>
      {showCodes && <span className="font-semibold text-slate-700 dark:text-slate-300 text-[0.85em]">{fromC.code}</span>}
      <span className="text-slate-400 dark:text-slate-500 text-[0.75em] mx-0.5">→</span>
      <span className="select-none" role="img" aria-label={toC.label}>{toC.flag}</span>
      {showCodes && <span className="font-semibold text-slate-700 dark:text-slate-300 text-[0.85em]">{toC.code}</span>}
    </span>
  );
}

// ============================================================
// ExchangeRate — Full rate display: 🇺🇸 1 USD = 🇵🇾 Gs 7.800
// Usage: <ExchangeRate from="USD" to="PYG" rate={7800} />
//        <ExchangeRate from="USD" to="PYG" rate={7800} compact />
// ============================================================
export function ExchangeRate({ from, to, rate, compact = false, live, className = "" }) {
  const fromC = resolveCurrency(from);
  const toC = resolveCurrency(to);
  if (!fromC || !toC || !rate) return null;

  const formatted = Number(rate).toLocaleString(toC.locale || "es-PY");

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 ${className}`}>
        TC: {fromC.flag} 1 {fromC.code} = {toC.flag} {toC.symbol} {formatted}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 ${className}`}>
      {live != null && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${live ? 'bg-green-500' : 'bg-slate-400 dark:bg-slate-500'}`} />
      )}
      <span className="select-none">{fromC.flag}</span>
      <span className="font-semibold text-slate-600 dark:text-slate-300">{fromC.code}</span>
      <span className="text-slate-400 dark:text-slate-500">→</span>
      <span className="select-none">{toC.flag}</span>
      <span className="font-semibold text-slate-600 dark:text-slate-300">{toC.code}</span>
      <span className="text-slate-400 dark:text-slate-500">·</span>
      <span>{formatted}</span>
      {live != null && (
        <span className="text-[9px]">{live ? "(live)" : "(offline)"}</span>
      )}
    </span>
  );
}

// ============================================================
// CurrencyAmount — Flag + formatted amount
// Usage: <CurrencyAmount currency="PYG" amount={213650000} />
//        <CurrencyAmount currency="USD" amount={27388} size="xs" />
// ============================================================
export function CurrencyAmount({ currency, amount, size = "sm", className = "" }) {
  const c = resolveCurrency(currency);
  if (!c || amount == null) return null;

  const formatted = Math.round(amount).toLocaleString(c.locale || "es-PY");

  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap ${SIZES[size] || SIZES.sm} ${className}`}>
      <span className="select-none text-[0.9em]">{c.flag}</span>
      <span>{c.symbol} {formatted}</span>
    </span>
  );
}
