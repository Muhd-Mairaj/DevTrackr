import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { LoginForm } from "@/components/login/login-form";
import { RegisterForm } from "@/components/login/register-form";
import { LogoMark } from "@/components/logo-mark";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Panel, PanelBody } from "@/components/ui/panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { strings } from "@/i18n/strings";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => {
    const raw = search.tab;
    return raw === "register" ? { tab: "register" } : {};
  },
  component: LoginPage,
});

function LoginPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  useEffect(() => {
    document.title = `${strings.login.title} · ${strings.common.brand}`;
  }, []);

  const expired =
    new URLSearchParams(window.location.search).get("expired") === "1";

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <aside className="hidden flex-col justify-between bg-brand-ink p-12 text-brand-paper lg:flex">
        <div className="flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="font-display text-[15px] font-bold tracking-[-0.02em]">
            {strings.common.brand}
          </span>
        </div>
        <p className="max-w-md font-display text-4xl leading-[1.12] font-semibold tracking-tight">
          {strings.login.brandStatement}
        </p>
        <p className="font-mono text-[11px] tracking-[0.18em] text-brand-paper/60 uppercase">
          {strings.login.brandMeta}
        </p>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-7 lg:hidden">
            <LogoMark size={30} />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {strings.login.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {strings.login.tagline}
          </p>

          {expired && (
            <div className="mt-5">
              <ErrorBanner message={strings.login.sessionExpired} />
            </div>
          )}

          <Panel className="mt-6">
            <PanelBody>
              <Tabs
                value={tab ?? "login"}
                onValueChange={(value) =>
                  navigate({
                    search: value === "register" ? { tab: value } : {},
                    replace: true,
                  })
                }
              >
                <TabsList className="mb-5 w-full">
                  <TabsTrigger id="login-tab" value="login" className="flex-1">
                    {strings.login.signInTab}
                  </TabsTrigger>
                  <TabsTrigger
                    id="register-tab"
                    value="register"
                    className="flex-1"
                  >
                    {strings.login.createAccountTab}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <LoginForm />
                </TabsContent>
                <TabsContent value="register">
                  <RegisterForm />
                </TabsContent>
              </Tabs>
            </PanelBody>
          </Panel>
        </div>
      </main>
    </div>
  );
}
