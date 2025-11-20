import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { showToast } from '@/utils/toast';
import { Clock } from 'lucide-react-native';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handleCheckIn = () => {
    router.push('/(dashboard)/attendance');
  };

  return (
    <View className={`flex-1 ${
      colorScheme === 'dark' ? 'bg-black' : 'bg-gray-50'
    }`}>
      {/* Header with Primary Color Background */}
      <View className={`pt-12 pb-8 px-6 bg-primary`}>
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold text-white mb-2">
            Welcome back!
          </Text>
          <Text className="text-white/90 text-lg">
            {user?.fullName || 'Employee'}
          </Text>
        </View>

        {/* Employee Basic Details Card */}
        <View className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white/80 text-sm mb-1">
                Employee ID
              </Text>
              <Text className="text-white font-semibold text-lg">
                {user?.humanReadableId || 'N/A'}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-white/80 text-sm mb-1">
                Status
              </Text>
              <Text className="text-white font-semibold text-lg capitalize">
                {user?.employmentStatus?.toLowerCase() || 'Active'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Check In Button */}
      <View className="px-6 pt-8">
        <TouchableOpacity
          onPress={handleCheckIn}
          className="bg-primary rounded-lg p-6"
        >
          <View className="flex-row items-center justify-center">
            <Clock size={24} color="white" />
            <Text className="text-white font-bold text-xl ml-3">
              Check In
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}