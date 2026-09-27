import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { existsSync } from "node:fs";

const execFileAsync = promisify(execFile);

const BEG = "@@OFFCHAT_ORIGIN_BEG@@";
const END = "@@OFFCHAT_ORIGIN_END@@";

function fieldFor(origin: string, width: number): string {
  const innerW = width - BEG.length - END.length;
  let inner = origin.replace(/\/+$/, "");
  if (inner.length > innerW) inner = inner.slice(0, innerW);
  return BEG + inner.padEnd(innerW, " ") + END;
}

function patchPacked(buf: Buffer, origin: string): Buffer {
  const text = buf.toString("latin1");
  let from = 0;
  let i = -1;
  let j = -1;
  while (from < text.length) {
    const bi = text.indexOf(BEG, from);
    if (bi < 0) break;
    const ej = text.indexOf(END, bi + BEG.length);
    if (ej > bi + BEG.length) {
      i = bi;
      j = ej;
      break;
    }
    from = bi + BEG.length;
  }
  if (i < 0 || j < 0) return buf;
  const width = j + END.length - i;
  const next = fieldFor(origin, width);
  if (next.length !== width) return buf;
  const out = Buffer.from(text, "latin1");
  out.write(next, i, width, "latin1");
  return out;
}

function candidate(kind: "exe" | "apk"): string[] {
  const name = kind === "exe" ? "OFFCHAT.exe" : "OFFCHAT.apk";
  return [
    path.join(process.cwd(), "native/dist", name),
    path.join(process.cwd(), "public/downloads", name),
    `/workspace/native/dist/${name}`,
    `/workspace/public/downloads/${name}`,
  ];
}

export async function readTemplate(kind: "exe" | "apk"): Promise<Buffer> {
  for (const p of candidate(kind)) {
    if (existsSync(p)) return readFile(p);
  }
  throw new Error("missing-native");
}

export function publicOrigin(request: Request): string {
  const xfHost = request.headers.get("x-forwarded-host");
  const xfProto = request.headers.get("x-forwarded-proto") || "https";
  if (xfHost) {
    const host = xfHost.split(",")[0]?.trim();
    if (host && host !== "127.0.0.1" && host !== "localhost") {
      return `${xfProto}://${host}`;
    }
  }
  for (const header of ["origin", "referer"] as const) {
    const raw = request.headers.get(header);
    if (!raw) continue;
    try {
      const u = new URL(raw);
      if (u.hostname !== "127.0.0.1" && u.hostname !== "localhost") return u.origin;
    } catch {
      /* ignore */
    }
  }
  try {
    const u = new URL(request.url);
    if (u.hostname !== "127.0.0.1" && u.hostname !== "localhost") return u.origin;
  } catch {
    /* ignore */
  }
  return "";
}

export async function packNative(
  kind: "exe" | "apk",
  origin: string,
): Promise<{ bytes: Buffer; filename: string; type: string }> {
  const raw = await readTemplate(kind);
  if (kind === "exe") {
    return {
      bytes: origin ? patchPacked(raw, origin) : raw,
      filename: "OFFCHAT.exe",
      type: "application/vnd.microsoft.portable-executable",
    };
  }
  return {
    bytes: origin ? await patchApk(raw, origin) : raw,
    filename: "OFFCHAT.apk",
    type: "application/vnd.android.package-archive",
  };
}

async function patchApk(raw: Buffer, origin: string): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "offchat-apk-"));
  const inFile = path.join(dir, "in.apk");
  const outFile = path.join(dir, "out.apk");
  const py = path.join(dir, "patch.py");
  try {
    await writeFile(inFile, raw);
    await writeFile(
      py,
      `
import zipfile, shutil, sys
src, dst, origin = sys.argv[1], sys.argv[2], sys.argv[3]
BEG, END = "@@OFFCHAT_ORIGIN_BEG@@", "@@OFFCHAT_ORIGIN_END@@"
shutil.copyfile(src, dst)
with zipfile.ZipFile(src, "r") as zin, zipfile.ZipFile(dst, "w") as zout:
    for info in zin.infolist():
        data = zin.read(info.filename)
        if info.filename.startswith("META-INF/") and info.filename.upper().endswith((".SF", ".RSA", ".DSA", ".EC", ".MF")):
            continue
        if info.filename == "assets/start_url.txt":
            text = data.decode("latin1")
            i, j = text.find(BEG), text.find(END)
            if i >= 0 and j > i:
                width = j + len(END) - i
                inner_w = width - len(BEG) - len(END)
                inner = origin.rstrip("/")[:inner_w].ljust(inner_w)
                text = text[:i] + BEG + inner + END + text[i+width:]
                data = text.encode("latin1")
        zout.writestr(info, data)
`,
    );
    await execFileAsync("python3", [py, inFile, outFile, origin]);
    const unsigned = await readFile(outFile);
    return await signApk(unsigned);
  } catch {
    return raw;
  } finally {
    await unlink(inFile).catch(() => undefined);
    await unlink(outFile).catch(() => undefined);
    await unlink(py).catch(() => undefined);
  }
}

async function signApk(unsigned: Buffer): Promise<Buffer> {
  const keystore = [
    path.join(process.cwd(), "native/android/app/offchat.keystore"),
    "/workspace/native/android/app/offchat.keystore",
  ].find((p) => existsSync(p));
  const apksigner = [
    "/workspace/.native/android-sdk/build-tools/34.0.0/apksigner",
    path.join(process.cwd(), ".native/android-sdk/build-tools/34.0.0/apksigner"),
  ].find((p) => existsSync(p));
  if (!keystore || !apksigner) return unsigned;
  const dir = await mkdtemp(path.join(tmpdir(), "offchat-sign-"));
  const inFile = path.join(dir, "in.apk");
  const signed = path.join(dir, "out.apk");
  try {
    await writeFile(inFile, unsigned);
    await execFileAsync(apksigner, [
      "sign",
      "--ks",
      keystore,
      "--ks-key-alias",
      "offchat",
      "--ks-pass",
      "pass:offchat1",
      "--key-pass",
      "pass:offchat1",
      "--out",
      signed,
      inFile,
    ]);
    return await readFile(signed);
  } catch {
    return unsigned;
  } finally {
    await unlink(inFile).catch(() => undefined);
    await unlink(signed).catch(() => undefined);
  }
}
