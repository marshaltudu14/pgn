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
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Sprout, Search, Plus, Phone, Mail, MapPin } from 'lucide-react-native';
import { useFarmerStore } from '@/store/farmer-store';
import { Farmer } from '@pgn/shared';
import { COLORS } from '@/constants';
import CreateFarmerModal from '@/components/CreateFarmerModal';
import Spinner from '@/components/Spinner';

export default function FarmersScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    farmers,
    loading,
    fetchFarmers,
    searchFarmers,
    setSelectedFarmer,
  } = useFarmerStore();

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

  const loadFarmers = useCallback(async () => {
    try {
      await fetchFarmers({ refresh: true });
    } catch (error) {
      console.error('Error loading farmers:', error);
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
      style={[
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          shadowColor: colorScheme === 'dark' ? 'transparent' : '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        {
          marginHorizontal: 16,
          marginVertical: 6,
          padding: 16,
          borderRadius: 16,
        }
      ]}
      onPress={() => handleFarmerPress(item)}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center mb-2">
            <Sprout size={18} color={colors.primary} className="mr-2" />
            <Text className={`font-bold text-lg flex-1 ${
              colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {item.farm_name || 'N/A'}
            </Text>
          </View>
          <Text className={`text-sm mb-1 ${
            colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {item.name}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${
          colorScheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <Text className={`text-xs font-bold ${
            colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            F-{item.id.slice(-4)}
          </Text>
        </View>
      </View>

      {/* Contact Info */}
      <View className="space-y-2">
        {item.email && (
          <View className="flex-row items-center">
            <Mail size={16} color={colors.textSecondary} className="mr-3" />
            <Text className={`text-sm flex-1 ${
              colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {item.email}
            </Text>
          </View>
        )}

        {item.phone && (
          <View className="flex-row items-center">
            <Phone size={16} color={colors.textSecondary} className="mr-3" />
            <Text className={`text-sm flex-1 ${
              colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {item.phone}
            </Text>
          </View>
        )}

        {item.address && (
          <View className="flex-row items-center">
            <MapPin size={16} color={colors.textSecondary} className="mr-3" />
            <Text className={`text-sm flex-1 ${
              colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {item.address}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Sprout size={28} color="#F59E0B" style={styles.titleIcon} />
            <Text style={[styles.title, { color: colors.text }]}>
              Farmers
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: '#F59E0B' }]}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Search size={22} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search farmers by name..."
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
        ListEmptyComponent={() => (
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
        )}
      />

      {/* Loading */}
      {loading && (
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
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 2,
  },
  searchIcon: {
    marginRight: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 2,
    fontWeight: '500',
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    zIndex: 1000,
  },
});