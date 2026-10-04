import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { useAuth } from "@/contexts/auth";
import { strings } from "@/i18n/strings";
import { usePostLoginRedirect } from "@/lib/login-redirect";
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

export function RegisterForm() {
  const { register } = useAuth();
  const redirectAfterLogin = usePostLoginRedirect();
  const [showPassword, setShowPassword] = useState(false);

  const registerSchema = z.object({
    email: z.email(strings.login.emailInvalid),
    username: z.string().min(2, strings.login.usernameMin),
    password: z.string().min(8, strings.login.passwordMin),
  });

  type RegisterValues = z.infer<typeof registerSchema>;

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", username: "", password: "" },
  });

  const onSubmit = async (values: RegisterValues) => {
    try {
      await register(values);
      redirectAfterLogin();
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
                  id="register-email"
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
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{strings.login.username}</FormLabel>
              <FormControl>
                <Input
                  id="register-username"
                  type="text"
                  placeholder={strings.login.usernamePlaceholder}
                  autoComplete="username"
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
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={strings.login.passwordPlaceholder}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className="pr-10"
                    aria-describedby="register-password-hint"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword
                        ? strings.login.hidePassword
                        : strings.login.showPassword
                    }
                    className="absolute top-1/2 right-2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <p
                id="register-password-hint"
                className="text-xs text-muted-foreground"
              >
                {strings.login.passwordHint}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <ErrorBanner message={form.formState.errors.root.message} />
        )}

        <Button
          id="register-submit-btn"
          type="submit"
          className="mt-1 w-full"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {strings.login.createAccount}
        </Button>
      </form>
    </Form>
  );
}
