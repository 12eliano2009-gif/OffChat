/** Client-side card checks. Full PAN never leaves the device. */

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function luhnOk(num: string): boolean {
  const d = digitsOnly(num);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i -= 1) {
    let n = Number(d[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function cardBrand(num: string): "visa" | "mastercard" | "amex" | "card" {
  const d = digitsOnly(num);
  if (/^4/.test(d)) return "visa";
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return "mastercard";
  if (/^3[47]/.test(d)) return "amex";
  return "card";
}

export function formatCardNumber(raw: string): string {
  const d = digitsOnly(raw).slice(0, 19);
  if (cardBrand(d) === "amex") {
    return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(" ");
  }
  return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function parseExpiry(raw: string): { month: number; year: number } | null {
  const d = digitsOnly(raw).slice(0, 4);
  if (d.length < 4) return null;
  const month = Number(d.slice(0, 2));
  const year = 2000 + Number(d.slice(2, 4));
  if (month < 1 || month > 12) return null;
  return { month, year };
}

export function expiryOk(month: number, year: number): boolean {
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const ym = now.getFullYear() * 12 + now.getMonth();
  return year * 12 + (month - 1) >= ym;
}

export function formatExpiry(raw: string): string {
  const d = digitsOnly(raw).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)} / ${d.slice(2)}`;
}

export type CardCharge = {
  holder: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
};

export function readCardForm(input: {
  holder: string;
  number: string;
  expiry: string;
  cvc: string;
}): CardCharge {
  const holder = input.holder.trim().replace(/\s+/g, " ");
  if (holder.length < 3) throw new Error("Name auf der Karte fehlt.");
  const number = digitsOnly(input.number);
  if (!luhnOk(number)) throw new Error("Kartennummer ist ungültig.");
  const brand = cardBrand(number);
  const needCvc = brand === "amex" ? 4 : 3;
  const cvc = digitsOnly(input.cvc);
  if (cvc.length !== needCvc) throw new Error("Prüfnummer (CVC) ist ungültig.");
  const exp = parseExpiry(input.expiry);
  if (!exp || !expiryOk(exp.month, exp.year)) {
    throw new Error("Ablaufdatum ist ungültig.");
  }
  return {
    holder: holder.slice(0, 48),
    last4: number.slice(-4),
    brand,
    expMonth: exp.month,
    expYear: exp.year,
  };
}
