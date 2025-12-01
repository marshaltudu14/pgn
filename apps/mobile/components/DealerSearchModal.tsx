import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Search, Store, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useDealerStore } from '@/store/dealer-store';
import { Dealer } from '@pgn/shared';
import { COLORS } from '@/constants';

interface DealerSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onDealerSelect: (dealer: Dealer) => void;
  selectedDealerId?: string;
}

export default function DealerSearchModal({
  visible,
  onClose,
  onDealerSelect,
  selectedDealerId,
}: DealerSearchModalProps) {
  const { resolvedTheme } = useTheme();
  const colors = useThemeColors();
  const { dealers, loading, hasMore, fetchDealers, searchDealers } = useDealerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setPage(1);
      loadInitialDealers();
    }
  }, [visible]);

  const loadInitialDealers = useCallback(async () => {
    try {
      await fetchDealers({ page: 1, itemsPerPage: 20, refresh: true });
    } catch (error) {
      console.error('Error loading dealers:', error);
    }
  }, [fetchDealers]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setPage(1);
    try {
      await searchDealers(query, 20);
    } catch (error) {
      console.error('Error searching dealers:', error);
    }
  };

  const loadMoreDealers = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      await fetchDealers({ page: nextPage, itemsPerPage: 20 });
      setPage(nextPage);
    } catch (error) {
      console.error('Error loading more dealers:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, fetchDealers]);

  const handleDealerSelect = useCallback((dealer: Dealer) => {
    onDealerSelect(dealer);
    onClose();
  }, [onDealerSelect, onClose]);

  const renderDealerItem = ({ item }: { item: Dealer }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleDealerSelect(item)}
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

        <View style={[styles.listItemBadge, { backgroundColor: selectedDealerId === item.id ? colors.primary : colors.iconBg }]}>
          {selectedDealerId === item.id ? (
            <Check size={16} color="#ffffff" />
          ) : (
            <Text style={[styles.listItemBadgeText, { color: colors.textSecondary }]}>
              D-{item.id.slice(-4)}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.listItemSeparator, { backgroundColor: colors.separator }]} />
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Loading more dealers...
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <ChevronLeft size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Select Dealer
            </Text>
          </View>

          <View style={styles.placeholder} />
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

        {/* Dealers List */}
        <FlatList
          ref={flatListRef}
          data={dealers}
          renderItem={renderDealerItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          onEndReached={loadMoreDealers}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={() => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 80,
              paddingHorizontal: 40,
            }}>
              <Store size={40} color={COLORS.SAFFRON} style={{ marginBottom: 16 }} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {searchQuery ? 'No dealers found' : 'No dealers available'}
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                {searchQuery ? 'Try adjusting your search terms' : 'Add dealers from the main screen'}
              </Text>
            </View>
          )}
        />

        {/* Loading Overlay */}
        {loading && dealers.length === 0 && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.SAFFRON} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Loading dealers...
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  listItemBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listItemSeparator: {
    height: 1,
    marginLeft: 16,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
});