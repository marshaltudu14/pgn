import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { ClipboardList, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';
import { COLORS, THEME } from '@/constants/theme';
import {
  tasksStyles,
  getPriorityStyles,
  getStatusIconColor
} from '@/styles/tasks/tasks-styles';

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
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = React.useState(false);
  const isDark = colors.background === COLORS.BACKGROUND_DARK;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate API call - will be replaced with real data fetching
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status: TaskItem['status']) => {
    const iconColor = getStatusIconColor(status);
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color={iconColor} />;
      case 'in-progress':
        return <Clock size={16} color={iconColor} />;
      case 'overdue':
        return <AlertCircle size={16} color={iconColor} />;
      default:
        return <Clock size={16} color={iconColor} />;
    }
  };

  const renderTaskItem = (task: TaskItem) => {
    return (
      <View key={task.id} style={tasksStyles.listItem}>
        <View style={tasksStyles.listItemContent}>
          <View style={tasksStyles.listItemMain}>
            <View style={tasksStyles.listItemHeader}>
              <ClipboardList size={20} color={COLORS.INFO} style={tasksStyles.listItemIcon} />
              <View style={tasksStyles.listItemTitles}>
                <Text style={[tasksStyles.listItemTitle, { color: colors.text }]}>
                  {task.title}
                </Text>
                <Text style={[tasksStyles.listItemSubtitle, { color: colors.textSecondary }]}>
                  {task.description}
                </Text>
              </View>
            </View>

            {/* Task Details - similar to contact info in retailers */}
            <View style={tasksStyles.listItemDetails}>
              {/* Priority - no background, just colored text */}
              <Text style={[
                tasksStyles.listItemDetail,
                { color: getPriorityStyles(task.priority, isDark).color }
              ]}>
                {task.priority} priority
              </Text>

              {/* Due Time */}
              {task.dueTime && (
                <Text style={[tasksStyles.listItemDetail, { color: colors.textSecondary }]}>
                  Due {task.dueTime}
                </Text>
              )}

              {/* Location */}
              {task.location && (
                <Text style={[tasksStyles.listItemDetail, { color: colors.textSecondary }]} numberOfLines={1}>
                  {task.location}
                </Text>
              )}
            </View>
          </View>

          {/* Status Badge - simplified like retailers/farmers */}
          <View style={[tasksStyles.listItemBadge, { backgroundColor: colors.iconBg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {getStatusIcon(task.status)}
              <Text style={[tasksStyles.listItemBadgeText, { marginLeft: THEME.SPACING.XS / 2, color: colors.textSecondary }]}>
                {task.status.replace('-', ' ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button for pending tasks - at the bottom of the list item */}
        {task.status === 'pending' && (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: THEME.SPACING.MD,
            paddingBottom: THEME.SPACING.SM - THEME.SPACING.XS
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                borderRadius: THEME.BORDER_RADIUS.SMALL,
                paddingHorizontal: THEME.SPACING.SM,
                paddingVertical: THEME.SPACING.XS,
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 2, // Android shadow
                shadowColor: '#000', // iOS shadow
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>
                Start Task
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[tasksStyles.listItemSeparator, { backgroundColor: colors.separator }]} />
      </View>
    );
  };

  return (
    <View style={[tasksStyles.container, { backgroundColor: colors.background }]}>
      {/* Compact Header */}
      <View style={tasksStyles.header}>
        <View style={tasksStyles.headerContent}>
          <View style={tasksStyles.titleRow}>
            <ClipboardList size={18} color={COLORS.INFO} style={tasksStyles.titleIcon} />
            <Text style={[tasksStyles.title, { color: colors.text }]}>
              Tasks
            </Text>
          </View>
          <View style={[tasksStyles.pendingBadge, { backgroundColor: colors.iconBg }]}>
            <Text style={[tasksStyles.pendingText, { color: colors.textSecondary }]}>
              {mockTasks.filter(t => t.status !== 'completed').length} pending
            </Text>
          </View>
        </View>
      </View>

      {/* Tasks List */}
      <ScrollView
        style={tasksStyles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textSecondary}
          />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Task Items */}
        {mockTasks.map(renderTaskItem)}

        {/* No Tasks Message */}
        {mockTasks.length === 0 && (
          <View style={tasksStyles.emptyContainer}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: THEME.SPACING.LG,
            }}>
              <ClipboardList size={40} color={COLORS.INFO} />
            </View>
            <Text style={[tasksStyles.emptyTitle, { color: colors.text }]}>
              No Tasks Found
            </Text>
            <Text style={[tasksStyles.emptySubtitle, { color: colors.textSecondary }]}>
              Check back later for new tasks
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}