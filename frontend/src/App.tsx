import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, Link, RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "@/contexts/theme";
import { ToastProvider } from "@/contexts/toast";
import { strings } from "@/ii8n/strings";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundComponent,
});

// Reset scroll on pathname changes (TanStack Router has no built-in
// ScrollRestoration for plain RouterProvider setups).
router.history.subscribe(({ location, action }) => {
  if (typeof window === "undefined") return;
  if (action.type === "PUSH") {
    window.scrollTo(0, 0);
  } else if (action.type === "REPLACE") {
    const current = router.state.location.pathname;
    if (current !== location.pathname) window.scrollTo(0, 0);
  }
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function NotFoundComponent() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        {strings.error.rootTitle}
      </h1>
      <p className="text-sm text-muted-foreground">
        {strings.error.rootDescription}
      </p>
      <Link
        to="/"
        className="mt-2 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        {strings.common.goHome}
      </Link>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
