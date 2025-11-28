import { useState, useEffect, useCallback } from 'react';
import { PurchaseRequest } from '@/types';

// Global state for requests synchronization
let globalRequests: PurchaseRequest[] = [];
let subscribers: Array<(requests: PurchaseRequest[]) => void> = [];

export const useRequestsSync = () => {
  const [requests, setRequests] = useState<PurchaseRequest[]>(globalRequests);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to global state changes
  useEffect(() => {
    const updateRequests = (newRequests: PurchaseRequest[]) => {
      setRequests(newRequests);
    };
    
    subscribers.push(updateRequests);
    
    return () => {
      subscribers = subscribers.filter(sub => sub !== updateRequests);
    };
  }, []);

  // Load requests from API
  const loadRequests = useCallback(async () => {
    try {
      const { purchaseRequests } = await import('@/services/api');
      const response = await purchaseRequests.getAll();
      const allRequests = response.data.results || response.data || [];
      
      console.log('API Response:', response.data);
      console.log('Loaded requests:', allRequests);
      
      // Update global state
      globalRequests = allRequests;
      
      // Notify all subscribers
      subscribers.forEach(subscriber => subscriber(allRequests));
      
    } catch (error) {
      console.error('Error loading requests:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a request from global state
  const deleteRequest = useCallback((requestId: number) => {
    globalRequests = globalRequests.filter(req => req.id !== requestId);
    subscribers.forEach(subscriber => subscriber(globalRequests));
  }, []);

  return {
    requests,
    isLoading,
    loadRequests,
    deleteRequest,
    refreshRequests: loadRequests
  };
};