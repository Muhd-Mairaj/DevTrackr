import {
  type UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createProjectRouteApiProjectsPost,
  getProjectsRouteApiProjectsGet,
} from "@/client";
import type { ProjectCreate, ProjectPublic } from "@/client/types.gen";

export type { ProjectPublic };

export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: async () => {
      const res = await getProjectsRouteApiProjectsGet();
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
  });
}

export function useCreateProject(
  options?: UseMutationOptions<ProjectPublic, Error, ProjectCreate>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: ProjectCreate) => {
      const res = await createProjectRouteApiProjectsPost({ body });
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
    onSuccess: (newProject, ...args) => {
      queryClient.setQueryData<ProjectPublic[]>(
        projectKeys.all,
        (prev = []) => [...prev, newProject],
      );
      options?.onSuccess?.(newProject, ...args);
    },
    ...options,
  });
}
