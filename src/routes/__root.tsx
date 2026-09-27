import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { PwaBoot } from "@/components/offx/install";
import { SettingsProvider, useSettings } from "@/lib/offx/settings";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const APP_NAME = "OFFCHAT";

const fetchSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const u = await getSessionUser();
  return u ? { id: u.id, email: u.email } : null;
});

export const Route = createRootRoute({
  beforeLoad: async () => ({ sessionUser: await fetchSessionUser() }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#111113" },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
      { name: "mobile-web-app-capable", content: "yes" },
      {
        name: "description",
        content: "OFFCHAT — Social Media im lokalen Netz. Feed, Chat, Posts. Internet nur für NOX.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Oswald:wght@500;600&family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans+SC:wght@400;500;700&display=swap",
      },
    ],
  }),
  component: Root,
});

function Root() {
  return (
    <html lang="de" className="dark antialiased">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=JSON.parse(localStorage.getItem("offchat-settings")||"{}");var t=s.theme==="light"?"light":"dark";var l=s.locale||"de";document.documentElement.classList.toggle("light",t==="light");document.documentElement.classList.toggle("dark",t!=="light");document.documentElement.lang=l==="zh"?"zh-Hans":l;}catch(e){}`,
          }}
        />
      </head>
      <body className="bg-bg text-fg">
        <PreviewHostBridge />
        <PwaBoot />
        <SettingsProvider>
          <AuthProvider>
            <Outlet />
          </AuthProvider>
          <ThemedToaster />
        </SettingsProvider>
        <Scripts />
      </body>
    </html>
  );
}

function ThemedToaster() {
  const { theme } = useSettings();
  return <Toaster theme={theme} position="top-center" />;
}
