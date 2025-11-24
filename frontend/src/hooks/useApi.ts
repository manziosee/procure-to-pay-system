import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseRequests, documents } from '@/services/api';

// Purchase Requests Hooks
export const usePurchaseRequests = () => {
  return useQuery({
    queryKey: ['purchaseRequests'],
    queryFn: () => purchaseRequests.getAll(),
  });
};

export const usePurchaseRequest = (id: string) => {
  return useQuery({
    queryKey: ['purchaseRequest', id],
    queryFn: () => purchaseRequests.getById(id),
    enabled: !!id,
  });
};

export const useCreatePurchaseRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: FormData) => purchaseRequests.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
    },
  });
};

export const useUpdatePurchaseRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      purchaseRequests.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequest', id] });
    },
  });
};

export const useApprovePurchaseRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => purchaseRequests.approve(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequest', id] });
    },
  });
};

export const useRejectPurchaseRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      purchaseRequests.reject(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequest', id] });
    },
  });
};

export const useSubmitReceipt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => 
      purchaseRequests.submitReceipt(id, file),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequest', id] });
    },
  });
};

export const useDeletePurchaseRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => purchaseRequests.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
    },
  });
};

// Documents Hooks
export const useProcessDocument = () => {
  return useMutation({
    mutationFn: (file: File) => documents.process(file),
  });
};