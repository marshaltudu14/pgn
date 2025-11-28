import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dealer, DealerFilters, DealerInsert, DealerUpdate, DealerListResponse } from '@pgn/shared';
import { api, ApiResponse } from '@/services/api-client';
import { API_ENDPOINTS } from '@/constants/api';

interface DealerStoreState {
  // Data state
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

  // UI state
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  selectedDealer: Dealer | null;
  showFilters: boolean;

  // Actions
  fetchDealers: (params?: {
    page?: number;
    itemsPerPage?: number;
    filters?: DealerFilters;
    refresh?: boolean;
  }) => Promise<DealerListResponse>;
  createDealer: (dealerData: DealerInsert) => Promise<ApiResponse<Dealer>>;
  updateDealer: (id: string, dealerData: DealerUpdate) => Promise<ApiResponse<Dealer>>;
  deleteDealer: (id: string) => Promise<ApiResponse<void>>;
  getDealerById: (id: string) => Promise<ApiResponse<Dealer>>;
  searchDealers: (query: string, limit?: number) => Promise<ApiResponse<Dealer[]>>;

  // UI actions
  setSelectedDealer: (dealer: Dealer | null) => void;
  setFilters: (filters: Partial<DealerFilters>) => void;
  setPagination: (page: number, itemsPerPage?: number) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useDealerStore = create<DealerStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
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
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        selectedDealer: null,
        showFilters: false,

        // Fetch dealers with pagination and filtering
        fetchDealers: async (params = {}) => {
          const {
            page = 1,
            itemsPerPage = 20,
            filters,
            refresh = false
          } = params;

          const currentFilters = { ...get().filters, ...filters };
          const currentPage = refresh ? 1 : page;

          set({ loading: true, error: null });

          try {
            const queryParams = new URLSearchParams({
              page: currentPage.toString(),
              limit: itemsPerPage.toString(),
              ...(currentFilters.search && { search: currentFilters.search }),
              ...(currentFilters.shop_name && { shop_name: currentFilters.shop_name }),
              ...(currentFilters.email && { email: currentFilters.email }),
              ...(currentFilters.phone && { phone: currentFilters.phone }),
            });

            const response = await api.get<DealerListResponse>(
              `${API_ENDPOINTS.DEALERS}?${queryParams}`
            );

            if (response.success && response.data) {
              set({
                dealers: response.data.dealers,
                pagination: {
                  currentPage: response.data.pagination.currentPage,
                  totalPages: response.data.pagination.totalPages,
                  totalItems: response.data.pagination.totalItems,
                  itemsPerPage: response.data.pagination.itemsPerPage,
                  hasNextPage: currentPage < response.data.pagination.totalPages,
                  hasPreviousPage: currentPage > 1,
                },
                loading: false,
              });
            } else {
              set({
                error: response.error || 'Failed to fetch dealers',
                loading: false,
              });
            }
            return response.data || {
              dealers: [],
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
              error: 'Network error occurred while fetching dealers',
              loading: false,
            });
            throw error;
          }
        },

        // Create new dealer
        createDealer: async (dealerData: DealerInsert) => {
          set({ isCreating: true, error: null });

          try {
            const response = await api.post<Dealer>(API_ENDPOINTS.DEALERS, dealerData);

            if (response.success && response.data) {
              // Refresh the list to get the updated data
              await get().fetchDealers({ refresh: true });
              set({ isCreating: false });
              return response;
            } else {
              set({ error: response.error || 'Failed to create dealer', isCreating: false });
              return response;
            }
          } catch (error) {
            set({ error: 'Network error occurred while creating dealer', isCreating: false });
            throw error;
          }
        },

        // Update existing dealer
        updateDealer: async (id: string, dealerData: DealerUpdate) => {
          set({ isUpdating: true, error: null });

          try {
            const response = await api.put<Dealer>(`${API_ENDPOINTS.DEALER_BY_ID}/${id}`, dealerData);

            if (response.success && response.data) {
              // Refresh the list to get the updated data
              await get().fetchDealers({ refresh: true });
              set({ isUpdating: false });
              return response;
            } else {
              set({ error: response.error || 'Failed to update dealer', isUpdating: false });
              return response;
            }
          } catch (error) {
            set({ error: 'Network error occurred while updating dealer', isUpdating: false });
            throw error;
          }
        },

        // Delete dealer
        deleteDealer: async (id: string) => {
          set({ isDeleting: true, error: null });

          try {
            const response = await api.delete<void>(`${API_ENDPOINTS.DEALER_BY_ID}/${id}`);

            if (response.success) {
              // Refresh the list to get the updated data
              await get().fetchDealers({ refresh: true });
              set({ isDeleting: false });
              return response;
            } else {
              set({ error: response.error || 'Failed to delete dealer', isDeleting: false });
              return response;
            }
          } catch (error) {
            set({ error: 'Network error occurred while deleting dealer', isDeleting: false });
            throw error;
          }
        },

        // Get dealer by ID
        getDealerById: async (id: string) => {
          set({ loading: true, error: null });

          try {
            const response = await api.get<Dealer>(`${API_ENDPOINTS.DEALER_BY_ID}/${id}`);

            if (response.success && response.data) {
              set({ loading: false });
              return response;
            } else {
              set({ error: response.error || 'Failed to fetch dealer', loading: false });
              return response;
            }
          } catch (error) {
            set({ error: 'Network error occurred while fetching dealer', loading: false });
            throw error;
          }
        },

        // Search dealers
        searchDealers: async (query: string, limit = 10) => {
          try {
            const queryParams = new URLSearchParams({
              search: query,
              limit: limit.toString(),
            });

            const response = await api.get<Dealer[]>(`${API_ENDPOINTS.DEALERS}?${queryParams}`);

            if (response.success && response.data) {
              return response;
            } else {
              return response;
            }
          } catch (error) {
            console.error('Error searching dealers:', error);
            throw error;
          }
        },

        // UI Actions
        setSelectedDealer: (dealer) => set({ selectedDealer: dealer }),
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
            filters: { search: '' },
            isCreating: false,
            isUpdating: false,
            isDeleting: false,
            selectedDealer: null,
            showFilters: false,
          });
        },
      }),
      {
        name: 'dealer-store',
        storage: createJSONStorage(() => AsyncStorage),
      }
    )
  )
);