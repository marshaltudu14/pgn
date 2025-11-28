import { create } from 'zustand';
import { Retailer, RetailerFilters, RetailerListResponse, RetailerInsert, RetailerUpdate, RetailerFormData } from '@pgn/shared';
import { useAuthStore } from './authStore';
import { handleApiResponse, getAuthHeaders, transformApiErrorMessage } from './utils/errorHandling';

interface RetailerState {
  retailers: Retailer[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: RetailerFilters;

  fetchRetailers: (params?: Partial<{ page: number; itemsPerPage: number; filters: RetailerFilters }>) => Promise<void>;
  createRetailer: (retailerData: RetailerFormData) => Promise<{ success: boolean; error?: string; data?: Retailer }>;
  updateRetailer: (id: string, retailerData: RetailerFormData) => Promise<{ success: boolean; error?: string; data?: Retailer }>;
  deleteRetailer: (id: string) => Promise<{ success: boolean; error?: string }>;
  setFilters: (filters: Partial<RetailerFilters>) => void;
  setPagination: (page: number, itemsPerPage?: number) => void;
  clearError: () => void;
  setError: (error: string | null) => void;
  refetch: () => Promise<void>;
}

export const useRetailerStore = create<RetailerState>((set, get) => ({
  retailers: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  filters: {
    search: '',
  },

  fetchRetailers: async (params) => {
    const state = get();
    const page = params?.page || state.pagination.currentPage;
    const itemsPerPage = params?.itemsPerPage || state.pagination.itemsPerPage;
    const filters = { ...state.filters, ...params?.filters };

    set({ loading: true, error: null });

    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        itemsPerPage: itemsPerPage.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.shop_name && { shop_name: filters.shop_name }),
        ...(filters.email && { email: filters.email }),
        ...(filters.phone && { phone: filters.phone }),
      });

      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/retailers?${searchParams}`, {
        headers: getAuthHeaders(token),
      });

      const result = await handleApiResponse(response, 'Failed to fetch retailers');

      if (!result.success) {
        set({
          error: result.error || 'Failed to fetch retailers',
          loading: false,
        });
        return;
      }

      const data: RetailerListResponse = result.data as RetailerListResponse;

      set({
        retailers: data.retailers,
        pagination: {
          currentPage: page,
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.totalItems,
          itemsPerPage: itemsPerPage,
          hasNextPage: page < data.pagination.totalPages,
          hasPreviousPage: page > 1,
        },
        filters,
        loading: false,
      });
    } catch (error) {
      const errorMessage = transformApiErrorMessage(error);
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  createRetailer: async (retailerData: RetailerFormData) => {
    set({ loading: true, error: null });

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch('/api/retailers', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(retailerData),
      });

      const result = await handleApiResponse(response, 'Failed to create retailer');

      if (!result.success) {
        set({ error: result.error || 'Failed to create retailer', loading: false });
        return { success: false, error: result.error };
      }

      const data: Retailer = result.data as Retailer;

      // Refetch the list to get updated data
      await get().fetchRetailers();

      return { success: true, data };
    } catch (error) {
      const errorMessage = transformApiErrorMessage(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateRetailer: async (id: string, retailerData: RetailerFormData) => {
    set({ loading: true, error: null });

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/retailers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(retailerData),
      });

      const result = await handleApiResponse(response, 'Failed to update retailer');

      if (!result.success) {
        set({ error: result.error || 'Failed to update retailer', loading: false });
        return { success: false, error: result.error };
      }

      const data: Retailer = result.data as Retailer;

      // Refetch the list to get updated data
      await get().fetchRetailers();

      return { success: true, data };
    } catch (error) {
      const errorMessage = transformApiErrorMessage(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  deleteRetailer: async (id) => {
    set({ loading: true, error: null });

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/retailers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });

      const result = await handleApiResponse(response, 'Failed to delete retailer');

      if (!result.success) {
        set({ error: result.error || 'Failed to delete retailer', loading: false });
        return { success: false, error: result.error };
      }

      // Refetch the list to get updated data
      await get().fetchRetailers();

      return { success: true };
    } catch (error) {
      const errorMessage = transformApiErrorMessage(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  setPagination: (page, itemsPerPage) => {
    set((state) => ({
      pagination: {
        ...state.pagination,
        currentPage: page,
        itemsPerPage: itemsPerPage || state.pagination.itemsPerPage,
      },
    }));
  },

  clearError: () => set({ error: null }),

  setError: (error) => set({ error }),

  refetch: async () => {
    await get().fetchRetailers();
  },
}));