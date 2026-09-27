const MAX_IMAGE_EDGE = 1080;
const MAX_VIDEO_BYTES = Math.floor(2.4 * 1024 * 1024);
const AVATAR_EDGE = 512;

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Datei konnte nicht gelesen werden."));
    };
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Bild ungültig."));
    img.src = src;
  });
}

async function compressImage(file: File): Promise<string> {
  const raw = await readDataUrl(file);
  const img = await loadImage(raw);
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Bild konnte nicht verarbeitet werden.");
  ctx.drawImage(img, 0, 0, w, h);
  let quality = 0.84;
  let out = canvas.toDataURL("image/jpeg", quality);
  while (out.length > 900_000 && quality > 0.55) {
    quality -= 0.08;
    out = canvas.toDataURL("image/jpeg", quality);
  }
  if (out.length > 1_200_000) {
    throw new Error("Bild ist zu groß. Bitte ein kleineres wählen.");
  }
  return out;
}

export async function fileToAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Bitte ein Foto wählen.");
  const raw = await readDataUrl(file);
  const img = await loadImage(raw);
  const side = Math.min(img.width, img.height);
  if (side < 32) throw new Error("Foto ist zu klein.");
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_EDGE;
  canvas.height = AVATAR_EDGE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Foto konnte nicht verarbeitet werden.");
  ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_EDGE, AVATAR_EDGE);
  let quality = 0.86;
  let out = canvas.toDataURL("image/jpeg", quality);
  while (out.length > 220_000 && quality > 0.55) {
    quality -= 0.08;
    out = canvas.toDataURL("image/jpeg", quality);
  }
  return out;
}

function videoPoster(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;
    const cleanup = () => URL.revokeObjectURL(url);
    video.onloadeddata = () => {
      try {
        const canvas = document.createElement("canvas");
        const w = video.videoWidth || 720;
        const h = video.videoHeight || 1280;
        const scale = Math.min(1, 720 / Math.max(w, h));
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          resolve(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        cleanup();
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      } catch {
        cleanup();
        resolve(null);
      }
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };
  });
}

export async function fileToMedia(file: File): Promise<{
  mediaType: "image" | "video";
  mediaUrl: string;
  posterUrl: string | null;
}> {
  if (file.type.startsWith("video/")) {
    if (file.size > MAX_VIDEO_BYTES) {
      throw new Error("Video max. 2,4 MB für den Feed.");
    }
    const mediaUrl = await readDataUrl(file);
    const posterUrl = await videoPoster(file);
    return { mediaType: "video", mediaUrl, posterUrl };
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Bitte ein Bild oder Video wählen.");
  }
  const mediaUrl = await compressImage(file);
  return { mediaType: "image", mediaUrl, posterUrl: null };
}
