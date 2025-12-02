import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Sprout, Search, Plus } from 'lucide-react-native';
import { useFarmerStore } from '@/store/farmer-store';
import { Farmer } from '@pgn/shared';
import CreateFarmerModal from '@/components/CreateFarmerModal';
import Spinner from '@/components/Spinner';

export default function FarmersScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    farmers,
    fetchFarmers,
    searchFarmers,
    setSelectedFarmer,
  } = useFarmerStore();

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadFarmers = useCallback(async () => {
    try {
      setIsInitialLoad(true);
      await fetchFarmers({ refresh: true });
    } catch (error) {
      console.error('Error loading farmers:', error);
    } finally {
      setIsInitialLoad(false);
    }
  }, [fetchFarmers]);

  useEffect(() => {
    loadFarmers();
  }, [loadFarmers]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchFarmers({ refresh: true });
    } catch (error) {
      console.error('Error refreshing farmers:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        await searchFarmers(query);
      } catch (error) {
        console.error('Error searching farmers:', error);
      }
    } else {
      loadFarmers();
    }
  };

  const handleFarmerPress = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    router.push('/farmers' as any);
  };

  const renderFarmerItem = ({ item }: { item: Farmer }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleFarmerPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.listItemContent}>
        <View style={styles.listItemMain}>
          <View style={styles.listItemHeader}>
            <Sprout size={20} color="#F59E0B" style={styles.listItemIcon} />
            <View style={styles.listItemTitles}>
              <Text style={[styles.listItemTitle, { color: colors.text }]}>
                {item.farm_name || 'N/A'}
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
            F-{item.id.slice(-4)}
          </Text>
        </View>
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
            <Sprout size={18} color="#F59E0B" style={styles.titleIcon} />
            <Text style={[styles.title, { color: colors.text }]}>
              Farmers
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: '#F59E0B' }]}
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
            placeholder="Search farmers..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Farmers List */}
      <FlatList
        data={farmers}
        renderItem={renderFarmerItem}
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
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Sprout size={40} color="#F59E0B" />
              </View>
              <Text style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: '700',
                marginBottom: 8,
                textAlign: 'center',
              }}>
                No Farmers Found
              </Text>
              <Text style={{
                color: colors.textSecondary,
                fontSize: 16,
                textAlign: 'center',
                lineHeight: 22,
                marginBottom: 24,
              }}>
                {searchQuery ? 'Try adjusting your search terms' : 'Add your first farmer to get started'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#F59E0B',
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
                    Add Farmer
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
          <Spinner size={24} color="#F59E0B" />
        </View>
      )}

      {/* Create Farmer Modal */}
      <CreateFarmerModal
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