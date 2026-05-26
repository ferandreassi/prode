import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false, // Never retry automatically on failure (prevents infinite loop)
      staleTime: 5 * 60 * 1000, // Cache results for 5 minutes to avoid constant server polling
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      console.error('API Query Error:', error);
      useUIStore.getState().showToast('No se pudo ejecutar la acción', 'error');
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error('API Mutation Error:', error);
      useUIStore.getState().showToast('No se pudo ejecutar la acción', 'error');
    },
  }),
});
