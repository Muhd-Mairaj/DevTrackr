import {
  type UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ProjectsService } from "@/client";
import type {
  ProjectCreate,
  ProjectPublic,
  ProjectUpdate,
} from "@/client/types.gen";

export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: async () => {
      const res = await ProjectsService.getProjects();
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
  });
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: projectKeys.detail(id ?? ""),
    queryFn: async () => {
      if (!id) throw new Error("No project id");
      const res = await ProjectsService.getProject({ path: { id } });
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
    enabled: id !== null,
    // Fresh data reference per fetch so the details toast refires on same-card re-click
    structuralSharing: false,
  });
}

export function useCreateProject(
  options?: UseMutationOptions<ProjectPublic, Error, ProjectCreate>,
) {
  const queryClient = useQueryClient();
  const { onMutate, onSuccess, onError, ...rest } = options ?? {};

  return useMutation({
    mutationFn: async (body: ProjectCreate) => {
      const res = await ProjectsService.createProject({ body });
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
    onMutate: async (body: ProjectCreate, mutationContext) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.all });
      const previous = queryClient.getQueryData<ProjectPublic[]>(
        projectKeys.all,
      );

      const optimistic: ProjectPublic = {
        id: crypto.randomUUID(),
        name: body.name,
        description: body.description ?? null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: "",
      };
      queryClient.setQueryData<ProjectPublic[]>(
        projectKeys.all,
        (prev = []) => [...prev, optimistic],
      );

      await onMutate?.(body, mutationContext);
      return { previous, optimisticId: optimistic.id };
    },
    onSuccess: (data, vars, context, mutationContext) => {
      queryClient.setQueryData<ProjectPublic[]>(projectKeys.all, (prev = []) =>
        prev.map((p) => (p.id === context?.optimisticId ? data : p)),
      );
      // A list refetch that lands between onMutate and onSuccess replaces the
      // cache, so id-matching alone can strand the optimistic card; reconcile
      // with server truth.
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      onSuccess?.(data, vars, context, mutationContext);
    },
    onError: (err, vars, context, mutationContext) => {
      if (context?.previous) {
        queryClient.setQueryData(projectKeys.all, context.previous);
      }
      onError?.(err, vars, context, mutationContext);
    },
    ...rest,
  });
}

export function useDeleteProject(
  options?: UseMutationOptions<ProjectPublic, Error, string>,
) {
  const queryClient = useQueryClient();
  const { onMutate, onSuccess, onError, ...rest } = options ?? {};

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await ProjectsService.deleteProject({ path: { id } });
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
    onMutate: async (id: string, mutationContext) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.all });
      const previous = queryClient.getQueryData<ProjectPublic[]>(
        projectKeys.all,
      );

      queryClient.setQueryData<ProjectPublic[]>(projectKeys.all, (prev = []) =>
        prev.filter((p) => p.id !== id),
      );

      await onMutate?.(id, mutationContext);
      return { previous };
    },
    onSuccess: (data, id, context, mutationContext) => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      // A refetch that landed before the delete committed can repopulate the
      // list with the deleted project; reconcile with server truth.
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      onSuccess?.(data, id, context, mutationContext);
    },
    onError: (err, id, context, mutationContext) => {
      if (context?.previous) {
        queryClient.setQueryData(projectKeys.all, context.previous);
      }
      onError?.(err, id, context, mutationContext);
    },
    ...rest,
  });
}

export function useUpdateProject(
  options?: UseMutationOptions<
    ProjectPublic,
    Error,
    { id: string; body: ProjectUpdate }
  >,
) {
  const queryClient = useQueryClient();
  const { onMutate, onSuccess, onError, ...rest } = options ?? {};

  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: ProjectUpdate }) => {
      const res = await ProjectsService.updateProject({ path: { id }, body });
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
    onMutate: async ({ id, body }, mutationContext) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.all });
      const previous = queryClient.getQueryData<ProjectPublic[]>(
        projectKeys.all,
      );

      queryClient.setQueryData<ProjectPublic[]>(projectKeys.all, (prev = []) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                ...body,
                name: body.name ?? p.name,
                updated_at: new Date().toISOString(),
              }
            : p,
        ),
      );

      await onMutate?.({ id, body }, mutationContext);
      return { previous };
    },
    onSuccess: (data, vars, context, mutationContext) => {
      queryClient.setQueryData<ProjectPublic[]>(projectKeys.all, (prev = []) =>
        prev.map((p) => (p.id === data.id ? data : p)),
      );
      onSuccess?.(data, vars, context, mutationContext);
    },
    onError: (err, vars, context, mutationContext) => {
      if (context?.previous) {
        queryClient.setQueryData(projectKeys.all, context.previous);
      }
      onError?.(err, vars, context, mutationContext);
    },
    ...rest,
  });
}
