import {
  type UseMutationOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import {
  loginApiAuthLoginPost,
  logoutApiAuthLogoutPost,
  meApiAuthMeGet,
  registerApiAuthRegisterPost,
} from "@/client/sdk.gen";
import type {
  LoginApiAuthLoginPostData,
  RegisterApiAuthRegisterPostData,
} from "@/client/types.gen";

export type { UserPublic } from "@/client/types.gen";

export const userKeys = {
  me: ["users", "me"] as const,
};

// enabled: false as auth.tsx controls when to fetch (not on every render)
export function useMe() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: async () => {
      const res = await meApiAuthMeGet();
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
    retry: false,
    enabled: false,
  });
}

type LoginBody = LoginApiAuthLoginPostData["body"];

export function useLogin(options?: UseMutationOptions<void, Error, LoginBody>) {
  return useMutation({
    mutationFn: async (body: LoginBody) => {
      await loginApiAuthLoginPost({ body });
    },
    ...options,
  });
}

type RegisterBody = RegisterApiAuthRegisterPostData["body"];

export function useRegister(
  options?: UseMutationOptions<void, Error, RegisterBody>,
) {
  return useMutation({
    mutationFn: async (body: RegisterBody) => {
      await registerApiAuthRegisterPost({ body });
    },
    ...options,
  });
}

export function useLogout(options?: UseMutationOptions<void, Error, void>) {
  return useMutation({
    mutationFn: async () => {
      await logoutApiAuthLogoutPost();
    },
    ...options,
  });
}
