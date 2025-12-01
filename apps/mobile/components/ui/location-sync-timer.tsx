import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
} from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Timer, Activity } from 'lucide-react-native';
import { LOCATION_TRACKING_CONFIG } from '@/constants/location-tracking';
import { COLORS } from '@/constants';

interface LocationSyncTimerProps {
  isVisible: boolean;
  interval?: number; // in seconds, uses config default if not provided
}

export function LocationSyncTimer({
  isVisible,
  interval = LOCATION_TRACKING_CONFIG.UPDATE_INTERVAL_SECONDS
}: LocationSyncTimerProps) {
  const colors = useThemeColors();
  const [timeRemaining, setTimeRemaining] = useState(interval);
  const [isActive, setIsActive] = useState(false);

  const themeColors = {
    background: colors.listBg,
    text: colors.text,
    textSecondary: colors.textSecondary,
    primary: COLORS.SAFFRON,
    success: COLORS.SUCCESS,
    border: colors.border,
  };

  // Reset and start timer when visibility changes
  useEffect(() => {
    if (isVisible) {
      setTimeRemaining(interval);
      setIsActive(true);
    } else {
      setIsActive(false);
      setTimeRemaining(interval);
    }
  }, [isVisible, interval]);

  // Countdown effect
  useEffect(() => {
    if (!isActive || timeRemaining <= 0) {
      if (isActive && timeRemaining <= 0) {
        // Reset for next cycle
        setTimeRemaining(interval);
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeRemaining(timeRemaining - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isActive, timeRemaining, interval]);

  // Format time display
  const formatTime = (seconds: number) => {
    return seconds.toString().padStart(2, '0');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <View style={[
      timerStyles.container,
      {
        backgroundColor: themeColors.background,
        borderColor: themeColors.border,
      }
    ]}>
      <View style={timerStyles.content}>
        <View style={timerStyles.iconSection}>
          <View style={[
            timerStyles.iconContainer,
            { backgroundColor: `${themeColors.primary}20` }
          ]}>
            {timeRemaining <= 3 ? (
              <Activity size={20} color={themeColors.primary} />
            ) : (
              <Timer size={20} color={themeColors.primary} />
            )}
          </View>
        </View>

        <View style={timerStyles.textSection}>
          <Text style={[timerStyles.title, { color: themeColors.text }]}>
            Location Tracking
          </Text>
          <Text style={[timerStyles.subtitle, { color: themeColors.textSecondary }]}>
            Next sync in {formatTime(timeRemaining)}s
          </Text>
        </View>

        <View style={timerStyles.timerSection}>
          <View style={[
            timerStyles.timerRing,
            {
              borderColor: timeRemaining <= 3 ? themeColors.success : themeColors.primary,
              opacity: timeRemaining <= 3 ? 1 : 0.7,
            }
          ]}>
            <Text style={[
              timerStyles.timerText,
              {
                color: timeRemaining <= 3 ? themeColors.success : themeColors.primary,
                fontSize: timeRemaining <= 3 ? 16 : 14,
                fontWeight: (timeRemaining <= 3 ? '700' : '600') as '600' | '700',
              }
            ]}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const timerStyles = {
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  content: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  iconSection: {
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  textSection: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  timerSection: {
    alignItems: 'center' as const,
  },
  timerRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
};