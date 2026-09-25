import { client } from "@/client/client.gen";
import { AuthService } from "@/client/sdk.gen";
import { isPublicApiRoute, isPublicPageRoute } from "@/contexts/auth";

// Throw Axios errors on HTTP failure instead of returning { data: undefined, error }
client.setConfig({
  throwOnError: true,
});

const axiosInstance = client.instance;

// Queue concurrent requests while token refresh is in progress
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status: number | undefined = error?.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      const requestUrl: string = originalRequest.url ?? "";

      if (isPublicApiRoute(requestUrl)) {
        redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await AuthService.refresh();
        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 401) {
      redirectToLogin();
    }

    const userMessage = deriveMessage(status, error);
    error.message = userMessage;

    return Promise.reject(error);
  },
);

function redirectToLogin() {
  const pathname = window.location.pathname;
  if (isPublicPageRoute(pathname)) return;
  // Preserve the destination so a re-login can navigate back; guard against
  // nesting ?next= when already on /login (e.g. refresh-token failure there).
  if (pathname === "/login") {
    window.location.replace("/login");
    return;
  }
  const next = `${pathname}${window.location.search}`;
  const params = new URLSearchParams({ next, expired: "1" });
  window.location.replace(`/login?${params.toString()}`);
}

function deriveMessage(status: number | undefined, error: unknown): string {
  switch (status) {
    case 400:
      return tryExtractDetail(error) ?? "Invalid request.";
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return tryExtractDetail(error) ?? "Not found.";
    case 422:
      return tryExtractDetail(error) ?? "Validation error.";
    case 500:
    case 502:
    case 503:
      // Hide internal server details from user-facing UI
      return "Something went wrong on our end. Please try again.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

function tryExtractDetail(error: unknown): string | null {
  const detail = (error as { response?: { data?: { detail?: unknown } } })
    ?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    // Pydantic validation errors format details as an array of objects
    return detail.map((d) => d.msg ?? String(d)).join(", ");
  }
  return null;
}

export { client };
