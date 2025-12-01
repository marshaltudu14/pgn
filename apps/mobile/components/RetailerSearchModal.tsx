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
import { ChevronLeft, Search, Users, Check } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRetailerStore } from '@/store/retailer-store';
import { Retailer } from '@pgn/shared';
import { COLORS } from '@/constants';

interface RetailerSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onRetailerSelect: (retailer: Retailer) => void;
  selectedRetailerId?: string;
}

export default function RetailerSearchModal({
  visible,
  onClose,
  onRetailerSelect,
  selectedRetailerId,
}: RetailerSearchModalProps) {
  const colorScheme = useColorScheme();
  const { retailers, loading, hasMore, fetchRetailers, searchRetailers } = useRetailerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const colors = {
    background: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
    card: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    textSecondary: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
    textTertiary: colorScheme === 'dark' ? '#48484A' : '#8E8E93',
    border: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    primary: COLORS.SAFFRON,
    success: COLORS.SUCCESS,
    warning: COLORS.WARNING,
    error: COLORS.ERROR,
    separator: colorScheme === 'dark' ? '#38383A' : '#C6C6C8',
    statusBar: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
    input: colorScheme === 'dark' ? '#2c2c2e' : '#f9fafb',
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setPage(1);
      loadInitialRetailers();
    }
  }, [visible]);

  const loadInitialRetailers = useCallback(async () => {
    try {
      await fetchRetailers({ page: 1, limit: 20, refresh: true });
    } catch (error) {
      console.error('Error loading retailers:', error);
    }
  }, [fetchRetailers]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setPage(1);
    try {
      await searchRetailers(query, { page: 1, limit: 20 });
    } catch (error) {
      console.error('Error searching retailers:', error);
    }
  };

  const loadMoreRetailers = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      await fetchRetailers({ page: nextPage, limit: 20 });
      setPage(nextPage);
    } catch (error) {
      console.error('Error loading more retailers:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, fetchRetailers]);

  const handleRetailerSelect = useCallback((retailer: Retailer) => {
    onRetailerSelect(retailer);
    onClose();
  }, [onRetailerSelect, onClose]);

  const renderRetailerItem = ({ item }: { item: Retailer }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleRetailerSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.listItemContent}>
        <View style={styles.listItemMain}>
          <View style={styles.listItemHeader}>
            <Users size={20} color={colors.primary} style={styles.listItemIcon} />
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

        <View style={[styles.listItemBadge, { backgroundColor: selectedRetailerId === item.id ? colors.primary : (colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') }]}>
          {selectedRetailerId === item.id ? (
            <Check size={16} color="#ffffff" />
          ) : (
            <Text style={[styles.listItemBadgeText, { color: colors.textSecondary }]}>
              R-{item.id.slice(-4)}
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
          Loading more retailers...
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
              Select Retailer
            </Text>
          </View>

          <View style={styles.placeholder} />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF', borderColor: colors.border }]}>
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

        {/* Retailers List */}
        <FlatList
          ref={flatListRef}
          data={retailers}
          renderItem={renderRetailerItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          onEndReached={loadMoreRetailers}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={() => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 80,
              paddingHorizontal: 40,
            }}>
              <Users size={40} color={COLORS.SAFFRON} style={{ marginBottom: 16 }} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {searchQuery ? 'No retailers found' : 'No retailers available'}
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                {searchQuery ? 'Try adjusting your search terms' : 'Add retailers from the main screen'}
              </Text>
            </View>
          )}
        />

        {/* Loading Overlay */}
        {loading && retailers.length === 0 && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.SAFFRON} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Loading retailers...
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