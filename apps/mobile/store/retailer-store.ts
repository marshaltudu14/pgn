import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Retailer, RetailerFilters, RetailerInsert, RetailerUpdate, RetailerListResponse } from '@pgn/shared';
import { api, ApiResponse } from '@/services/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { handleMobileApiResponse, transformApiErrorMessage } from './utils/errorHandling';
import { useRegionStore } from './region-store';
import { useAuthStore } from './auth-store';

interface RetailerStoreState {
  // Data state
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
  hasMore: boolean;

  // UI state
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  selectedRetailer: Retailer | null;
  showFilters: boolean;

  // Actions
  fetchRetailers: (params?: {
    page?: number;
    itemsPerPage?: number;
    filters?: RetailerFilters;
    refresh?: boolean;
  }) => Promise<RetailerListResponse>;
  createRetailer: (retailerData: RetailerInsert) => Promise<ApiResponse<Retailer>>;
  updateRetailer: (id: string, retailerData: RetailerUpdate) => Promise<ApiResponse<Retailer>>;
  deleteRetailer: (id: string) => Promise<ApiResponse<void>>;
  getRetailerById: (id: string) => Promise<ApiResponse<Retailer>>;
  searchRetailers: (query: string, limit?: number) => Promise<ApiResponse<Retailer[]>>;

  // UI actions
  setSelectedRetailer: (retailer: Retailer | null) => void;
  setFilters: (filters: Partial<RetailerFilters>) => void;
  setPagination: (page: number, itemsPerPage?: number) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useRetailerStore = create<RetailerStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
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
        hasMore: true,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        selectedRetailer: null,
        showFilters: false,

        // Fetch retailers with pagination and filtering
        fetchRetailers: async (params = {}) => {
          const {
            page = 1,
            itemsPerPage = 20,
            filters,
            refresh = false
          } = params;

          const currentFilters = { ...get().filters, ...filters };
          const currentPage = refresh ? 1 : page;

          // Clear existing data when starting fresh fetch (page 1) to show only loader
          if (currentPage === 1) {
            set({
              loading: true,
              error: null,
              retailers: [] // Clear existing data to show only loader
            });
          } else {
            set({ loading: true, error: null });
          }

          try {
            const queryParams = new URLSearchParams({
              page: currentPage.toString(),
              limit: itemsPerPage.toString(),
              ...(currentFilters.search && { search: currentFilters.search }),
              ...(currentFilters.shop_name && { shop_name: currentFilters.shop_name }),
              ...(currentFilters.email && { email: currentFilters.email }),
              ...(currentFilters.phone && { phone: currentFilters.phone }),
              ...(currentFilters.region_id && { region_id: currentFilters.region_id }),
              ...(currentFilters.dealer_id && { dealer_id: currentFilters.dealer_id }),
            });

            const response = await api.get<RetailerListResponse>(
              `${API_ENDPOINTS.RETAILERS}?${queryParams}`
            );

            // Handle API response with validation error support
            const handledResponse = handleMobileApiResponse(response.data || response, 'Failed to fetch retailers');

            const retailerData = handledResponse.data as any;
            if (handledResponse.success && retailerData) {
              set({
                retailers: retailerData.retailers,
                pagination: {
                  currentPage: retailerData.pagination.currentPage,
                  totalPages: retailerData.pagination.totalPages,
                  totalItems: retailerData.pagination.totalItems,
                  itemsPerPage: retailerData.pagination.itemsPerPage,
                  hasNextPage: currentPage < retailerData.pagination.totalPages,
                  hasPreviousPage: currentPage > 1,
                },
                loading: false,
              });
            } else {
              set({
                error: handledResponse.error || 'Failed to fetch retailers',
                loading: false,
              });
            }
            return (handledResponse.data as RetailerListResponse) || {
              retailers: [],
              pagination: {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: 20,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            };
          } catch (error) {
            set({
              error: 'Network error occurred while fetching retailers',
              loading: false,
            });
            throw error;
          }
        },

        // Create new retailer
        createRetailer: async (retailerData: RetailerInsert) => {
          set({ isCreating: true, error: null });

          try {
            const response = await api.post<Retailer>(API_ENDPOINTS.RETAILERS, retailerData);

            // Handle API response with validation error support
            const handledResponse = handleMobileApiResponse(response.data || response, 'Failed to create retailer');

            if (handledResponse.success && handledResponse.data) {
              // Refresh the list to get the updated data
              await get().fetchRetailers({ refresh: true });
              set({ isCreating: false });
              return handledResponse as ApiResponse<Retailer>;
            } else {
              set({ error: handledResponse.error || 'Failed to create retailer', isCreating: false });
              return {
                success: false,
                error: handledResponse.error || 'Failed to create retailer'
              };
            }
          } catch (error) {
            const errorMessage = transformApiErrorMessage(error);
            set({ error: errorMessage, isCreating: false });
            throw error;
          }
        },

        // Update existing retailer
        updateRetailer: async (id: string, retailerData: RetailerUpdate) => {
          set({ isUpdating: true, error: null });

          try {
            const response = await api.put<Retailer>(`${API_ENDPOINTS.RETAILER_BY_ID}/${id}`, retailerData);

            if (response.success && response.data) {
              // Refresh the list to get the updated data
              await get().fetchRetailers({ refresh: true });
              set({ isUpdating: false });
              return response;
            } else {
              set({ error: response.error || 'Failed to update retailer', isUpdating: false });
              return response;
            }
          } catch (error) {
            set({ error: 'Network error occurred while updating retailer', isUpdating: false });
            throw error;
          }
        },

        // Delete retailer
        deleteRetailer: async (id: string) => {
          set({ isDeleting: true, error: null });

          try {
            const response = await api.delete<void>(`${API_ENDPOINTS.RETAILER_BY_ID}/${id}`);

            if (response.success) {
              // Refresh the list to get the updated data
              await get().fetchRetailers({ refresh: true });
              set({ isDeleting: false });
              return response;
            } else {
              set({ error: response.error || 'Failed to delete retailer', isDeleting: false });
              return response;
            }
          } catch (error) {
            set({ error: 'Network error occurred while deleting retailer', isDeleting: false });
            throw error;
          }
        },

        // Get retailer by ID
        getRetailerById: async (id: string) => {
          set({ loading: true, error: null });

          try {
            const response = await api.get<Retailer>(`${API_ENDPOINTS.RETAILER_BY_ID}/${id}`);

            if (response.success && response.data) {
              set({ loading: false });
              return response;
            } else {
              set({ error: response.error || 'Failed to fetch retailer', loading: false });
              return response;
            }
          } catch (error) {
            set({ error: 'Network error occurred while fetching retailer', loading: false });
            throw error;
          }
        },

        // Search retailers
        searchRetailers: async (query: string, limit = 10) => {
          set({ loading: true, error: null });

          try {
            const queryParams = new URLSearchParams({
              search: query,
              limit: limit.toString(),
            });

            const response = await api.get<RetailerListResponse>(`${API_ENDPOINTS.RETAILERS}?${queryParams}`);

            // Handle API response with validation error support
            const handledResponse = handleMobileApiResponse(response.data || response, 'Failed to search retailers');

            const retailerData = handledResponse.data as any;
            if (handledResponse.success && retailerData) {
              // Update the store with the search results
              set({
                retailers: retailerData.retailers || retailerData,
                loading: false,
              });
            } else {
              set({
                error: handledResponse.error || 'Failed to search retailers',
                loading: false,
              });
            }

            // Return the proper API response format for the store
            if (handledResponse.success) {
              return {
                success: true,
                data: retailerData?.retailers || retailerData || []
              };
            } else {
              return {
                success: false,
                error: handledResponse.error || 'Failed to search retailers'
              };
            }
          } catch (error) {
            set({
              error: 'Network error occurred while searching retailers',
              loading: false,
            });
            console.error('Error searching retailers:', error);
            return {
              success: false,
              error: 'Network error occurred while searching retailers'
            };
          }
        },

        // UI Actions
        setSelectedRetailer: (retailer) => set({ selectedRetailer: retailer }),
        setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
        setPagination: (page, itemsPerPage) => set((state) => ({
          pagination: {
            ...state.pagination,
            currentPage: page,
            itemsPerPage: itemsPerPage || state.pagination.itemsPerPage,
          },
        })),
        clearError: () => set({ error: null }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        reset: () => {
          set({
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
            filters: { search: '' },
            isCreating: false,
            isUpdating: false,
            isDeleting: false,
            selectedRetailer: null,
            showFilters: false,
          });
        },
      }),
      {
        name: 'retailer-store',
        storage: createJSONStorage(() => AsyncStorage),
      }
    )
  )
);