import { formatDate } from "@/lib/utils";

/**
 * Central copy for all user-visible strings. Tolgee-ready: keys map
 * one-to-one for future extraction. Never hardcode UI text in components.
 */
export const strings = {
  common: {
    signOut: "Sign out",
    cancel: "Cancel",
    save: "Save changes",
    retry: "Try again",
    goHome: "Go home",
  },
  nav: {
    projects: "Projects",
    logbook: "Logbook",
    insights: "Insights",
    settings: "Settings",
  },
  projects: {
    title: "Projects",
    subtitle: "All your tracked development projects in one place.",
    newProject: "New project",
    emptyTitle: "No projects yet",
    emptyDescription:
      "Create your first project to start tracking time and commits.",
    active: "Active",
    inactive: "Inactive",
    noDescription: "No description",
    updatedAt: (iso: string) => `Updated ${formatDate(iso)}`,
  },
  login: {
    brand: "DevTrackr",
    title: "DevTrackr",
    tagline: "Track time, commits, and progress.",
    signInTab: "Sign in",
    createAccountTab: "Create account",
    signIn: "Sign in",
    createAccount: "Create account",
    continueWithGithub: "Continue with GitHub",
    or: "or",
    email: "Email",
    emailPlaceholder: "you@example.com",
    emailInvalid: "Enter a valid email address",
    password: "Password",
    passwordRequired: "Password is required",
    passwordMin: "Password must be at least 8 characters",
    username: "Username",
    usernameMin: "Username must be at least 2 characters",
    usernamePlaceholder: "johndoe",
    passwordPlaceholder: "********",
  },
  error: {
    loadFailed: "Failed to load",
    defaultMessage: "Something went wrong. Please try again.",
    rootTitle: "Something went wrong",
    rootDescription: "An unexpected error occurred.",
  },
  empty: {
    defaultTitle: "Nothing here yet",
  },
} as const;

export type StringKey = keyof typeof strings;
