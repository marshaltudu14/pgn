import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  Region,
  CreateRegionRequest,
  UpdateRegionRequest,
  RegionFilter,
  StateOption,
} from '@pgn/shared';
import { getAuthHeaders } from './utils/errorHandling';

interface RegionsStore {
  // State
  regions: Region[];
  states: StateOption[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  createError: string | null;
  filter: RegionFilter;

  // Actions
  fetchRegions: (filters?: RegionFilter) => Promise<void>;
  createRegion: (data: CreateRegionRequest) => Promise<Region>;
  updateRegion: (id: string, data: UpdateRegionRequest) => Promise<Region>;
  deleteRegion: (id: string) => Promise<void>;
  fetchStates: () => Promise<void>;
  searchRegions: (searchTerm: string) => Promise<void>;
  setFilter: (filter: Partial<RegionFilter>) => void;
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
      error: null,
      createError: null,
      filter: {
        sort_by: 'city',
        sort_order: 'asc',
      },

      // Fetch regions with filtering (limited to 10 results)
      fetchRegions: async (filters: RegionFilter = {}) => {
        try {
          set({ isLoading: true, error: null });

          // Ensure default sort values are always included
          const sortBy = filters.sort_by || 'city';
          const sortOrder = filters.sort_order || 'asc';

          const queryParams = new URLSearchParams();
          if (filters.state) queryParams.append('state', filters.state);
          if (filters.city) queryParams.append('city', filters.city);
          queryParams.append('sort_by', sortBy);
          queryParams.append('sort_order', sortOrder);
          queryParams.append('limit', '10'); // Always limit to 10 results

          const response = await fetch(`/api/regions?${queryParams.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch regions');
          }

          const data = await response.json();

          set({
            regions: data, // Direct array of regions
            isLoading: false,
            filter: {
              sort_by: sortBy,
              sort_order: sortOrder,
              ...filters,
            },
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch regions',
            isLoading: false,
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
          const { filter } = get();
          await get().fetchRegions(filter);

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
          const { filter } = get();
          await get().fetchRegions(filter);

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

          // Refresh the regions list
          const { filter } = get();
          await get().fetchRegions(filter);

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

  
      // Search regions (limited to 10 results)
      searchRegions: async (searchTerm: string) => {
        try {
          set({ isLoading: true, error: null });

          const store = get();
          const sortBy = store.filter.sort_by || 'city';
          const sortOrder = store.filter.sort_order || 'asc';

          const queryParams = new URLSearchParams();
          queryParams.append('q', searchTerm);
          queryParams.append('limit', '10'); // Always limit to 10 results
          queryParams.append('sort_by', sortBy);
          queryParams.append('sort_order', sortOrder);

          const response = await fetch(`/api/regions/search?${queryParams.toString()}`, {
            headers: getAuthHeaders(),
          });
          if (!response.ok) {
            throw new Error('Failed to search regions');
          }
          const data = await response.json();

          set({
            regions: data, // Direct array of regions
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to search regions',
            isLoading: false,
          });
        }
      },

      // Set filter
      setFilter: (filter: Partial<RegionFilter>) => {
        const currentFilter = get().filter;
        set({
          filter: { ...currentFilter, ...filter },
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
          error: null,
          createError: null,
          filter: {
            sort_by: 'city',
            sort_order: 'asc',
          },
        });
      },
    }),
    {
      name: 'regions-store',
    }
  )
);