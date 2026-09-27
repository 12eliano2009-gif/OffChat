const STAY_KEY = "offchat-stay";
const INTENT_KEY = "offchat-stay-intent";
const ATTEMPT_KEY = "offchat-stay-attempt";
const SESSION_LIVE = "offchat-session-live";
const COOKIE = "offchat-ephemeral";
const BEARER_SESSION = "grok-auth.bearer-token";
const BEARER_STORE = "offchat-bearer";

function hasEphemeralCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => part.trim() === `${COOKIE}=1`);
}

/** Remember the checkbox across the OAuth redirect. Call before leaving the page. */
export function noteStayIntent(stay: boolean): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(INTENT_KEY, stay ? "1" : "0");
  } catch {
    /* private mode */
  }
  applyStayChoice(stay);
}

/** Persist "Angemeldet bleiben" or a browser-session marker. */
export function applyStayChoice(stay: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (stay) localStorage.setItem(STAY_KEY, "1");
    else localStorage.removeItem(STAY_KEY);
  } catch {
    /* storage blocked */
  }
  if (stay) {
    document.cookie = `${COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    try {
      sessionStorage.removeItem(SESSION_LIVE);
      const token = sessionStorage.getItem(BEARER_SESSION);
      if (token) localStorage.setItem(BEARER_STORE, token);
    } catch {
      /* ignore */
    }
  } else {
    document.cookie = `${COOKIE}=1; Path=/; SameSite=Lax`;
    try {
      sessionStorage.setItem(SESSION_LIVE, "1");
      localStorage.removeItem(BEARER_STORE);
    } catch {
      /* ignore */
    }
  }
}

/** Keep the preview bearer across browser restarts only when stay is on. */
export function persistBearer(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token && localStorage.getItem(STAY_KEY) === "1") localStorage.setItem(BEARER_STORE, token);
    else localStorage.removeItem(BEARER_STORE);
  } catch {
    /* ignore */
  }
}

/** Restore a remembered preview session before the auth client reads it. */
export function restoreStayBearer(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(STAY_KEY) !== "1") return;
    const saved = localStorage.getItem(BEARER_STORE);
    if (!saved || sessionStorage.getItem(BEARER_SESSION)) return;
    sessionStorage.setItem(BEARER_SESSION, saved);
  } catch {
    /* ignore */
  }
}

/** Explicit sign-out: next open must sign in again, even if stay was checked. */
export function forgetStay(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STAY_KEY);
    localStorage.removeItem(BEARER_STORE);
    sessionStorage.removeItem(INTENT_KEY);
    sessionStorage.removeItem(SESSION_LIVE);
  } catch {
    /* ignore */
  }
}

/**
 * True when this browser start has neither "stay signed in" nor a live
 * session cookie — the visitor must sign in again.
 */
export function shouldEndEphemeralSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(STAY_KEY) === "1") return false;
  } catch {
    return false;
  }
  if (hasEphemeralCookie()) return false;
  try {
    if (sessionStorage.getItem(SESSION_LIVE) === "1") return false;
  } catch {
    return false;
  }
  return true;
}

/** Apply a pending OAuth choice, then report whether a leftover session should end. */
export function consumeStayOnBoot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const intent = sessionStorage.getItem(INTENT_KEY);
    if (intent === "1" || intent === "0") {
      applyStayChoice(intent === "1");
      sessionStorage.removeItem(INTENT_KEY);
    }
    if (!shouldEndEphemeralSession()) return false;
    if (sessionStorage.getItem(ATTEMPT_KEY) === "1") return false;
    sessionStorage.setItem(ATTEMPT_KEY, "1");
    return true;
  } catch {
    return false;
  }
}
