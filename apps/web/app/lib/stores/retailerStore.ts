import { Dealer, Retailer, RetailerFilters, RetailerFormData, RetailerListResponse, RetailerWithFarmers } from '@pgn/shared';
import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { getAuthHeaders, handleApiResponse, transformApiErrorMessage } from './utils/errorHandling';

interface RetailerState {
  retailers: RetailerWithFarmers[];
  dealers: Dealer[];
  loading: boolean;
  formLoading: boolean;
  loadingDealers: boolean;
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
  fetchDealers: (params?: { search?: string; searchType?: 'name' | 'phone'; limit?: number }) => Promise<void>;
  createRetailer: (retailerData: RetailerFormData) => Promise<{ success: boolean; error?: string; data?: Retailer }>;
  updateRetailer: (id: string, retailerData: RetailerFormData) => Promise<{ success: boolean; error?: string; data?: Retailer }>;
  deleteRetailer: (id: string) => Promise<{ success: boolean; error?: string }>;
  getRetailerById: (id: string) => Promise<RetailerWithFarmers | null>;
  setFilters: (filters: Partial<RetailerFilters>) => void;
  setPagination: (page: number, itemsPerPage?: number) => void;
  clearError: () => void;
  setError: (error: string | null) => void;
  resetFormLoading: () => void;
  refetch: () => Promise<void>;
}

export const useRetailerStore = create<RetailerState>((set, get) => ({
  retailers: [],
  dealers: [],
  loading: true,
  formLoading: false,
  loadingDealers: false,
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
    sort_by: 'updated_at',
    sort_order: 'desc',
  },

  fetchRetailers: async (params = {}) => {
    const state = get();
    const page = params?.page || state.pagination.currentPage;
    const itemsPerPage = params?.itemsPerPage || state.pagination.itemsPerPage;
    const filters = { ...state.filters, ...params?.filters };

    set({ loading: true, error: null });

    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.shop_name && { shop_name: filters.shop_name }),
        ...(filters.email && { email: filters.email }),
        ...(filters.phone && { phone: filters.phone }),
        ...(filters.dealer_id && { dealer_id: filters.dealer_id }),
        sort_by: filters.sort_by || 'updated_at',
        sort_order: filters.sort_order || 'desc',
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

  fetchDealers: async (params) => {
    set({ loadingDealers: true });

    try {
      const searchParams = new URLSearchParams();
      
      // Use searchType to determine which parameter to use
      if (params?.search) {
        const searchType = params.searchType || 'name'; // Default to name search
        if (searchType === 'name') {
          searchParams.set('search', params.search); // search param searches name/shop_name
        } else if (searchType === 'phone') {
          searchParams.set('phone', params.search); // phone param searches phone only
        }
      }
      
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (!params?.limit) searchParams.set('limit', '10'); // Default limit for dropdown

      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/dealers?${searchParams}`, {
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dealers');
      }

      const data = await response.json();

      // Handle different response formats
      const dealers = data.data?.dealers || data.dealers || [];
      
      set({ dealers, loadingDealers: false });
    } catch (error) {
      console.error('Error fetching dealers:', error);
      set({ loadingDealers: false });
    }
  },

  createRetailer: async (retailerData: RetailerFormData) => {
    set({ formLoading: true, error: null });

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch('/api/retailers', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(retailerData),
      });

      const result = await handleApiResponse(response, 'Failed to create retailer');

      if (!result.success) {
        set({ error: result.error || 'Failed to create retailer', formLoading: false });
        return { success: false, error: result.error };
      }

      const data: Retailer = result.data as Retailer;

      // Refetch the list to get updated data
      await get().fetchRetailers();

      return { success: true, data };
    } catch (error) {
      const errorMessage = transformApiErrorMessage(error);
      set({ error: errorMessage, formLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateRetailer: async (id: string, retailerData: RetailerFormData) => {
    set({ formLoading: true, error: null });

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/retailers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(retailerData),
      });

      const result = await handleApiResponse(response, 'Failed to update retailer');

      if (!result.success) {
        set({ error: result.error || 'Failed to update retailer', formLoading: false });
        return { success: false, error: result.error };
      }

      const data: Retailer = result.data as Retailer;

      // Refetch the list to get updated data
      await get().fetchRetailers();

      return { success: true, data };
    } catch (error) {
      const errorMessage = transformApiErrorMessage(error);
      set({ error: errorMessage, formLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  deleteRetailer: async (id: string) => {
    set({ formLoading: true, error: null });

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/retailers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });

      const result = await handleApiResponse(response, 'Failed to delete retailer');

      if (!result.success) {
        set({ error: result.error || 'Failed to delete retailer', formLoading: false });
        return { success: false, error: result.error };
      }

      // Refetch the list to get updated data
      await get().fetchRetailers();

      return { success: true };
    } catch (error) {
      const errorMessage = transformApiErrorMessage(error);
      set({ error: errorMessage, formLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  setFilters: (filters: Partial<RetailerFilters>) => {
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

  resetFormLoading: () => set({ formLoading: false }),

  getRetailerById: async (id: string): Promise<RetailerWithFarmers | null> => {
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/retailers/${id}`, {
        headers: getAuthHeaders(token),
      });

      const result = await handleApiResponse(response, 'Failed to fetch retailer');

      if (result.success) {
        return result.data as RetailerWithFarmers;
      } else {
        throw new Error(result.error || 'Failed to fetch retailer');
      }
    } catch (error) {
      console.error('Error fetching retailer:', error);
      throw error;
    }
  },

  refetch: async () => {
    await get().fetchRetailers();
  },
}));