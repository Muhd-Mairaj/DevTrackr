// Auth context: session state + login/register/logout actions.
// All HTTP calls live in users.ts, not here.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { LoginData, RegisterData } from "@/client/types.gen";
import {
  type UserPublic,
  useLogin,
  useLogout,
  useMe,
  useRegister,
} from "@/lib/users";

export const PUBLIC_PAGE_ROUTES = ["/login"];

// Endpoints exempt from automatic token refresh on 401
export const PUBLIC_API_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
];

export function isPublicPageRoute(pathname: string): boolean {
  return PUBLIC_PAGE_ROUTES.some((route) => pathname.startsWith(route));
}

export function isPublicApiRoute(url: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => url.includes(route));
}

type LoginBody = LoginData["body"];
type RegisterBody = RegisterData["body"];

interface AuthContextValue {
  // undefined = loading, null = unauthenticated, UserPublic = authenticated
  user: UserPublic | null | undefined;
  login: (body: LoginBody) => Promise<void>;
  register: (body: RegisterBody) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null | undefined>(undefined);

  const { refetch: fetchMe } = useMe();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  // Probe the session once on mount to restore persisted auth state
  useEffect(() => {
    fetchMe()
      .then(({ data }) => setUser(data ?? null))
      .catch(() => setUser(null));
  }, [fetchMe]);

  const login = useCallback(
    async (body: LoginBody) => {
      await loginMutation.mutateAsync(body);
      const { data } = await fetchMe();
      setUser(data ?? null);
    },
    [loginMutation, fetchMe],
  );

  const register = useCallback(
    async (body: RegisterBody) => {
      await registerMutation.mutateAsync(body);
      const { data } = await fetchMe();
      setUser(data ?? null);
    },
    [registerMutation, fetchMe],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    setUser(null);
  }, [logoutMutation]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
