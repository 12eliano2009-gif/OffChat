import {
  bluetoothNet,
  detectLanNet,
  forcedLanNet,
  setForcedLanCode,
  type LanNet,
} from "./lan";
import { randomWlanCode } from "./offline";

export type ConnMode = "local" | "online" | "bluetooth";

export async function netForMode(mode: ConnMode): Promise<LanNet> {
  if (mode === "online") {
    const existing = forcedLanNet();
    if (existing) return existing;
    setForcedLanCode(randomWlanCode());
    return forcedLanNet() ?? { id: "lan-online", label: "Online" };
  }
  if (mode === "bluetooth") {
    return bluetoothNet();
  }
  return detectLanNet();
}
