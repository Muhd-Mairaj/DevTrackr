import {
  type UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { EntriesService } from "@/client";
import type {
  TimeEntryCreate,
  TimeEntryPublic,
  TimeEntryUpdate,
} from "@/client/types.gen";

export const PAGE_SIZE = 25;

export interface EntryPageData {
  items: TimeEntryPublic[];
  total: number;
}

export const entryKeys = {
  all: ["entries"] as const,
  list: (projectId: string) => ["entries", projectId] as const,
  page: (projectId: string, page: number) =>
    ["entries", projectId, { page }] as const,
};

export function useEntries(projectId: string, page: number) {
  return useQuery({
    queryKey: entryKeys.page(projectId, page),
    queryFn: async () => {
      const res = await EntriesService.getEntriesForProject({
        path: { id: projectId },
        query: { skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE },
      });
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
  });
}

export function useCreateEntry(
  projectId: string,
  options?: UseMutationOptions<TimeEntryPublic, Error, TimeEntryCreate>,
) {
  const queryClient = useQueryClient();
  const { onMutate, onSuccess, onError, ...rest } = options ?? {};

  return useMutation({
    mutationFn: async (body: TimeEntryCreate) => {
      const res = await EntriesService.createTimeEntry({
        path: { id: projectId },
        body,
      });
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
    onMutate: async (body, mutationContext) => {
      await queryClient.cancelQueries({ queryKey: entryKeys.list(projectId) });
      const snapshot = queryClient.getQueriesData<EntryPageData>({
        queryKey: entryKeys.list(projectId),
      });
      const optimisticId = crypto.randomUUID();
      const optimistic: TimeEntryPublic = {
        id: optimisticId,
        description: body.description ?? null,
        start_time: body.start_time,
        end_time: body.end_time ?? null,
        duration_seconds: body.duration_seconds ?? null,
        project_id: projectId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };
      queryClient.setQueriesData<EntryPageData>(
        { queryKey: entryKeys.list(projectId) },
        (prev) =>
          prev
            ? {
                ...prev,
                items: [optimistic, ...prev.items],
                total: prev.total + 1,
              }
            : prev,
      );
      await onMutate?.(body, mutationContext);
      return { snapshot, optimisticId };
    },
    onSuccess: (data, vars, context, mutationContext) => {
      queryClient.setQueriesData<EntryPageData>(
        { queryKey: entryKeys.list(projectId) },
        (prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((e) =>
                  e.id === context?.optimisticId ? data : e,
                ),
              }
            : prev,
      );
      queryClient.invalidateQueries({ queryKey: entryKeys.list(projectId) });
      onSuccess?.(data, vars, context, mutationContext);
    },
    onError: (err, vars, context, mutationContext) => {
      for (const [key, data] of context?.snapshot ?? []) {
        queryClient.setQueryData(key, data);
      }
      onError?.(err, vars, context, mutationContext);
    },
    ...rest,
  });
}

export function useUpdateEntry(
  projectId: string,
  options?: UseMutationOptions<
    TimeEntryPublic,
    Error,
    { id: string; body: TimeEntryUpdate }
  >,
) {
  const queryClient = useQueryClient();
  const { onMutate, onSuccess, onError, ...rest } = options ?? {};

  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: TimeEntryUpdate }) => {
      const res = await EntriesService.updateTimeEntry({
        path: { id: projectId, entry_id: id },
        body,
      });
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
    onMutate: async ({ id, body }, mutationContext) => {
      await queryClient.cancelQueries({ queryKey: entryKeys.list(projectId) });
      const snapshot = queryClient.getQueriesData<EntryPageData>({
        queryKey: entryKeys.list(projectId),
      });
      queryClient.setQueriesData<EntryPageData>(
        { queryKey: entryKeys.list(projectId) },
        (prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((e) =>
                  e.id === id
                    ? {
                        ...e,
                        ...body,
                        start_time: body.start_time ?? e.start_time,
                      }
                    : e,
                ),
              }
            : prev,
      );
      await onMutate?.({ id, body }, mutationContext);
      return { snapshot };
    },
    onSuccess: (data, vars, context, mutationContext) => {
      queryClient.setQueriesData<EntryPageData>(
        { queryKey: entryKeys.list(projectId) },
        (prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((e) => (e.id === data.id ? data : e)),
              }
            : prev,
      );
      queryClient.invalidateQueries({ queryKey: entryKeys.list(projectId) });
      onSuccess?.(data, vars, context, mutationContext);
    },
    onError: (err, vars, context, mutationContext) => {
      for (const [key, data] of context?.snapshot ?? []) {
        queryClient.setQueryData(key, data);
      }
      onError?.(err, vars, context, mutationContext);
    },
    ...rest,
  });
}

/**
 * Pause a running entry by stamping its end with now. Wraps its own
 * update mutation so pausing never interferes with the edit dialog's save.
 */
export function usePauseEntry(projectId: string) {
  const mutation = useUpdateEntry(projectId);
  const pause = useCallback(
    (
      id: string,
      options?: {
        onSuccess?: () => void;
        onError?: (err: Error) => void;
      },
    ) => {
      mutation.mutate(
        { id, body: { end_time: new Date().toISOString() } },
        {
          onSuccess: () => options?.onSuccess?.(),
          onError: (err) => options?.onError?.(err),
        },
      );
    },
    [mutation],
  );
  return { pause, isPausing: mutation.isPending };
}

export function useDeleteEntry(
  projectId: string,
  options?: UseMutationOptions<TimeEntryPublic, Error, string>,
) {
  const queryClient = useQueryClient();
  const { onMutate, onSuccess, onError, ...rest } = options ?? {};

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await EntriesService.deleteTimeEntry({
        path: { id: projectId, entry_id: id },
      });
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
    onMutate: async (id, mutationContext) => {
      await queryClient.cancelQueries({ queryKey: entryKeys.list(projectId) });
      const snapshot = queryClient.getQueriesData<EntryPageData>({
        queryKey: entryKeys.list(projectId),
      });
      queryClient.setQueriesData<EntryPageData>(
        { queryKey: entryKeys.list(projectId) },
        (prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.filter((e) => e.id !== id),
                total: Math.max(0, prev.total - 1),
              }
            : prev,
      );
      await onMutate?.(id, mutationContext);
      return { snapshot };
    },
    onSuccess: (data, id, context, mutationContext) => {
      queryClient.invalidateQueries({ queryKey: entryKeys.list(projectId) });
      onSuccess?.(data, id, context, mutationContext);
    },
    onError: (err, id, context, mutationContext) => {
      for (const [key, data] of context?.snapshot ?? []) {
        queryClient.setQueryData(key, data);
      }
      onError?.(err, id, context, mutationContext);
    },
    ...rest,
  });
}

/** Re-create payload for undoing a delete (new id; same content/range). */
export function entryToRecreatePayload(
  entry: TimeEntryPublic,
): TimeEntryCreate {
  return {
    description: entry.description ?? null,
    start_time: entry.start_time,
    end_time: entry.end_time ?? null,
    duration_seconds: entry.duration_seconds ?? null,
  };
}

/**
 * Delete with undo support. Stores the last deleted entry so callers can
 * toast an Undo action that re-creates it with the same content and range.
 */
export function useUndoDeleteEntry(projectId: string) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteEntry(projectId);
  const createMutation = useCreateEntry(projectId);
  // A ref, not state: the undo runs from a toast action that fires after the
  // render which deleted the entry, where a state closure would be stale.
  const lastDeleted = useRef<TimeEntryPublic | null>(null);

  const remove = useCallback(
    async (entry: TimeEntryPublic) => {
      if (!entry.id) return null;
      lastDeleted.current = entry;
      return deleteMutation.mutateAsync(entry.id);
    },
    [deleteMutation],
  );

  const undo = useCallback(async () => {
    const snapshot = lastDeleted.current;
    if (!snapshot) return null;
    lastDeleted.current = null;
    const created = await createMutation.mutateAsync(
      entryToRecreatePayload(snapshot),
    );
    queryClient.invalidateQueries({ queryKey: entryKeys.list(projectId) });
    return created;
  }, [createMutation, queryClient, projectId]);

  return {
    remove,
    undo,
    isPending: deleteMutation.isPending,
    isError: deleteMutation.isError,
    error: deleteMutation.error,
    reset: deleteMutation.reset,
  };
}
