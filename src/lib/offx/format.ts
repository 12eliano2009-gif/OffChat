export const NOX_CODE = "NOX";
export const NOX_CUT = 0.3;
export const TREASURY_ID = "offx-treasury";

export function toMoney(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

export function splitNox(amount: string | number): { gross: string; net: string; fee: string } {
  const n = typeof amount === "number" ? amount : Number(amount);
  const cents = Math.round((Number.isFinite(n) ? n : 0) * 100);
  const feeCents = Math.round(cents * NOX_CUT);
  const netCents = Math.max(0, cents - feeCents);
  return {
    gross: (cents / 100).toFixed(2),
    fee: (feeCents / 100).toFixed(2),
    net: (netCents / 100).toFixed(2),
  };
}

export function formatNox(amount: string | number): string {
  const n = typeof amount === "number" ? amount : Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  const formatted = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: Number.isInteger(safe) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(safe);
  return `${formatted} ${NOX_CODE}`;
}

export function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return value;
  return new Date().toISOString();
}

export function toInt(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

export function toBool(value: unknown): boolean {
  return value === true || value === "t" || value === "true" || value === 1;
}

export function relTime(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  if (!Number.isFinite(then)) return "";
  const min = Math.max(0, Math.floor((Date.now() - then) / 60000));
  if (min < 1) return "jetzt";
  if (min < 60) return `${min} Min.`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} T.`;
  return new Date(isoDate).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  });
}

export function parseAmount(raw: string): string {
  const n = Number(String(raw).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 1 || n > 10000) {
    throw new Error("Betrag muss zwischen 1 und 10.000 NOX liegen.");
  }
  return n.toFixed(2);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "O";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function hueStyle(hue: number): { background: string; color: string } {
  const h = ((hue % 360) + 360) % 360;
  return {
    background: `hsl(${h} 18% 22%)`,
    color: `hsl(${h} 32% 86%)`,
  };
}
