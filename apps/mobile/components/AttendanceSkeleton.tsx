import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-colors';

const AttendanceSkeleton = () => {
  const colors = useThemeColors();

  const skeletonColors = {
    primary: colors.border,
    secondary: colors.listBg,
  };
  const skeletonItems = Array.from({ length: 5 }, (_, index) => index);

  return (
    <View style={styles.skeletonContainer}>
      {skeletonItems.map((index) => (
        <View key={index} style={[styles.skeletonItem, { backgroundColor: 'transparent' }]}>
          {/* Date row skeleton - matches dateSection */}
          <View style={styles.skeletonDateSection}>
            <View style={styles.skeletonDateRow}>
              {/* Calendar icon placeholder */}
              <View style={[styles.skeletonIcon, { backgroundColor: skeletonColors.secondary }]} />
              {/* Date text placeholder */}
              <View style={[styles.skeletonDateText, { backgroundColor: skeletonColors.primary }]} />
            </View>
            {/* Status badge placeholder */}
            <View style={[styles.skeletonBadge, { backgroundColor: skeletonColors.primary }]} />
          </View>

          {/* Times row skeleton - matches timesRow */}
          <View style={styles.skeletonTimesRow}>
            {/* In time */}
            <View style={styles.skeletonTimeColumn}>
              <View style={[styles.skeletonTimeLabel, { backgroundColor: skeletonColors.secondary }]} />
              <View style={[styles.skeletonTimeValue, { backgroundColor: skeletonColors.primary }]} />
            </View>
            {/* Out time */}
            <View style={styles.skeletonTimeColumn}>
              <View style={[styles.skeletonTimeLabel, { backgroundColor: skeletonColors.secondary }]} />
              <View style={[styles.skeletonTimeValue, { backgroundColor: skeletonColors.primary }]} />
            </View>
            {/* Hours */}
            <View style={styles.skeletonTimeColumn}>
              <View style={[styles.skeletonTimeLabel, { backgroundColor: skeletonColors.secondary }]} />
              <View style={[styles.skeletonTimeValue, { backgroundColor: skeletonColors.primary }]} />
            </View>
            {/* Distance */}
            <View style={styles.skeletonTimeColumn}>
              <View style={[styles.skeletonTimeLabel, { backgroundColor: skeletonColors.secondary }]} />
              <View style={[styles.skeletonTimeValue, { backgroundColor: skeletonColors.primary }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  skeletonItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  skeletonDateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  skeletonIcon: {
    width: 16,
    height: 16,
    borderRadius: 3,
    marginRight: 8,
  },
  skeletonDateText: {
    height: 20,
    flex: 1,
    maxWidth: 180,
    borderRadius: 4,
  },
  skeletonBadge: {
    height: 24,
    width: 80,
    borderRadius: 12,
  },
  skeletonTimesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonTimeColumn: {
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 70,
  },
  skeletonTimeLabel: {
    height: 12,
    width: 30,
    borderRadius: 4,
    marginBottom: 2,
  },
  skeletonTimeValue: {
    height: 16,
    width: 50,
    borderRadius: 4,
  },
});

export default AttendanceSkeleton;