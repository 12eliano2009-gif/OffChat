/** 10 NOX = 0,99 €. Larger packs take a light volume discount. */
export type NoxPack = {
  id: string;
  nox: number;
  euro: number;
  savePct: number;
};

export const NOX_PACKS: readonly NoxPack[] = [
  { id: "10", nox: 10, euro: 0.99, savePct: 0 },
  { id: "25", nox: 25, euro: 2.19, savePct: 12 },
  { id: "50", nox: 50, euro: 3.99, savePct: 19 },
  { id: "100", nox: 100, euro: 6.99, savePct: 29 },
  { id: "250", nox: 250, euro: 14.99, savePct: 39 },
];

export function packById(id: string): NoxPack | null {
  return NOX_PACKS.find((p) => p.id === id) ?? null;
}

export function formatEuro(amount: string | number): string {
  const n = typeof amount === "number" ? amount : Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(safe);
}

export function unitPrice(pack: NoxPack): string {
  return formatEuro(pack.euro / pack.nox);
}
