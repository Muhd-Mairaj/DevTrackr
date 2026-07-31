import {
  type UseMutationOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { AuthService } from "@/client/sdk.gen";
import type { LoginData, RegisterData } from "@/client/types.gen";

export type { UserPublic } from "@/client/types.gen";

export const userKeys = {
  me: ["users", "me"] as const,
};

// enabled: false as auth.tsx controls when to fetch (not on every render)
export function useMe() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: async () => {
      const res = await AuthService.me();
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
    retry: false,
    enabled: false,
  });
}

type LoginBody = LoginData["body"];

export function useLogin(options?: UseMutationOptions<void, Error, LoginBody>) {
  return useMutation({
    mutationFn: async (body: LoginBody) => {
      await AuthService.login({ body });
    },
    ...options,
  });
}

type RegisterBody = RegisterData["body"];

export function useRegister(
  options?: UseMutationOptions<void, Error, RegisterBody>,
) {
  return useMutation({
    mutationFn: async (body: RegisterBody) => {
      await AuthService.register({ body });
    },
    ...options,
  });
}

export function useLogout(options?: UseMutationOptions<void, Error, void>) {
  return useMutation({
    mutationFn: async () => {
      await AuthService.logout();
    },
    ...options,
  });
}
