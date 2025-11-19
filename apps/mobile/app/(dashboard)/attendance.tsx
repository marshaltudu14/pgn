import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { showToast } from '@/utils/toast';
import { Calendar, MapPin, Clock, CheckCircle } from 'lucide-react-native';

export default function AttendanceScreen() {

  const handleCheckIn = () => {
    showToast.info('Check In', 'Face recognition check-in will be available in Phase 2.');
  };

  const handleCheckOut = () => {
    showToast.info('Check Out', 'Face recognition check-out will be available in Phase 2.');
  };

  const mockAttendanceData = [
    {
      date: '2024-01-15',
      checkIn: '09:00 AM',
      checkOut: '06:00 PM',
      status: 'present',
      location: 'Office'
    },
    {
      date: '2024-01-14',
      checkIn: '08:45 AM',
      checkOut: '05:30 PM',
      status: 'present',
      location: 'Office'
    },
    {
      date: '2024-01-13',
      checkIn: '09:15 AM',
      checkOut: '--:--',
      status: 'checked_out',
      location: 'Office'
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="bg-green-600 pt-12 pb-6 px-6">
        <View className="items-center">
          <Text className="text-white text-2xl font-bold mb-2">
            Attendance
          </Text>
          <Text className="text-green-100 text-sm">
            Track your work hours and location
          </Text>
        </View>
      </View>

      {/* Today&apos;s Status */}
      <View className="px-6 py-6">
        <View className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <Text className="text-gray-900 text-lg font-semibold mb-4">
            Today&apos;s Status
          </Text>

          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3">
                <Clock size={24} color="#6B7280" />
              </View>
              <View>
                <Text className="text-gray-500 text-xs">Current Time</Text>
                <Text className="text-gray-900 font-semibold">--:--</Text>
              </View>
            </View>
            <View className="bg-yellow-100 px-3 py-1 rounded-full">
              <Text className="text-yellow-800 text-xs font-medium">Not Checked In</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={handleCheckIn}
              className="flex-1 bg-green-600 rounded-lg p-4 items-center"
            >
              <CheckCircle size={24} color="white" className="mb-1" />
              <Text className="text-white font-semibold">Check In</Text>
              <Text className="text-green-100 text-xs mt-1">Start workday</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCheckOut}
              className="flex-1 bg-red-600 rounded-lg p-4 items-center opacity-50"
              disabled
            >
              <Clock size={24} color="white" className="mb-1" />
              <Text className="text-white font-semibold">Check Out</Text>
              <Text className="text-red-100 text-xs mt-1">End workday</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <Text className="text-gray-900 text-lg font-semibold mb-4">
            This Week
          </Text>

          <View className="grid grid-cols-3 gap-4">
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600">5</Text>
              <Text className="text-gray-500 text-xs">Days Present</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-600">40</Text>
              <Text className="text-gray-500 text-xs">Hours Total</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-purple-600">8h</Text>
              <Text className="text-gray-500 text-xs">Avg/Day</Text>
            </View>
          </View>
        </View>

        {/* Recent Attendance */}
        <View className="bg-white rounded-xl shadow-sm p-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-900 text-lg font-semibold">
              Recent Attendance
            </Text>
            <TouchableOpacity onPress={() => showToast.info('History', 'Full attendance history coming soon!')}>
              <Text className="text-blue-600 text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          {mockAttendanceData.map((record, index) => (
            <View
              key={index}
              className={`flex-row items-center justify-between py-3 ${
                index !== mockAttendanceData.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Calendar size={16} color="#6B7280" className="mr-2" />
                  <Text className="text-gray-900 font-medium text-sm">{record.date}</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="mr-4">
                    <Text className="text-gray-500 text-xs">Check In</Text>
                    <Text className="text-gray-700 text-sm font-medium">{record.checkIn}</Text>
                  </View>
                  <View className="mr-4">
                    <Text className="text-gray-500 text-xs">Check Out</Text>
                    <Text className="text-gray-700 text-sm font-medium">{record.checkOut}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <MapPin size={16} color="#6B7280" className="mr-1" />
                    <Text className="text-gray-500 text-xs">{record.location}</Text>
                  </View>
                </View>
              </View>
              <View className={`px-2 py-1 rounded-full ${
                record.status === 'present'
                  ? 'bg-green-100'
                  : record.status === 'checked_out'
                  ? 'bg-blue-100'
                  : 'bg-red-100'
              }`}>
                <Text className={`text-xs font-medium ${
                  record.status === 'present'
                    ? 'text-green-800'
                    : record.status === 'checked_out'
                    ? 'text-blue-800'
                    : 'text-red-800'
                }`}>
                  {record.status === 'present' ? 'Present' :
                   record.status === 'checked_out' ? 'Checked Out' : 'Absent'}
                </Text>
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={() => showToast.info('Load More', 'Loading more records will be available soon!')}
            className="items-center py-3"
          >
            <Text className="text-blue-600 text-sm">Load More</Text>
          </TouchableOpacity>
        </View>

        {/* Coming Soon Features */}
        <View className="mt-6">
          <Text className="text-gray-900 text-lg font-semibold mb-4">
            Coming Soon (Phase 2)
          </Text>
          <View className="space-y-3">
            <View className="bg-gray-100 rounded-lg p-4 opacity-75">
              <View className="flex-row items-center">
                <Text className="text-xl mr-3">📸</Text>
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium text-sm">
                    Face Recognition Check-in
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    Secure attendance verification
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-gray-100 rounded-lg p-4 opacity-75">
              <View className="flex-row items-center">
                <Text className="text-xl mr-3">🗺️</Text>
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium text-sm">
                    Location Verification
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    GPS-based location tracking
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-gray-100 rounded-lg p-4 opacity-75">
              <View className="flex-row items-center">
                <Text className="text-xl mr-3">📊</Text>
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium text-sm">
                    Detailed Reports
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    Comprehensive attendance analytics
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}