import { peerIdFromUser } from "./offline";

export type LanNet = { id: string; label: string };

const CACHE_KEY = "offx-lan-net";
const CODE_KEY = "offx-lan-code";
const SOLO_KEY = "offx-lan-solo";
const BT_KEY = "offx-bt-code";

function roomSafe(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "local";
}

function shortHash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function isLoopback(ip: string): boolean {
  return ip === "::1" || ip.startsWith("127.");
}

function subnetOf(ip: string): string | null {
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!v4) return null;
  return `${v4[1]}.${v4[2]}.${v4[3]}`;
}

function isPrivateV4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return false;
  const [a, b] = p as [number, number];
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

type IceHit = { ip: string; typ: string };

function parseIce(cand: string): IceHit | null {
  const typ = cand.match(/\btyp\s+(\w+)/)?.[1];
  if (!typ) return null;
  const v4 = cand.match(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/)?.[1];
  if (v4 && !isLoopback(v4)) return { ip: v4, typ };
  return null;
}

async function gatherIce(timeoutMs: number): Promise<{ host: string | null; srflx: string | null }> {
  if (typeof RTCPeerConnection === "undefined") {
    return { host: null, srflx: null };
  }
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }],
  });
  try {
    pc.createDataChannel("lan");
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return await new Promise((resolve) => {
      let host: string | null = null;
      let srflx: string | null = null;
      const done = () => resolve({ host, srflx });
      const timer = window.setTimeout(done, timeoutMs);
      pc.onicecandidate = (ev) => {
        const raw = ev.candidate?.candidate ?? "";
        const hit = raw ? parseIce(raw) : null;
        if (hit?.typ === "host" && isPrivateV4(hit.ip) && !host) host = hit.ip;
        if (hit?.typ === "srflx" && !isPrivateV4(hit.ip) && !srflx) srflx = hit.ip;
        if (host && srflx) {
          window.clearTimeout(timer);
          done();
        }
        if (!ev.candidate) {
          window.clearTimeout(timer);
          done();
        }
      };
    });
  } catch {
    return { host: null, srflx: null };
  } finally {
    pc.close();
  }
}

function connectionType(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  const c = (navigator as Navigator & { connection?: { type?: string } }).connection;
  return c?.type;
}

function soloNet(): LanNet {
  if (typeof localStorage === "undefined") {
    return { id: "lan-solo", label: "Kein WLAN" };
  }
  let token = localStorage.getItem(SOLO_KEY);
  if (!token) {
    token = shortHash(crypto.randomUUID());
    localStorage.setItem(SOLO_KEY, token);
  }
  return { id: `lan-solo-${roomSafe(token)}`, label: "Kein WLAN" };
}

function fromHits(host: string | null, srflx: string | null): LanNet {
  const subnet = host ? subnetOf(host) : null;
  if (srflx) {
    return {
      id: `lan-wan-${roomSafe(shortHash(srflx))}`,
      label: subnet ? `Netz ${subnet}.x` : "Dieses WLAN",
    };
  }
  if (subnet) {
    return {
      id: `lan-${roomSafe(subnet.replace(/\./g, "-"))}`,
      label: `Netz ${subnet}.x`,
    };
  }
  return { id: "lan-local", label: "Lokales Netz" };
}

/** Fingerprint this Wi-Fi: same NAT ≈ same café / WG / office. */
export async function detectLanNet(): Promise<LanNet> {
  if (connectionType() === "cellular") return soloNet();
  const { host, srflx } = await gatherIce(2200);
  if (!host && !srflx) {
    if (connectionType() === "cellular") return soloNet();
    return { id: "lan-local", label: "Lokales Netz" };
  }
  const net = fromHits(host, srflx);
  writeCachedLanNet(net);
  return net;
}

function storage(): Storage | null {
  if (typeof localStorage !== "undefined") return localStorage;
  if (typeof sessionStorage !== "undefined") return sessionStorage;
  return null;
}

export function readCachedLanNet(): LanNet | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LanNet;
    if (!parsed?.id || !parsed.label) return null;
    return { id: String(parsed.id).slice(0, 64), label: String(parsed.label).slice(0, 48) };
  } catch {
    return null;
  }
}

export function writeCachedLanNet(net: LanNet): void {
  storage()?.setItem(CACHE_KEY, JSON.stringify(net));
}

export function lanPeerId(userId: string): string {
  return peerIdFromUser(userId);
}

export function lanConvId(a: string, b: string): string {
  const [x, y] = a < b ? [a, b] : [b, a];
  return `c-${roomSafe(x).slice(0, 22)}${roomSafe(y).slice(0, 22)}`.slice(0, 64);
}

export function setForcedLanCode(code: string | null) {
  const store = storage();
  if (!store) return;
  if (!code) store.removeItem(CODE_KEY);
  else store.setItem(CODE_KEY, code);
}

export function forcedLanNet(): LanNet | null {
  const store = storage();
  if (!store) return null;
  const code = store.getItem(CODE_KEY);
  if (!code || !/^[A-HJ-NP-Z2-9]{4}$/.test(code)) return null;
  return { id: `lan-${code}`, label: `Raum ${code}` };
}

export function readOnlineCode(): string | null {
  const store = storage();
  const code = store?.getItem(CODE_KEY);
  return code && /^[A-HJ-NP-Z2-9]{4}$/.test(code) ? code : null;
}

function makePairCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const buf = new Uint32Array(4);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 4; i += 1) out += alphabet[buf[i]! % alphabet.length];
  return out;
}

export function readBtCode(): string | null {
  const code = storage()?.getItem(BT_KEY);
  return code && /^[A-HJ-NP-Z2-9]{4}$/.test(code) ? code : null;
}

export function setBtCode(code: string | null) {
  const store = storage();
  if (!store) return;
  if (!code) store.removeItem(BT_KEY);
  else store.setItem(BT_KEY, code);
}

export function bluetoothNet(): LanNet {
  let code = readBtCode();
  if (!code) {
    code = makePairCode();
    setBtCode(code);
  }
  return { id: `bt-${code}`, label: `BT ${code}` };
}
