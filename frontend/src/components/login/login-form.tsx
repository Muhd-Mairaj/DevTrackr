import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";
import { useAuth } from "@/lib/auth";
import { strings } from "@/lib/strings";
import { Divider } from "../divider";
import { Button } from "../ui/button";
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
      navigate({ to: "/" });
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
                <Input
                  id="login-password"
                  type="password"
                  placeholder={strings.login.passwordPlaceholder}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-center text-destructive text-xs">
            {form.formState.errors.root.message}
          </p>
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
