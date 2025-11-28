import { create } from 'zustand';
import { Dealer, DealerFilters, DealerListResponse, DealerInsert, DealerUpdate } from '@pgn/shared';
import { useAuthStore } from './authStore';

interface DealerState {
  dealers: Dealer[];
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

// Helper function to get authentication headers
const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-client-info': 'pgn-web-client',
    'User-Agent': 'pgn-admin-dashboard/1.0.0',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Transform technical error messages into user-friendly ones
 */
function getUserFriendlyErrorMessage(error: string): string {
  const cleanError = error.replace(/AuthApiError:\s*/, '').replace(/DatabaseError:\s*/, '').trim();

  if (cleanError.includes('new row violates row-level security policy')) {
    return 'You do not have permission to perform this action. Please contact your administrator.';
  }

  if (cleanError.includes('duplicate key')) {
    return 'A dealer with these details already exists.';
  }

  if (cleanError.includes('Network connection failed')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  if (cleanError.includes('Daily edit limit exceeded')) {
    return 'You have reached your daily edit limit. Please try again tomorrow.';
  }

  return cleanError || 'An unexpected error occurred. Please try again.';
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

      const response = await fetch(`/api/dealers?${searchParams}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch dealers');
      }

      const data: DealerListResponse = await response.json();

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
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dealers';
      set({
        error: getUserFriendlyErrorMessage(errorMessage),
        loading: false,
      });
    }
  },

  createDealer: async (dealerData) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch('/api/dealers', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dealerData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create dealer');
      }

      const data = await response.json();

      // Refetch the list to get updated data
      await get().fetchDealers();

      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create dealer';
      set({ error: getUserFriendlyErrorMessage(errorMessage), loading: false });
      return { success: false, error: getUserFriendlyErrorMessage(errorMessage) };
    }
  },

  updateDealer: async (id, dealerData) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`/api/dealers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(dealerData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update dealer');
      }

      const data = await response.json();

      // Refetch the list to get updated data
      await get().fetchDealers();

      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update dealer';
      set({ error: getUserFriendlyErrorMessage(errorMessage), loading: false });
      return { success: false, error: getUserFriendlyErrorMessage(errorMessage) };
    }
  },

  deleteDealer: async (id) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`/api/dealers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete dealer');
      }

      // Refetch the list to get updated data
      await get().fetchDealers();

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete dealer';
      set({ error: getUserFriendlyErrorMessage(errorMessage), loading: false });
      return { success: false, error: getUserFriendlyErrorMessage(errorMessage) };
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
    await get().fetchDealers();
  },
}));