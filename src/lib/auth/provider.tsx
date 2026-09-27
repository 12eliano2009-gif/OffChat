import { useEffect, type ReactNode } from "react";
import { authClient, signOut } from "./client";
import { consumeStayOnBoot } from "./stay";

/**
 * App-wide client provider mounted once near the root (in `src/routes/__root.tsx`).
 * Also ends sessions that were not marked "Angemeldet bleiben" once the browser
 * session cookie is gone — so the next visit has to sign in again.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!consumeStayOnBoot()) return;
    void (async () => {
      try {
        const { data } = await authClient.getSession();
        if (!data?.user) return;
        await signOut("/login");
      } catch {
        /* still signed in — don't reload-loop */
      }
    })();
  }, []);
  return <>{children}</>;
}
