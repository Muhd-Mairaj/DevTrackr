import {
  type UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ColumnsService } from "@/client";
import type { ProjectColumnItem } from "@/client/types.gen";

export const columnKeys = {
  all: ["columns"] as const,
  project: (projectId: string) => ["columns", projectId] as const,
};

export function useColumns(projectId: string) {
  return useQuery({
    queryKey: columnKeys.project(projectId),
    queryFn: async () => {
      const res = await ColumnsService.getColumns({ path: { id: projectId } });
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
  });
}

export function useSaveColumns(
  projectId: string,
  options?: UseMutationOptions<ProjectColumnItem[], Error, ProjectColumnItem[]>,
) {
  const queryClient = useQueryClient();
  const { onMutate, onSuccess, onError, ...rest } = options ?? {};

  return useMutation({
    mutationFn: async (columns: ProjectColumnItem[]) => {
      const res = await ColumnsService.setColumns({
        path: { id: projectId },
        body: columns.map((c) => ({ kind: c.kind, name: c.name })),
      });
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
    onMutate: async (columns, mutationContext) => {
      await queryClient.cancelQueries({
        queryKey: columnKeys.project(projectId),
      });
      const previous = queryClient.getQueryData<ProjectColumnItem[]>(
        columnKeys.project(projectId),
      );
      queryClient.setQueryData<ProjectColumnItem[]>(
        columnKeys.project(projectId),
        columns,
      );
      await onMutate?.(columns, mutationContext);
      return { previous };
    },
    onSuccess: (data, vars, context, mutationContext) => {
      queryClient.setQueryData<ProjectColumnItem[]>(
        columnKeys.project(projectId),
        data,
      );
      queryClient.invalidateQueries({
        queryKey: columnKeys.project(projectId),
      });
      onSuccess?.(data, vars, context, mutationContext);
    },
    onError: (err, vars, context, mutationContext) => {
      if (context?.previous) {
        queryClient.setQueryData(
          columnKeys.project(projectId),
          context.previous,
        );
      }
      onError?.(err, vars, context, mutationContext);
    },
    ...rest,
  });
}
