import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Store, Search, Plus, Phone, Mail, MapPin } from 'lucide-react-native';
import { useDealerStore } from '@/store/dealer-store';
import { Dealer } from '@pgn/shared';
import { COLORS } from '@/constants';

export default function DealersScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {
    dealers,
    loading,
    fetchDealers,
    searchDealers,
    setSelectedDealer,
  } = useDealerStore();

  const colors = {
    background: colorScheme === 'dark' ? '#000000' : '#f3f4f6',
    card: colorScheme === 'dark' ? '#1c1c1e' : '#ffffff',
    text: colorScheme === 'dark' ? '#ffffff' : '#000000',
    textSecondary: colorScheme === 'dark' ? '#8e8e93' : '#6b7280',
    border: colorScheme === 'dark' ? '#38383a' : '#e5e7eb',
    primary: COLORS.SAFFRON,
  };

  const loadDealers = useCallback(async () => {
    try {
      await fetchDealers({ refresh: true });
    } catch (error) {
      console.error('Error loading dealers:', error);
    }
  }, [fetchDealers]);

  useEffect(() => {
    loadDealers();
  }, [loadDealers]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDealers({ refresh: true });
    } catch (error) {
      console.error('Error refreshing dealers:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        await searchDealers(query);
      } catch (error) {
        console.error('Error searching dealers:', error);
      }
    } else {
      loadDealers();
    }
  };

  const handleDealerPress = (dealer: Dealer) => {
    setSelectedDealer(dealer);
    // For now, show a simple alert. Later can navigate to detail screen
    router.push('/dealers' as any);
  };

  const renderDealerItem = ({ item }: { item: Dealer }) => (
    <TouchableOpacity
      style={[
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        {
          marginHorizontal: 16,
          marginVertical: 4,
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
        }
      ]}
      onPress={() => handleDealerPress(item)}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center mb-1">
            <Store size={16} color={colors.primary} className="mr-2" />
            <Text className={`font-semibold text-lg flex-1 ${
              colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {item.shop_name || 'N/A'}
            </Text>
          </View>
          <Text className={`text-sm mb-2 ${
            colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {item.name}
          </Text>
        </View>
        <View className={`px-2 py-1 rounded-full ${
          colorScheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <Text className={`text-xs font-medium ${
            colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            D-{item.id.slice(-4)}
          </Text>
        </View>
      </View>

      {/* Contact Info */}
      <View className="space-y-2">
        {item.email && (
          <View className="flex-row items-center">
            <Mail size={14} color={colors.textSecondary} className="mr-2" />
            <Text className={`text-sm flex-1 ${
              colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {item.email}
            </Text>
          </View>
        )}

        {item.phone && (
          <View className="flex-row items-center">
            <Phone size={14} color={colors.textSecondary} className="mr-2" />
            <Text className={`text-sm flex-1 ${
              colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {item.phone}
            </Text>
          </View>
        )}

        {item.address && (
          <View className="flex-row items-center">
            <MapPin size={14} color={colors.textSecondary} className="mr-2" />
            <Text className={`text-sm flex-1 ${
              colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {item.address}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#ffffff',
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 16,
      }}>
        <View className="flex-row items-center mb-4">
          <Store size={24} color={colors.primary} className="mr-3" />
          <Text className={`text-2xl font-bold flex-1 ${
            colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Dealers
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => router.push('/dealers' as any)}
          >
            <Plus size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colorScheme === 'dark' ? '#2c2c2e' : '#f9fafb',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}>
          <Search size={20} color={colors.textSecondary} className="mr-3" />
          <TextInput
            style={{
              flex: 1,
              color: colors.text,
              fontSize: 16,
            }}
            placeholder="Search dealers..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
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
        ListEmptyComponent={() => (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 60,
          }}>
            <Store size={48} color={colors.textSecondary} />
            <Text style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: '500',
              marginTop: 16,
              marginBottom: 8,
            }}>
              No dealers found
            </Text>
            <Text style={{
              color: colors.textSecondary,
              fontSize: 14,
              textAlign: 'center',
            }}>
              {searchQuery ? 'Try adjusting your search' : 'Add your first dealer to get started'}
            </Text>
          </View>
        )}
      />

      {/* Loading */}
      {loading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.1)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      )}
    </View>
  );
}