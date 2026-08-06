import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";
import { useAuth } from "@/contexts/auth";
import { strings } from "@/ii8n/strings";
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

export function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();

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
                <Input
                  id="register-password"
                  type="password"
                  placeholder={strings.login.passwordPlaceholder}
                  autoComplete="new-password"
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
