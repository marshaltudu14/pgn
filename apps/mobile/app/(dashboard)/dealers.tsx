import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Store, Search, Plus } from 'lucide-react-native';
import { useDealerStore } from '@/store/dealer-store';
import { Dealer } from '@pgn/shared';
import { COLORS } from '@/constants';
import CreateDealerModal from '@/components/CreateDealerModal';
import Spinner from '@/components/Spinner';

export default function DealersScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const {
    dealers,
    fetchDealers,
    searchDealers,
    setSelectedDealer,
    pagination,
  } = useDealerStore();

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const flatListRef = useRef<FlatList<Dealer>>(null);

  const loadDealers = useCallback(async (page = 1, refresh = false) => {
    try {
      if (page === 1) {
        setIsInitialLoad(true);
      }
      await fetchDealers({ page, refresh });
    } catch (error) {
      console.error('Error loading dealers:', error);
    } finally {
      setIsInitialLoad(false);
      setIsLoadingSearch(false);
    }
  }, [fetchDealers]);

  useEffect(() => {
    loadDealers(1, true);
  }, [loadDealers]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      setCurrentPage(1);
      await fetchDealers({ page: 1, refresh: true });
    } catch (error) {
      console.error('Error refreshing dealers:', error);
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
        await searchDealers(query);
        setCurrentPage(1);
        setHasMore(true);
      } catch (error) {
        console.error('Error searching dealers:', error);
      } finally {
        setIsLoadingSearch(false);
      }
    } else {
      loadDealers(1, true);
    }
  };

  const loadMoreDealers = async () => {
    if (!hasMore || isLoadingSearch) return;

    const nextPage = currentPage + 1;
    try {
      setIsLoadingSearch(true);
      const result = await fetchDealers({ page: nextPage });
      setHasMore(result.pagination.currentPage < result.pagination.totalPages);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error loading more dealers:', error);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const handleDealerPress = (dealer: Dealer) => {
    setSelectedDealer(dealer);
    // For now, show a simple alert. Later can navigate to detail screen
    router.push('/dealers' as any);
  };

  const renderDealerItem = ({ item }: { item: Dealer }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleDealerPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.listItemContent}>
        <View style={styles.listItemMain}>
          <View style={styles.listItemHeader}>
            <Store size={20} color={colors.primary} style={styles.listItemIcon} />
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

        <View style={[styles.listItemBadge, { backgroundColor: colors.iconBg }]}>
          <Text style={[styles.listItemBadgeText, { color: colors.textSecondary }]}>
            D-{item.id.slice(-4)}
          </Text>
        </View>
      </View>

      <View style={[styles.listItemSeparator, { backgroundColor: colors.separator }]} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Compact Header */}
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Store size={18} color={colors.primary} style={styles.titleIcon} />
            <Text style={[styles.title, { color: colors.text }]}>
              Dealers
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
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
            placeholder="Search dealers..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Dealers List */}
      <FlatList
        data={dealers}
        renderItem={renderDealerItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textSecondary}
          />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={() => {
          // Don't show empty state during initial load
          if (isInitialLoad) return null;

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
                <Store size={40} color={COLORS.SAFFRON} />
              </View>
              <Text style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: '700',
                marginBottom: 8,
                textAlign: 'center',
              }}>
                No Dealers Found
              </Text>
              <Text style={{
                color: colors.textSecondary,
                fontSize: 16,
                textAlign: 'center',
                lineHeight: 22,
                marginBottom: 24,
              }}>
                {searchQuery ? 'Try adjusting your search terms' : 'Add your first dealer to get started'}
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
                    Add Dealer
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* Loading - only show during initial load */}
      {isInitialLoad && (
        <View style={styles.loadingContainer}>
          <Spinner size={24} color={COLORS.SAFFRON} />
        </View>
      )}

      {/* Create Dealer Modal */}
      <CreateDealerModal
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
});