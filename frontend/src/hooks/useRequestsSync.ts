import { useState, useEffect, useCallback } from 'react';
import { PurchaseRequest, RequestFilters } from '@/types';

interface RequestsState {
  requests: PurchaseRequest[];
  count: number;
  next: string | null;
  previous: string | null;
}

const emptyState: RequestsState = { requests: [], count: 0, next: null, previous: null };

// Global state for requests synchronization. Dashboard/Approvals/FinanceDashboard are
// separate routes (only one mounted at a time), so a single shared cache - now keyed by
// whatever params the currently-mounted page last loaded with - stays safe to reuse.
let globalState: RequestsState = emptyState;
let subscribers: Array<(state: RequestsState) => void> = [];

export interface LoadRequestsParams extends RequestFilters {
  page?: number;
}

export const useRequestsSync = () => {
  const [state, setState] = useState<RequestsState>(globalState);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to global state changes
  useEffect(() => {
    const update = (newState: RequestsState) => setState(newState);
    subscribers.push(update);
    return () => {
      subscribers = subscribers.filter((sub) => sub !== update);
    };
  }, []);

  // Load requests from API, optionally filtered/paginated
  const loadRequests = useCallback(async (params: LoadRequestsParams = {}) => {
    setIsLoading(true);
    try {
      const { purchaseRequests } = await import('@/services/api');
      const response = await purchaseRequests.getAll(params);
      const data = response.data;
      const newState: RequestsState = Array.isArray(data)
        ? { requests: data, count: data.length, next: null, previous: null }
        : { requests: data.results || [], count: data.count ?? (data.results || []).length, next: data.next ?? null, previous: data.previous ?? null };

      globalState = newState;
      subscribers.forEach((subscriber) => subscriber(newState));
    } catch (error: any) {
      console.error('Error loading requests:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a request from global state
  const deleteRequest = useCallback((requestId: number) => {
    const newState = { ...globalState, requests: globalState.requests.filter((req) => req.id !== requestId) };
    globalState = newState;
    subscribers.forEach((subscriber) => subscriber(newState));
  }, []);

  return {
    requests: state.requests,
    count: state.count,
    next: state.next,
    previous: state.previous,
    isLoading,
    loadRequests,
    deleteRequest,
    refreshRequests: loadRequests,
  };
};
