import { createFileRoute } from "@tanstack/react-router";
import { GitBranch } from "lucide-react";
import { LoginForm } from "@/components/login/login-form";
import { RegisterForm } from "@/components/login/register-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { strings } from "@/lib/strings";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GitBranch className="size-6" />
          </div>
          <div>
            <h1 className="font-semibold text-xl tracking-tight">
              {strings.login.title}
            </h1>
            <p className="mt-0.5 text-muted-foreground text-sm">
              {strings.login.tagline}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <Tabs defaultValue="login">
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
        </div>
      </div>
    </div>
  );
}
