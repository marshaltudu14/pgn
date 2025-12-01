import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@/contexts/theme-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { ClipboardList, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react-native';
import { COLORS } from '@/constants';

interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  dueTime?: string;
  location?: string;
}

// Mock tasks data - will be replaced with API calls in Phase 2
const mockTasks: TaskItem[] = [
  {
    id: '1',
    title: 'Check In',
    description: 'Start your workday by checking in at your current location',
    status: 'pending',
    priority: 'high',
    dueTime: '09:00 AM',
  },
  {
    id: '2',
    title: 'Location Verification',
    description: 'Ensure you are at the correct work location',
    status: 'pending',
    priority: 'high',
  },
  {
    id: '3',
    title: 'Check Out',
    description: 'End your workday by checking out',
    status: 'pending',
    priority: 'medium',
    dueTime: '06:00 PM',
  },
];

export default function TasksScreen() {
  const { resolvedTheme } = useTheme();
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate API call - will be replaced with real data fetching
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: TaskItem['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'overdue':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: TaskItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color="#10B981" />;
      case 'in-progress':
        return <Clock size={16} color="#3B82F6" />;
      case 'overdue':
        return <AlertCircle size={16} color="#EF4444" />;
      default:
        return <Clock size={16} color="#6B7280" />;
    }
  };

  const getPriorityColor = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  const renderTaskItem = (task: TaskItem) => (
    <View
      key={task.id}
      className={`rounded-lg p-4 mb-3 border`}
      style={{ backgroundColor: colors.listBg, borderColor: colors.border }}
    >
      {/* Task Header */}
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-3">
          <Text className={`font-semibold text-base mb-1`} style={{ color: colors.text }}>
            {task.title}
          </Text>
          <Text className={`text-sm leading-5`} style={{ color: colors.textSecondary }}>
            {task.description}
          </Text>
        </View>
        <View className="items-end">
          <View className={`px-2 py-1 rounded-full border flex-row items-center ${getStatusColor(task.status)}`}>
            {getStatusIcon(task.status)}
            <Text className={`text-xs font-medium ml-1 capitalize`}>
              {task.status.replace('-', ' ')}
            </Text>
          </View>
        </View>
      </View>

      {/* Task Meta */}
      <View className="flex-row flex-wrap items-center gap-3">
        {/* Priority */}
        <View className={`px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
          <Text className={`text-xs font-medium capitalize`}>
            {task.priority} priority
          </Text>
        </View>

        {/* Due Time */}
        {task.dueTime && (
          <View className="flex-row items-center">
            <Clock size={12} color={colors.textTertiary} />
            <Text className={`text-xs ml-1`} style={{ color: colors.textTertiary }}>
              Due {task.dueTime}
            </Text>
          </View>
        )}

        {/* Location */}
        {task.location && (
          <View className="flex-row items-center">
            <MapPin size={12} color={colors.textTertiary} />
            <Text className={`text-xs ml-1`} style={{ color: colors.textTertiary }}>
              {task.location}
            </Text>
          </View>
        )}
      </View>

      {/* Action Button for pending tasks */}
      {task.status === 'pending' && (
        <TouchableOpacity
          className={`mt-3 py-2 rounded-lg border`}
          style={{ backgroundColor: colors.primary + '20', borderColor: colors.primary }}
        >
          <Text className={`text-center text-sm font-medium`} style={{ color: colors.primary }}>
            Start Task
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View className={`flex-1`} style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className={`px-6 pt-12 pb-6 border-b`} style={{ backgroundColor: colors.headerBg, borderBottomColor: colors.border }}>
        <View className="flex-row items-center mb-2">
          <ClipboardList size={24} color="#3B82F6" className="mr-3" />
          <Text className={`text-2xl font-bold`} style={{ color: colors.text }}>
            Tasks
          </Text>
        </View>
        <Text className={`text-sm`} style={{ color: colors.textSecondary }}>
          Your daily work tasks and activities
        </Text>
      </View>

      {/* Tasks List */}
      <ScrollView
        className="flex-1 px-6 py-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textTertiary}
          />
        }
      >
        {/* Coming Soon Notice */}
        <View className={`rounded-lg p-4 mb-4 border`} style={{ backgroundColor: COLORS.WARNING + '20', borderColor: COLORS.WARNING }}>
          <View className="flex-row items-start">
            <AlertCircle size={20} color={COLORS.WARNING} className="mr-3 mt-0.5" />
            <View className="flex-1">
              <Text className={`font-medium text-sm mb-1`} style={{ color: COLORS.WARNING }}>
                Phase 2 Feature
              </Text>
              <Text className={`text-xs leading-4`} style={{ color: COLORS.WARNING + 'DD' }}>
                Task management is coming soon! This will include attendance check-in/out, location tracking, and work activity monitoring.
              </Text>
            </View>
          </View>
        </View>

        {/* Tasks Header */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-lg font-semibold`} style={{ color: colors.text }}>
            Today&apos;s Tasks
          </Text>
          <View className={`px-2 py-1 rounded-full`} style={{ backgroundColor: colors.iconBg }}>
            <Text className={`text-xs font-medium`} style={{ color: colors.textSecondary }}>
              {mockTasks.filter(t => t.status !== 'completed').length} pending
            </Text>
          </View>
        </View>

        {/* Task Items */}
        {mockTasks.map(renderTaskItem)}

        {/* No Tasks Message */}
        {mockTasks.length === 0 && (
          <View className="items-center py-12">
            <ClipboardList size={48} color={colors.textTertiary} />
            <Text className={`text-center mt-4`} style={{ color: colors.textSecondary }}>
              No tasks for today
            </Text>
            <Text className={`text-center text-sm mt-1`} style={{ color: colors.textTertiary }}>
              Check back later for new tasks
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}