import { useActor } from "@/hooks/useActor";

export function useBackend() {
  const { actor, isFetching } = useActor();
  return { backend: actor, isLoading: isFetching };
}
