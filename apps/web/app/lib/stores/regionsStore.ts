import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  Region,
  CreateRegionRequest,
  UpdateRegionRequest,
  RegionListParams,
  StateOption,
} from '@pgn/shared';
import { getAuthHeaders } from './utils/errorHandling';

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface RegionsStore {
  // State
  regions: Region[];
  states: StateOption[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isFetchingMore: boolean;
  error: string | null;
  createError: string | null;
  pagination: PaginationState;
  filters: RegionListParams;
  hasMore: boolean;

  // Actions
  fetchRegions: (params?: RegionListParams) => Promise<void>;
  fetchMoreRegions: () => Promise<void>;
  createRegion: (data: CreateRegionRequest) => Promise<Region>;
  updateRegion: (id: string, data: UpdateRegionRequest) => Promise<Region>;
  deleteRegion: (id: string) => Promise<void>;
  fetchStates: () => Promise<void>;
  searchRegions: (searchTerm: string, params?: Omit<RegionListParams, 'search'>) => Promise<void>;
  refreshRegionStats: (regionIds?: string[]) => Promise<void>;
  setFilters: (filters: Partial<RegionListParams>) => void;
  setPagination: (page?: number, itemsPerPage?: number) => void;
  clearError: () => void;
  clearCreateError: () => void;
  reset: () => void;
}

const initialState: Region[] = [];

export const useRegionsStore = create<RegionsStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      regions: initialState,
      states: [],
      isLoading: true, // Start with loading true since we fetch data immediately
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      isFetchingMore: false,
      error: null,
      createError: null,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
      },
      filters: {
        page: 1,
        limit: 20,
        sort_by: 'updated_at',
        sort_order: 'desc',
      },
      hasMore: true,

      // Fetch regions with pagination and filtering
      fetchRegions: async (params: RegionListParams = {}) => {
        try {
          const store = get();
          const page = params.page ?? 1;
          const isInitialLoad = page === 1;

          if (isInitialLoad) {
            set({ isLoading: true, error: null });
          }

          // Build query params, only including defined values
          const queryParams = new URLSearchParams();

          const addParam = (key: string, value: string | number | undefined | null) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, value.toString());
            }
          };

          addParam('page', page.toString());
          addParam('limit', (params.limit ?? store.filters.limit ?? 20).toString());
          addParam('search', params.search ?? store.filters.search);
          addParam('state', params.state ?? store.filters.state);
          addParam('city', params.city ?? store.filters.city);
          addParam('sort_by', params.sort_by ?? store.filters.sort_by);
          addParam('sort_order', params.sort_order ?? store.filters.sort_order);

          // Update filters with only the params that were passed
          // If no params passed, keep the existing filters
          const updatedFilters = Object.keys(params).length > 0
            ? {
                ...store.filters,
                ...Object.fromEntries(
                  Object.entries(params).filter(([_, value]) => value !== undefined)
                ),
              }
            : store.filters;

          const response = await fetch(`/api/regions?${queryParams.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch regions');
          }

          const data = await response.json();

          // Determine if there are more pages
          const hasMore = data.pagination.currentPage < data.pagination.totalPages;

          // Check if this is a search request (has search parameter)
          const isSearchRequest = params.search !== undefined && params.search !== store.filters.search;

          // If page 1 AND it's a search request OR initial load, replace regions
          // Otherwise, we let fetchMoreRegions handle appending
          const shouldReplaceRegions = isInitialLoad && (isSearchRequest || !store.regions.length);
          const newRegions = shouldReplaceRegions ? data.regions : store.regions;

          set({
            regions: newRegions,
            pagination: data.pagination,
            filters: updatedFilters,
            hasMore,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch regions',
            isLoading: false,
          });
        }
      },

      // Fetch more regions for infinite scroll
      fetchMoreRegions: async () => {
        try {
          const store = get();
          const nextPage = (store.pagination.currentPage || 1) + 1;

          // Don't fetch if already at the last page, already fetching, or if there's an active search
          if (!store.hasMore || store.isFetchingMore || store.filters.search) {
            return;
          }

          set({ isFetchingMore: true });

          // Fetch the next page
          const queryParams = new URLSearchParams();
          queryParams.append('page', nextPage.toString());
          queryParams.append('limit', (store.filters.limit || 20).toString());
          queryParams.append('sort_by', store.filters.sort_by || 'city');
          queryParams.append('sort_order', store.filters.sort_order || 'asc');
          // Preserve any existing filters except search
          if (store.filters.state) {
            queryParams.append('state', store.filters.state);
          }
          if (store.filters.city) {
            queryParams.append('city', store.filters.city);
          }

          const response = await fetch(`/api/regions?${queryParams.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch more regions');
          }

          const data = await response.json();

          // Append new regions to existing ones
          const allRegions = [...store.regions, ...data.regions];

          set({
            regions: allRegions,
            pagination: data.pagination,
            hasMore: data.pagination.currentPage < data.pagination.totalPages,
            isFetchingMore: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch more regions',
            isFetchingMore: false,
          });
        }
      },

      // Create a new region
      createRegion: async (data: CreateRegionRequest) => {
        try {
          set({ isCreating: true, error: null, createError: null });

          const response = await fetch('/api/regions', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create region');
          }

          const newRegion = await response.json();

          // Refresh the regions list
          const { filters } = get();
          await get().fetchRegions(filters);

          set({ isCreating: false, createError: null });
          return newRegion;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create region',
            createError: error instanceof Error ? error.message : 'Failed to create region',
            isCreating: false,
          });
          throw error;
        }
      },

      // Update an existing region
      updateRegion: async (id: string, data: UpdateRegionRequest) => {
        try {
          set({ isUpdating: true, error: null });

          const response = await fetch(`/api/regions/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update region');
          }

          const updatedRegion = await response.json();

          // Refresh the regions list
          const { filters } = get();
          await get().fetchRegions(filters);

          set({ isUpdating: false });
          return updatedRegion;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update region',
            isUpdating: false,
          });
          throw error;
        }
      },

      // Delete a region
      deleteRegion: async (id: string) => {
        try {
          set({ isDeleting: true, error: null });

          const response = await fetch(`/api/regions/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete region');
          }

          // Re-fetch regions with current filters after successful deletion
          const { filters } = get();
          await get().fetchRegions(filters);

          set({ isDeleting: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete region',
            isDeleting: false,
          });
          throw error;
        }
      },

      // Fetch all states
      fetchStates: async () => {
        try {
          const response = await fetch('/api/regions/states', {
            headers: getAuthHeaders(),
          });
          if (!response.ok) {
            throw new Error('Failed to fetch states');
          }
          const statesResponse = await response.json();
          set({ states: statesResponse.data });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch states' });
        }
      },

  
      // Search regions with pagination
      searchRegions: async (searchTerm: string, params: Omit<RegionListParams, 'search'> = {}) => {
        try {
          set({ isLoading: true, error: null });

          const store = get();
          const searchParams = {
            page: params.page || 1,
            limit: params.limit || store.filters.limit,
            sort_by: params.sort_by || store.filters.sort_by,
            sort_order: params.sort_order || store.filters.sort_order,
          };

          const queryParams = new URLSearchParams();
          queryParams.append('q', searchTerm);
          queryParams.append('page', searchParams.page?.toString() || '1');
          queryParams.append('limit', searchParams.limit?.toString() || '10');
          queryParams.append('sort_by', searchParams.sort_by || 'city');
          queryParams.append('sort_order', searchParams.sort_order || 'asc');

          const response = await fetch(`/api/regions/search?${queryParams.toString()}`, {
            headers: getAuthHeaders(),
          });
          if (!response.ok) {
            throw new Error('Failed to search regions');
          }
          const data = await response.json();

          set({
            regions: data.regions,
            pagination: data.pagination,
            filters: {
              ...store.filters,
              search: searchTerm,
              ...searchParams,
            },
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to search regions',
            isLoading: false,
          });
        }
      },

      // Refresh region statistics for real-time updates
      refreshRegionStats: async (regionIds?: string[]) => {
        try {
          const queryParams = new URLSearchParams();
          if (regionIds && regionIds.length > 0) {
            queryParams.append('region_ids', JSON.stringify(regionIds));
          }

          const response = await fetch(`/api/regions/assign?${queryParams.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(),
          });

          if (!response.ok) {
            throw new Error('Failed to refresh region statistics');
          }

          const result = await response.json();

          if (result.success && result.data) {
            set(state => {
              // Update employee counts for the affected regions
              const updatedRegions = state.regions.map(region => {
                const updatedStats = result.data.find((stats: { id: string; employee_count: number }) => stats.id === region.id);
                if (updatedStats) {
                  return {
                    ...region,
                    employee_count: updatedStats.employee_count,
                  };
                }
                return region;
              });

              return {
                regions: updatedRegions,
              };
            });
          }
        } catch (error) {
          console.error('Error refreshing region stats:', error);
        }
      },

      // Set filters
      setFilters: (filters: Partial<RegionListParams>) => {
        const currentFilters = get().filters;
        const newFilters = { ...currentFilters, ...filters };
        set({
          filters: newFilters,
        });
      },

      // Set pagination
      setPagination: (page?: number, itemsPerPage?: number) => {
        const currentFilters = get().filters;
        const newFilters = { ...currentFilters };

        if (page !== undefined) {
          newFilters.page = page;
        }
        if (itemsPerPage !== undefined) {
          newFilters.limit = itemsPerPage;
        }

        set({
          filters: newFilters,
        });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Clear create error
      clearCreateError: () => {
        set({ createError: null });
      },

      // Reset store
      reset: () => {
        set({
          regions: initialState,
          states: [],
          isLoading: true, // Start with loading true since we fetch data immediately
          isCreating: false,
          isUpdating: false,
          isDeleting: false,
          isFetchingMore: false,
          error: null,
          createError: null,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 10,
          },
          filters: {
            page: 1,
            limit: 10,
            sort_by: 'city',
            sort_order: 'asc',
          },
          hasMore: true,
        });
      },
    }),
    {
      name: 'regions-store',
    }
  )
);