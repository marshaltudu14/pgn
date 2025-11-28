import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Home, ClipboardList, User, Calendar, ArrowUp, ArrowDown, Timer } from 'lucide-react-native';
import { COLORS } from '@/constants';
import { useAttendance } from '@/store/attendance-store';
import { LOCATION_TRACKING_CONFIG } from '@/constants/location-tracking';
import { locationTrackingServiceNotifee } from '@/services/location-foreground-service-notifee';

interface TabItem {
  key: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  onPress: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

interface UnifiedBottomNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isCheckedIn?: boolean;
  onCheckInOut?: () => void;
  isLoading?: boolean;
}

const AnimatedCheckInOutButton: React.FC<{
  isCheckedIn: boolean;
  onCheckInOut: () => void;
  isLocationTracking: boolean;
  colorScheme?: 'light' | 'dark' | null;
  isLoading?: boolean;
}> = ({ isCheckedIn, onCheckInOut, isLocationTracking, colorScheme, isLoading = false }) => {
  const showTimer = isCheckedIn && isLocationTracking && !isLoading;
  const [timeRemaining, setTimeRemaining] = useState(LOCATION_TRACKING_CONFIG.UPDATE_INTERVAL_SECONDS);
  const fillAnimation = React.useRef(new Animated.Value(0)).current;

  // Setup countdown callback from service when tracking is active
  useEffect(() => {
    if (isCheckedIn && isLocationTracking) {
      // Set initial countdown from service
      const serviceCountdown = locationTrackingServiceNotifee.getNextSyncCountdown();
      setTimeRemaining(serviceCountdown);

      // Setup callback to receive countdown updates directly from service
      const handleCountdownUpdate = (countdown: number) => {
        setTimeRemaining(countdown);

        // Update fluid fill animation in sync with countdown
        const progress = countdown / LOCATION_TRACKING_CONFIG.UPDATE_INTERVAL_SECONDS;
        Animated.timing(fillAnimation, {
          toValue: progress,
          duration: 100, // Quick animation to keep up with countdown
          useNativeDriver: false,
        }).start();
      };

      // Register callback with service
      locationTrackingServiceNotifee.setCountdownUpdateCallback(handleCountdownUpdate);

      // Cleanup callback when component unmounts or tracking stops
      return () => {
        locationTrackingServiceNotifee.setCountdownUpdateCallback(() => {});
      };
    } else {
      // Reset state when not tracking
      setTimeRemaining(LOCATION_TRACKING_CONFIG.UPDATE_INTERVAL_SECONDS);
      fillAnimation.setValue(1); // Start full when checked in
    }
  }, [isCheckedIn, isLocationTracking, fillAnimation]);

  const formatTime = (seconds: number) => {
    return seconds.toString().padStart(2, '0');
  };

  return (
    <TouchableOpacity
      style={[
        styles.checkInOutButton,
        {
          backgroundColor: isCheckedIn ? '#ef4444' : '#10b981',
        },
      ]}
      onPress={onCheckInOut}
    >
      
      {/* Background fluid fill - only show when checked in with timer */}
      {showTimer && (
        <View style={styles.fluidFillContainer}>
          <Animated.View
            style={[
              styles.fluidFill,
              {
                backgroundColor: '#dc2626',
                height: fillAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['100%', '0%'], // Start full, empty as timer goes to 0
                }),
              },
            ]}
          />
        </View>
      )}

      {/* Icon and Timer Content */}
      <View style={styles.buttonContent}>
        {isLoading ? (
          <Timer size={28} color="#ffffff" />
        ) : showTimer ? (
          <View style={styles.timerContent}>
            <Text style={styles.timerText}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
        ) : (
          isCheckedIn ? (
            <ArrowDown size={28} color="#ffffff" />
          ) : (
            <ArrowUp size={28} color="#ffffff" />
          )
        )}
      </View>

      {/* Pulse effect for active timer */}
      {showTimer && timeRemaining <= 3 && (
        <View style={[
          styles.pulseRing,
          { backgroundColor: '#ef4444' }
        ]} />
      )}
    </TouchableOpacity>
  );
};

const TabButton: React.FC<{
  item: TabItem;
  colorScheme?: 'light' | 'dark' | null;
}> = ({ item, colorScheme }) => {
  const getIconColor = () => {
    if (item.disabled) return '#9ca3af';
    return item.isActive
      ? COLORS.SAFFRON // Active state
      : (colorScheme === 'dark' ? '#9ca3af' : '#64748b');
  };

  const getTextColor = () => {
    if (item.disabled) return '#9ca3af';
    return item.isActive
      ? COLORS.SAFFRON // Active state
      : (colorScheme === 'dark' ? '#9ca3af' : '#64748b');
  };

  return (
    <TouchableOpacity
      style={[styles.tabButton, item.disabled && styles.disabledTab]}
      onPress={item.disabled ? undefined : item.onPress}
      activeOpacity={item.disabled ? 1 : 0.7}
      disabled={item.disabled}
    >
      <item.icon
        size={24}
        color={getIconColor()}
      />
      <Text style={[styles.tabLabel, { color: getTextColor() }]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
};

export default function UnifiedBottomNavigation({
  activeTab = 'home',
  onTabChange,
  isCheckedIn = false,
  onCheckInOut,
  isLoading = false,
}: UnifiedBottomNavigationProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { isLocationTracking } = useAttendance();

  
  const handleHomePress = () => {
    if (onTabChange) onTabChange('home');
  };

  const handleTasksPress = () => {
    if (onTabChange) onTabChange('tasks');
  };

  const handleAttendancePress = () => {
    if (onTabChange) onTabChange('attendance');
  };

  const handleProfilePress = () => {
    if (onTabChange) onTabChange('profile');
  };

  const tabs: TabItem[] = [
    {
      key: 'home',
      icon: Home,
      label: 'Home',
      onPress: handleHomePress,
      isActive: activeTab === 'home',
    },
    {
      key: 'tasks',
      icon: ClipboardList,
      label: 'Tasks',
      onPress: handleTasksPress,
      isActive: activeTab === 'tasks',
    },
    {
      key: 'attendance',
      icon: Calendar,
      label: 'Attendance',
      onPress: handleAttendancePress,
      isActive: activeTab === 'attendance',
    },
    {
      key: 'profile',
      icon: User,
      label: 'Profile',
      onPress: handleProfilePress,
      isActive: activeTab === 'profile',
    },
  ];

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
        paddingBottom: Math.max(insets.bottom, 8), // Use safe area inset or minimum padding
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
      }
    ]}>
      {tabs.slice(0, 2).map((tab) => (
        <TabButton key={tab.key} item={tab} colorScheme={colorScheme} />
      ))}

      {/* Check In/Out Button in Center */}
      <AnimatedCheckInOutButton
        isCheckedIn={isCheckedIn}
        onCheckInOut={() => onCheckInOut?.()}
        isLocationTracking={isLocationTracking}
        colorScheme={colorScheme}
        isLoading={isLoading}
      />

      {tabs.slice(2).map((tab) => (
        <TabButton key={tab.key} item={tab} colorScheme={colorScheme} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  disabledTab: {
    opacity: 0.5,
  },
  checkInOutButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20, // Make it float above the nav bar
    position: 'relative',
    overflow: 'hidden',
  },
  emptyCircle: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 28,
    zIndex: 0,
  },
  fluidFillContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
    borderRadius: 32,
    overflow: 'hidden',
  },
  fluidFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    borderRadius: 32,
    opacity: 0.7,
  },
  buttonContent: {
    position: 'relative',
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  timerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  pulseRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 36,
    opacity: 0.3,
  },
});