import { create } from 'zustand';
import { Dealer, DealerWithRetailers, DealerFilters, DealerListResponse, DealerInsert, DealerUpdate } from '@pgn/shared';
import { useAuthStore } from './authStore';
import { handleApiResponse, getAuthHeaders, transformApiErrorMessage } from './utils/errorHandling';

interface DealerState {
  dealers: DealerWithRetailers[];
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
  filters: DealerFilters;

  fetchDealers: (params?: Partial<{ page: number; itemsPerPage: number; filters: DealerFilters }>) => Promise<void>;
  createDealer: (dealerData: DealerInsert) => Promise<{ success: boolean; error?: string; data?: Dealer }>;
  updateDealer: (id: string, dealerData: DealerUpdate) => Promise<{ success: boolean; error?: string; data?: Dealer }>;
  deleteDealer: (id: string) => Promise<{ success: boolean; error?: string }>;
  setFilters: (filters: Partial<DealerFilters>) => void;
  setPagination: (page: number, itemsPerPage?: number) => void;
  clearError: () => void;
  setError: (error: string | null) => void;
  refetch: () => Promise<void>;
}


export const useDealerStore = create<DealerState>((set, get) => ({
  dealers: [],
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

  fetchDealers: async (params) => {
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
      const response = await fetch(`/api/dealers?${searchParams}`, {
        headers: getAuthHeaders(token),
      });

      const result = await handleApiResponse(response, 'Failed to fetch dealers');

      if (!result.success) {
        set({
          error: result.error || 'Failed to fetch dealers',
          loading: false,
        });
        return;
      }

      const data: DealerListResponse = result.data as DealerListResponse;

      set({
        dealers: data.dealers,
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

  createDealer: async (dealerData: DealerInsert) => {
    set({ loading: true, error: null });

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch('/api/dealers', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(dealerData),
      });

      const result = await handleApiResponse(response, 'Failed to create dealer');

      if (!result.success) {
        set({ error: result.error || 'Failed to create dealer', loading: false });
        return { success: false, error: result.error };
      }

      const data = result.data as Dealer;

      // Refetch the list to get updated data
      await get().fetchDealers();

      return { success: true, data };
    } catch (error) {
      const errorMessage = transformApiErrorMessage(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateDealer: async (id: string, dealerData: DealerUpdate) => {
    set({ loading: true, error: null });

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/dealers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(dealerData),
      });

      const result = await handleApiResponse(response, 'Failed to update dealer');

      if (!result.success) {
        set({ error: result.error || 'Failed to update dealer', loading: false });
        return { success: false, error: result.error };
      }

      const data = result.data as Dealer;

      // Refetch the list to get updated data
      await get().fetchDealers();

      return { success: true, data };
    } catch (error) {
      const errorMessage = transformApiErrorMessage(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  deleteDealer: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/dealers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });

      const result = await handleApiResponse(response, 'Failed to delete dealer');

      if (!result.success) {
        set({ error: result.error || 'Failed to delete dealer', loading: false });
        return { success: false, error: result.error };
      }

      // Refetch the list to get updated data
      await get().fetchDealers();

      return { success: true };
    } catch (error) {
      const errorMessage = transformApiErrorMessage(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  setFilters: (filters: Partial<DealerFilters>) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  setPagination: (page: number, itemsPerPage?: number) => {
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
    await get().fetchDealers();
  },
}));