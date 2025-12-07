'use client';

import { useEffect, useState } from 'react';
import { useRegionsStore } from '@/app/lib/stores/regionsStore';
import { CreateRegionRequest, UpdateRegionRequest, Region } from '@pgn/shared';
import { RegionsTable, RegionFormModal } from '@/components/regions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function RegionsManagementClient() {
  const {
    regions,
    states,
    isLoading,
    isCreating,
    isUpdating,
    error,
    createError,
    pagination,
    filters,
    createRegion,
    updateRegion,
    deleteRegion,
    fetchRegions,
    searchRegions,
    refreshRegionStats,
    setFilters,
    setPagination,
    clearError,
    clearCreateError,
  } = useRegionsStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);

  // Load initial data only once
  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]); // Empty dependency array to run only once

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchRegions(searchTerm.trim());
      } else {
        fetchRegions();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchRegions, searchRegions]);

  // Handle page changes
  const handlePageChange = (page: number) => {
    setPagination(page);
    if (searchTerm.trim()) {
      searchRegions(searchTerm.trim(), { ...filters, page });
    } else {
      fetchRegions({ ...filters, page });
    }
  };

  
  // Handle sort changes
  const handleSortChange = (sortBy: 'state' | 'city' | 'employee_count', sortOrder: 'asc' | 'desc') => {
    setFilters({ sort_by: sortBy, sort_order: sortOrder, page: 1 });
    if (searchTerm.trim()) {
      searchRegions(searchTerm.trim(), { ...filters, sort_by: sortBy, sort_order: sortOrder, page: 1 });
    } else {
      fetchRegions({ ...filters, sort_by: sortBy, sort_order: sortOrder, page: 1 });
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Handle refresh stats
  const handleRefreshStats = async () => {
    setIsRefreshingStats(true);
    try {
      await refreshRegionStats();
      toast.success('Employee counts refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh stats:', error);
      toast.error('Failed to refresh employee counts');
    } finally {
      setIsRefreshingStats(false);
    }
  };

  // Handle region creation
  // Handle modal close with error clearing
  const handleCreateModalClose = (open: boolean) => {
    if (!open) {
      clearCreateError();
    }
    setShowCreateModal(open);
  };

  // Handle region creation
  const handleCreateRegion = async (data: CreateRegionRequest | UpdateRegionRequest) => {
    try {
      // Clear any existing create error when starting creation
      clearCreateError();

      // Ensure we have all required fields for creation
      if ('state' in data && data.state && data.city) {
        await createRegion({
          state: data.state,
          city: data.city
        });
        setShowCreateModal(false);
        toast.success('Region created successfully');
      } else {
        toast.error('State and city are required');
      }
    } catch (error) {
      console.error('Failed to create region:', error);
      // Don't show toast error here - let the modal display the specific error
      // The user can see the error in the modal and can correct it
    }
  };

  // Handle region update
  const handleUpdateRegion = async (id: string, data: UpdateRegionRequest) => {
    try {
      await updateRegion(id, data);
      setEditingRegion(null);
      toast.success('Region updated successfully');
    } catch (error) {
      console.error('Failed to update region:', error);
      toast.error('Failed to update region');
    }
  };

  // Handle region deletion
  const handleDeleteRegion = async (id: string) => {
    try {
      await deleteRegion(id);
      toast.success('Region deleted successfully');
    } catch (error) {
      console.error('Failed to delete region:', error);
      toast.error('Failed to delete region');
    }
  };

  // Handle edit
  const handleEdit = (region: Region) => {
    setEditingRegion(region);
  };

  
  return (
    <div className="min-h-screen bg-background dark:bg-black text-foreground">
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Regions Management</h1>
            <p className="text-muted-foreground">
              {pagination.totalItems} region{pagination.totalItems !== 1 ? 's' : ''} found
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="cursor-pointer hover:bg-primary/90 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Region
          </Button>
        </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2 lg:p-4 flex justify-between items-center">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <Button variant="outline" size="sm" onClick={clearError} className="cursor-pointer">
            Dismiss
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="px-2 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Regions Table */}
      <RegionsTable
        regions={regions.map(r => ({
          ...r,
          created_at: r.created_at || '',
          updated_at: r.updated_at || ''
        }))}
        isLoading={isLoading}
        pagination={pagination}
        filters={filters}
        onEdit={handleEdit}
        onDelete={handleDeleteRegion}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        onRefreshStats={handleRefreshStats}
        isRefreshing={isRefreshingStats}
      />

      {/* Create Region Modal */}
      <RegionFormModal
        open={showCreateModal}
        onOpenChange={handleCreateModalClose}
        onSubmit={handleCreateRegion}
        isSubmitting={isCreating}
        states={states}
        title="Add New Region"
        submitError={createError}
      />

      {/* Edit Region Modal */}
      <RegionFormModal
        open={!!editingRegion}
        onOpenChange={(open) => !open && setEditingRegion(null)}
        onSubmit={(data) => editingRegion && handleUpdateRegion(editingRegion.id, {
          city: data.city
        })}
        isSubmitting={isUpdating}
        states={states}
        initialData={editingRegion ? {
          state: editingRegion.state,
          city: editingRegion.city,
        } : undefined}
        title="Edit Region"
      />
      </div>
    </div>
  );
}