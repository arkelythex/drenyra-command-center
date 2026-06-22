import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { simulateLatency } from '@/lib/simulated-latency';
import { invoiceKeys } from '../api/query-keys';

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      // Mock Delete for Demo Mode
      await simulateLatency(600);
      return { id, success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      toast.success('🗑️ Factura eliminada correctamente (Demo)');
    },
    onError: (error: Error) => {
      toast.error(`❌ ${error.message}`);
    },
  });

  return {
    deleteInvoice: deleteInvoice.mutate,
    isDeleting: deleteInvoice.isPending,
  };
};
