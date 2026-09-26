import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { useAuth } from "@/contexts/auth";
import { strings } from "@/ii8n/strings";
import { Divider } from "../divider";
import { Button } from "../ui/button";
import { ErrorBanner } from "../ui/error-banner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { GitHubButton } from "./github-button";

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const loginSchema = z.object({
    email: z.string().email(strings.login.emailInvalid),
    password: z.string().min(1, strings.login.passwordRequired),
  });

  type LoginValues = z.infer<typeof loginSchema>;

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      await login(values);
      const params = new URLSearchParams(window.location.search);
      const raw = params.get("next");
      const target = raw?.startsWith("/") && !raw.startsWith("//") ? raw : "/";
      const [pathname, search] = target.split("?");
      navigate({
        to: pathname as "/",
        search: Object.fromEntries(new URLSearchParams(search ?? "")) as never,
      });
    } catch (err) {
      form.setError("root", { message: (err as Error).message });
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <GitHubButton disabled={isSubmitting} />
        <Divider label={strings.login.or} />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{strings.login.email}</FormLabel>
              <FormControl>
                <Input
                  id="login-email"
                  type="email"
                  placeholder={strings.login.emailPlaceholder}
                  autoComplete="email"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{strings.login.password}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={strings.login.passwordPlaceholder}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    className="pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword
                        ? strings.login.hidePassword
                        : strings.login.showPassword
                    }
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <ErrorBanner message={form.formState.errors.root.message} />
        )}

        <Button
          id="login-submit-btn"
          type="submit"
          className="mt-1 w-full"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {strings.login.signIn}
        </Button>
      </form>
    </Form>
  );
}
