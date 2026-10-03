import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { LoginForm } from "@/components/login/login-form";
import { RegisterForm } from "@/components/login/register-form";
import { LogoMark } from "@/components/logo-mark";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { strings } from "@/ii8n/strings";

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
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <LogoMark size={40} />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {strings.login.title}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {strings.login.tagline}
            </p>
          </div>
        </div>

        {expired && (
          <div className="mb-4">
            <ErrorBanner message={strings.login.sessionExpired} />
          </div>
        )}

        <Card>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
