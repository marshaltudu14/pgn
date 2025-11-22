import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { showToast } from '@/utils/toast';
import { useAttendance } from '@/store/attendance-store';
import { DailyAttendanceRecord } from '@pgn/shared';
import { createAttendanceStyles } from '@/styles/attendance/attendance-styles';
import { COLORS } from '@/constants';
import AttendanceSkeleton from '@/components/AttendanceSkeleton';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';

export default function AttendanceScreen() {
  const colorScheme = useColorScheme();
  const styles = createAttendanceStyles();
  const flatListRef = useRef<FlatList>(null);

  // Use the attendance store
  const {
    attendanceHistory,
    isHistoryLoading,
    isRefreshingHistory,
    fetchAttendanceHistory,
    loadMoreAttendanceHistory,
    refreshAttendanceHistory,
  } = useAttendance();

  // Theme colors - Black for dark mode, White for light mode
  const colors = {
    background: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
    card: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    textSecondary: colorScheme === 'dark' ? '#8E8E93' : '#3C3C43',
    textTertiary: colorScheme === 'dark' ? '#48484A' : '#8E8E93',
    border: colorScheme === 'dark' ? '#38383A' : '#C6C6C8',
    primary: COLORS.SAFFRON,
    success: COLORS.SUCCESS,
    warning: COLORS.WARNING,
    error: COLORS.ERROR,
    separator: colorScheme === 'dark' ? '#38383A' : '#C6C6C8',
    statusBar: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
  };

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      await fetchAttendanceHistory();
    } catch {
      showToast.error('Error', 'Failed to load attendance data');
    }
  }, [fetchAttendanceHistory]);

  // Load more data (infinite scroll)
  const loadMoreData = useCallback(async () => {
    try {
      await loadMoreAttendanceHistory();
    } catch {
      showToast.error('Error', 'Failed to load more data');
    }
  }, [loadMoreAttendanceHistory]);

  // Refresh data
  const onRefresh = useCallback(async () => {
    try {
      await refreshAttendanceHistory();
    } catch {
      showToast.error('Error', 'Failed to refresh data');
    }
  }, [refreshAttendanceHistory]);

  // Format time
  const formatTime = (date: Date | string | null) => {
    if (!date) return '--:--';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format distance
  const formatDistance = (meters: number | null) => {
    if (!meters) return '0 km';
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Get verification status info
  const getVerificationStatus = (status: string | null) => {
    switch (status) {
      case 'AUTO_APPROVED':
        return { color: colors.success, icon: CheckCircle, text: 'Approved' };
      case 'MANUAL_REVIEW':
        return { color: colors.warning, icon: AlertCircle, text: 'Review' };
      case 'REJECTED':
        return { color: colors.error, icon: XCircle, text: 'Rejected' };
      default:
        return { color: colors.textTertiary, icon: Clock, text: 'Pending' };
    }
  };

  // Render attendance item
  const renderAttendanceItem = ({ item }: { item: DailyAttendanceRecord; index: number }) => {
    const verificationStatus = getVerificationStatus(item.verificationStatus || null);
    const StatusIcon = verificationStatus.icon;

    return (
      <View style={[
        styles.attendanceItem,
        { backgroundColor: colors.background }
      ]}>
        <View style={styles.attendanceRow}>
          {/* Date and Status */}
          <View style={styles.dateSection}>
            <View style={styles.dateRow}>
              <Calendar size={16} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(item.date)}</Text>
            </View>
            <View style={styles.statusBadge}>
              <StatusIcon size={14} color={verificationStatus.color} />
              <Text style={[styles.statusText, { color: verificationStatus.color }]}>
                {verificationStatus.text}
              </Text>
            </View>
          </View>
        </View>

        {/* Times row */}
        <View style={styles.timesRow}>
          <View style={styles.timeColumn}>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>In</Text>
            <Text style={[styles.timeValue, { color: colors.text }]}>{formatTime(item.checkInTime || null)}</Text>
          </View>
          <View style={styles.timeColumn}>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Out</Text>
            <Text style={[styles.timeValue, { color: colors.text }]}>{formatTime(item.checkOutTime || null)}</Text>
          </View>
          <View style={styles.timeColumn}>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Hours</Text>
            <Text style={[styles.timeValue, { color: colors.primary }]}>
              {item.workHours ? `${item.workHours.toFixed(1)}h` : '--'}
            </Text>
          </View>
          <View style={styles.timeColumn}>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Distance</Text>
            <Text style={[styles.timeValue, { color: colors.textSecondary }]}>
              {item.locationPath && item.locationPath.length > 0
                ? formatDistance((item.locationPath.length - 1) * 100)
                : '--'
              }
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render header
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Attendance</Text>
    </View>
  );

  // Render footer
  const renderFooter = () => {
    if (!isHistoryLoading || isRefreshingHistory) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Loading more records...</Text>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
      <Calendar size={48} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Attendance Records</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Your attendance history will appear here once you start checking in and out
      </Text>
    </View>
  );

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  if (isHistoryLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar
          barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={colors.statusBar}
        />
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading attendance...</Text>
          <AttendanceSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.statusBar}
      />

      <FlatList
        ref={flatListRef}
        data={attendanceHistory}
        renderItem={renderAttendanceItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingHistory}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!isHistoryLoading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={attendanceHistory.length === 0 ? styles.emptyListContainer : styles.listContainer}
        style={{ backgroundColor: colors.background }}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.separator }]} />
        )}
      />
    </SafeAreaView>
  );
}