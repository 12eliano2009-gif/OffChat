export type BtScanResult = { name: string; id: string };

type BtDevice = { name?: string; id: string };
type BtNavigator = Navigator & {
  bluetooth?: {
    getAvailability: () => Promise<boolean>;
    requestDevice: (opts: {
      filters?: { namePrefix?: string; name?: string }[];
      acceptAllDevices?: boolean;
    }) => Promise<BtDevice>;
  };
};

export async function bluetoothAvailable(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const bt = (navigator as BtNavigator).bluetooth;
  if (!bt) return false;
  try {
    return await bt.getAvailability();
  } catch {
    return true;
  }
}

export async function scanOffchatDevice(): Promise<BtScanResult | null> {
  const bt = (navigator as BtNavigator).bluetooth;
  if (!bt) throw new Error("no-bt");
  const device = await bt.requestDevice({
    filters: [{ namePrefix: "OFFCHAT" }],
  });
  return { name: device.name || "OFFCHAT", id: device.id };
}

export function codeFromDeviceName(name: string): string | null {
  const m = name.toUpperCase().match(/OFFCHAT[\s_-]*([A-HJ-NP-Z2-9]{4})/);
  return m?.[1] ?? null;
}
