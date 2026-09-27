import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bluetooth,
  Globe,
  House,
  MessageCircle,
  PlusSquare,
  Settings,
  UserRound,
  Wifi,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useT, useSettings } from "@/lib/offx/settings";
import { OffxLockup, OffxMark } from "./logo";
import { InstallButton } from "./install";
import { useLan } from "./lan-provider";

function useNav() {
  const t = useT();
  return [
    { to: "/", label: t("nav.feed"), icon: House, exact: true },
    { to: "/messages", label: t("nav.chats"), icon: MessageCircle, exact: false },
    { to: "/create", label: t("nav.new"), icon: PlusSquare, exact: true },
    { to: "/online", label: t("nav.online"), icon: Globe, exact: true },
    { to: "/profile", label: t("nav.profile"), icon: UserRound, exact: true },
  ] as const;
}

function isActive(pathname: string, to: string, exact: boolean) {
  if (exact) return pathname === to;
  if (to === "/messages") return pathname === "/messages" || pathname.startsWith("/c/");
  return pathname === to || pathname.startsWith(`${to}/`);
}

function LanChip() {
  const lan = useLan();
  const { mode, t } = useSettings();
  const here = lan.people.length;
  const Icon = mode === "bluetooth" ? Bluetooth : mode === "online" ? Globe : Wifi;
  const label =
    lan.net?.label ??
    (mode === "bluetooth" ? t("lan.bluetooth") : mode === "online" ? t("lan.online") : t("lan.local"));
  return (
    <span className="inline-flex max-w-[46vw] items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1 text-[11px] text-muted lg:max-w-[70vw]">
      <Icon className="size-3.5 shrink-0 text-fg" />
      <span className="truncate">{label}</span>
      <span className="text-faint">·</span>
      <span className="shrink-0 tabular-nums">
        {here === 0 ? t("lan.onlyYou") : t("lan.here", { n: here })}
      </span>
    </span>
  );
}

export function AppFrame({
  children,
  hideChrome = false,
}: {
  children: ReactNode;
  hideChrome?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNav();
  const t = useT();

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-bg px-4 py-6 lg:flex">
        <Link to="/" className="mb-2 px-2">
          <OffxLockup />
        </Link>
        <p className="mb-6 px-2">
          <LanChip />
        </p>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = isActive(pathname, item.to, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
                  active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated hover:text-fg",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            );
          })}
          <Link
            to="/settings"
            className={cn(
              "flex h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
              pathname === "/settings" ? "bg-elevated text-fg" : "text-muted hover:bg-elevated hover:text-fg",
            )}
          >
            <Settings className="size-5" strokeWidth={pathname === "/settings" ? 2.2 : 1.8} />
            {t("nav.settings")}
          </Link>
        </nav>
        <div className="px-0 pt-4">
          <InstallButton compact />
        </div>
      </aside>

      {!hideChrome && (
        <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur lg:hidden">
          <div className="flex h-12 items-center justify-between gap-3 px-4">
            <Link to="/" className="flex items-center gap-2">
              <OffxMark className="h-5 w-6" />
              <span className="font-display text-base tracking-[0.12em]">OFFCHAT</span>
            </Link>
            <div className="flex items-center gap-1">
              <LanChip />
              <Link
                to="/settings"
                className="grid size-11 place-items-center text-muted"
                aria-label={t("nav.settings")}
              >
                <Settings className="size-5" />
              </Link>
            </div>
          </div>
        </header>
      )}

      <div className="lg:pl-60">{children}</div>

      {!hideChrome && (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 backdrop-blur lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {nav.map((item) => {
              const active = isActive(pathname, item.to, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                    active ? "text-fg" : "text-muted",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
