import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Region } from '@pgn/shared';
import { api, ApiResponse } from '@/services/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { handleMobileApiResponse, transformApiErrorMessage } from './utils/errorHandling';

interface RegionStoreState {
  // Data state
  regions: Region[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  fetchRegions: (refresh?: boolean) => Promise<void>;
  searchRegions: (query: string, limit?: number) => Promise<ApiResponse<Region[]>>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  // Get regions for dropdown (formatted)
  getRegionOptions: () => Array<{ label: string; value: string }>;
}

// Cache duration - 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

export const useRegionStore = create<RegionStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        regions: [],
        loading: false,
        error: null,
        lastFetched: null,

        // Fetch all regions
        fetchRegions: async (refresh = false) => {
          const { lastFetched } = get();

          // Check if we have cached data and it's still valid
          if (!refresh && lastFetched && Date.now() - lastFetched < CACHE_DURATION && get().regions.length > 0) {
            return;
          }

          set({ loading: true, error: null });

          try {
            const response = await api.get<{ regions: Region[] }>(
              `${API_ENDPOINTS.REGIONS}?limit=1000` // Get all regions
            );

            // Handle API response with validation error support
            const handledResponse = handleMobileApiResponse(response.data || response, 'Failed to fetch regions');

            if (handledResponse.success && handledResponse.data) {
              const responseData = handledResponse.data as { regions?: Region[] };
              set({
                regions: responseData.regions || [],
                loading: false,
                lastFetched: Date.now(),
              });
            } else {
              set({
                error: handledResponse.error || 'Failed to fetch regions',
                loading: false,
              });
            }
          } catch (error) {
            const errorMessage = transformApiErrorMessage(error);
            set({
              error: errorMessage || 'Network error occurred while fetching regions',
              loading: false,
            });
          }
        },

        // Search regions
        searchRegions: async (query: string, limit = 20) => {
          try {
            const queryParams = new URLSearchParams({
              q: query,
              limit: limit.toString(),
            });

            const response = await api.get<{ regions: Region[] }>(
              `${API_ENDPOINTS.REGIONS_SEARCH}?${queryParams}`
            );

            if (response.success && response.data) {
              const searchResponse = response.data as { regions: Region[] };
              return {
                success: true,
                data: searchResponse.regions,
              };
            } else {
              return {
                success: false,
                error: response.error || 'Failed to search regions',
              };
            }
          } catch (error) {
            const errorMessage = transformApiErrorMessage(error);
            return {
              success: false,
              error: errorMessage || 'Network error occurred while searching regions',
            };
          }
        },

        // Get region options for dropdown (formatted as "city, state")
        getRegionOptions: () => {
          const { regions } = get();

          return regions
            .map(region => ({
              label: `${region.city}, ${region.state}`,
              value: region.id,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
        },

        // UI Actions
        clearError: () => set({ error: null }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        reset: () => {
          set({
            regions: [],
            loading: false,
            error: null,
            lastFetched: null,
          });
        },
      }),
      {
        name: 'region-store',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          regions: state.regions,
          lastFetched: state.lastFetched,
        }),
      }
    )
  )
);

// Export hooks for easier usage
export const useRegions = () => useRegionStore((state) => state.regions);
export const useRegionsLoading = () => useRegionStore((state) => state.loading);
export const useRegionsError = () => useRegionStore((state) => state.error);

export default useRegionStore;