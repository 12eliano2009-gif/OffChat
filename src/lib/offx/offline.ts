import { useEffect, useState } from "react";

const DB_NAME = "offx";
const STORE = "kv";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheSet(key: string, value: unknown): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ v: value, t: Date.now() }, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* private mode / quota */
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openDb();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => {
        const row = req.result as { v: T } | undefined;
        resolve(row ? row.v : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export function assertOnline(): void {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("Dafür brauchst du Internet.");
  }
}

export const WLAN_CODE_RE = /^[A-HJ-NP-Z2-9]{4}$/;

export function randomWlanCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const buf = new Uint32Array(4);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 4; i += 1) out += alphabet[buf[i]! % alphabet.length];
  return out;
}

export function peerIdFromUser(userId: string): string {
  const clean = userId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
  return clean || `p-${Math.random().toString(36).slice(2, 10)}`;
}
