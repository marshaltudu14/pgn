'use client';

import { useEffect, useState, useRef } from 'react';
import { useRegionsStore } from '@/app/lib/stores/regionsStore';
import { CreateRegionRequest, UpdateRegionRequest, Region } from '@pgn/shared';
import { RegionsTable, RegionFormModal } from '@/components/regions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Search, Plus } from 'lucide-react';
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
    filter,
    pagination,
    createRegion,
    updateRegion,
    deleteRegion,
    setPagination,
    clearError,
    clearCreateError,
  } = useRegionsStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Use refs to track current values to prevent infinite loops
  const searchTermRef = useRef(searchTerm);
  const prevFilterRef = useRef(filter);
  const prevPaginationRef = useRef(pagination);

  // Load initial data only once
  useEffect(() => {
    const store = useRegionsStore.getState();
    store.fetchRegions();
    store.fetchStates();
  }, []); // Empty dependency array to run only once

  // Update ref when searchTerm changes
  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  // Handle search with debounce - only depends on searchTerm
  useEffect(() => {
    const timer = setTimeout(() => {
      const store = useRegionsStore.getState();

      if (searchTermRef.current.trim()) {
        store.searchRegions(searchTermRef.current);
      } else {
        store.fetchRegions(store.filter, store.pagination);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]); // Only depend on searchTerm

  // Handle filter and pagination changes
  useEffect(() => {
    const store = useRegionsStore.getState();
    const currentFilter = store.filter;
    const currentPagination = store.pagination;

    // Only fetch if filter or pagination actually changed
    if (
      JSON.stringify(currentFilter) !== JSON.stringify(prevFilterRef.current) ||
      JSON.stringify(currentPagination) !== JSON.stringify(prevPaginationRef.current)
    ) {
      if (!searchTermRef.current.trim()) {
        store.fetchRegions(currentFilter, currentPagination);
      }
      prevFilterRef.current = { ...currentFilter };
      prevPaginationRef.current = { ...currentPagination };
    }
  }, [filter, pagination]); // Monitor changes but prevent infinite loops

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination({ page });
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
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="hover:text-primary transition-colors">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Regions</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Regions Management</h1>
            <p className="text-muted-foreground">
              {regions.total} region{regions.total !== 1 ? 's' : ''} found
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
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-4 flex justify-between items-center">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <Button variant="outline" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="p-4 lg:p-6 border-b border-border bg-white dark:bg-black">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search regions by state, district, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Regions Table */}
      <RegionsTable
        regions={regions}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDeleteRegion}
        onPageChange={handlePageChange}
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