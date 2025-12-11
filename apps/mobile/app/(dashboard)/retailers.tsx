import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Users, Search, Plus } from 'lucide-react-native';
import { useRetailerStore } from '@/store/retailer-store';
import { Retailer } from '@pgn/shared';
import { COLORS } from '@/constants/theme';
import CreateRetailerModal from '@/components/CreateRetailerModal';
import Spinner from '@/components/Spinner';

export default function RetailersScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const {
    retailers,
    fetchRetailers,
    searchRetailers,
    setSelectedRetailer,
    pagination,
    loading,
  } = useRetailerStore();

  const [isInitialLoad, setIsInitialLoad] = useState(true);


  const loadRetailers = useCallback(async (page = 1, refresh = false) => {
    try {
      if (page === 1) {
        setIsInitialLoad(true);
      }
      await fetchRetailers({ page, refresh });
    } catch (error) {
      console.error('Error loading retailers:', error);
    } finally {
      setIsInitialLoad(false);
      setIsLoadingSearch(false);
    }
  }, [fetchRetailers]);

  useEffect(() => {
    loadRetailers(1, true);
  }, [loadRetailers]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      setCurrentPage(1);
      await fetchRetailers({ page: 1, refresh: true });
    } catch (error) {
      console.error('Error refreshing retailers:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsLoadingSearch(true);
    if (query.trim()) {
      try {
        // Clear existing data when starting search
        await searchRetailers(query);
        setCurrentPage(1);
        setHasMore(true);
      } catch (error) {
        console.error('Error searching retailers:', error);
      } finally {
        setIsLoadingSearch(false);
      }
    } else {
      loadRetailers(1, true);
    }
  };

  const loadMoreRetailers = async () => {
    if (!hasMore || isLoadingSearch) return;

    const nextPage = currentPage + 1;
    try {
      setIsLoadingSearch(true);
      const result = await fetchRetailers({ page: nextPage });
      setHasMore(result.pagination.currentPage < result.pagination.totalPages);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error loading more retailers:', error);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const handleRetailerPress = (retailer: Retailer) => {
    setSelectedRetailer(retailer);
    router.push('/retailers' as any);
  };

  const renderRetailerItem = ({ item }: { item: Retailer }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleRetailerPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.listItemContent}>
        <View style={styles.listItemMain}>
          <View style={styles.listItemHeader}>
            <Users size={20} color={COLORS.SAFFRON} style={styles.listItemIcon} />
            <View style={styles.listItemTitles}>
              <Text style={[styles.listItemTitle, { color: colors.text }]}>
                {item.shop_name || 'N/A'}
              </Text>
              <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                {item.name}
              </Text>
            </View>
          </View>

          {/* Contact Info */}
          <View style={styles.listItemDetails}>
            {item.email && (
              <Text style={[styles.listItemDetail, { color: colors.textSecondary }]}>
                {item.email}
              </Text>
            )}
            {item.phone && (
              <Text style={[styles.listItemDetail, { color: colors.textSecondary }]}>
                {item.phone}
              </Text>
            )}
            {item.address && (
              <Text style={[styles.listItemDetail, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.address}
              </Text>
            )}
          </View>
        </View>

        {/* Hide ID - removed from display */}
      </View>

      <View style={[styles.listItemSeparator, { backgroundColor: colors.separator }]} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Users size={18} color={COLORS.SAFFRON} style={styles.titleIcon} />
            <Text style={[styles.title, { color: colors.text }]}>
              Retailers ({pagination.totalItems})
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: COLORS.SAFFRON }]}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Search size={16} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text, backgroundColor: 'transparent' }]}
            placeholder="Search retailers..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Retailers List */}
      <FlatList
        data={retailers}
        renderItem={renderRetailerItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textSecondary}
          />
        }
        onEndReached={loadMoreRetailers}
        onEndReachedThreshold={0.1}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={() => {
          // Don't show empty state during loading from the store or when searching
          if (loading || isLoadingSearch) return null;

          return (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 80,
              paddingHorizontal: 40,
            }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(255, 153, 51, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Users size={40} color={COLORS.SAFFRON} />
              </View>
              <Text style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: '700',
                marginBottom: 8,
                textAlign: 'center',
              }}>
                No Retailers Found
              </Text>
              <Text style={{
                color: colors.textSecondary,
                fontSize: 16,
                textAlign: 'center',
                lineHeight: 22,
                marginBottom: 24,
              }}>
                {searchQuery ? 'Try adjusting your search terms' : 'Add your first retailer to get started'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.SAFFRON,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 24,
                  }}
                  onPress={() => setShowCreateModal(true)}
                >
                  <Text style={{
                    color: '#ffffff',
                    fontSize: 16,
                    fontWeight: '600',
                  }}>
                    Add Retailer
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListFooterComponent={() => {
          if (isLoadingSearch && !isInitialLoad) {
            return (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.SAFFRON} />
              </View>
            );
          }
          return null;
        }}
      />

      {/* Loading - only show during loading from store */}
      {loading && !retailers.length && (
        <View style={styles.loadingContainer}>
          <Spinner size={24} color={COLORS.SAFFRON} />
        </View>
      )}

      {/* Search Loading Overlay */}
      {isLoadingSearch && searchQuery.trim() !== '' && (
        <View style={styles.searchLoadingContainer}>
          <Spinner size={24} color={COLORS.SAFFRON} />
        </View>
      )}

      {/* Create Retailer Modal */}
      <CreateRetailerModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    fontWeight: '400',
  },
  listItem: {
    backgroundColor: 'transparent',
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  listItemMain: {
    flex: 1,
  },
  listItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  listItemIcon: {
    marginRight: 12,
  },
  listItemTitles: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  listItemDetails: {
    paddingLeft: 32,
  },
  listItemDetail: {
    fontSize: 14,
    marginBottom: 2,
  },
  listItemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  listItemBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listItemSeparator: {
    height: 1,
    marginLeft: 16,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    zIndex: 1000,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  searchLoadingContainer: {
    position: 'absolute',
    top: 120, // Position below header
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});