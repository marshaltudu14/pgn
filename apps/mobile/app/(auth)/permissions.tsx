import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  AppState,
  StyleSheet,
} from 'react-native';
import {
  Camera,
  MapPin,
  Shield,
  Settings,
  CheckCircle,
  Bell,
  RefreshCw,
  Info,
} from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { permissionService, AppPermissions } from '@/services/permissions';
import { COLORS, THEME } from '@/constants/theme';

interface PermissionsScreenProps {
  permissions?: AppPermissions;
  onPermissionsGranted?: () => void;
}

export default function PermissionsScreen({
  permissions: initialPermissions,
  onPermissionsGranted
}: PermissionsScreenProps) {
  const colorScheme = useColorScheme();
  const [permissions, setPermissions] = useState<AppPermissions>(
    initialPermissions || { camera: 'denied', location: 'denied', notifications: 'denied' }
  );
  const [isRequesting, setIsRequesting] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colorScheme === 'dark' ? COLORS.BACKGROUND_DARK : COLORS.BACKGROUND_LIGHT,
    },
    content: {
      flex: 1,
      paddingHorizontal: THEME.SPACING.XL,
      paddingTop: THEME.SPACING.XXL + THEME.SPACING.XL, // Extra top padding for notch area
      justifyContent: 'center',
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: THEME.SPACING.XXL + THEME.SPACING.SM,
    },
    iconContainer: {
      width: THEME.SPACING.XXL,
      height: THEME.SPACING.XXL,
      borderRadius: THEME.BORDER_RADIUS.ROUND,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: THEME.SPACING.LG,
    },
    iconContainerGranted: {
      backgroundColor: COLORS.SUCCESS_LIGHT,
    },
    iconContainerDefault: {
      backgroundColor: colorScheme === 'dark' ? COLORS.SAFFRON_ALPHA_DARK : COLORS.WARNING_LIGHT,
    },
    title: {
      fontSize: THEME.FONT_SIZES.DISPLAY,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: THEME.SPACING.SM,
    },
    titleDark: {
      color: COLORS.TEXT_PRIMARY_DARK,
    },
    titleLight: {
      color: COLORS.TEXT_PRIMARY_LIGHT,
    },
    subtitle: {
      fontSize: THEME.FONT_SIZES.BASE,
      textAlign: 'center',
      paddingHorizontal: THEME.SPACING.SM,
    },
    subtitleDark: {
      color: COLORS.TEXT_TERTIARY_DARK,
    },
    subtitleLight: {
      color: COLORS.TEXT_TERTIARY_LIGHT,
    },
    permissionsList: {
      marginTop: THEME.SPACING.XL,
    },
    permissionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: THEME.SPACING.LG,
    },
    permissionIconContainer: {
      width: 48,
      height: 48,
      borderRadius: THEME.BORDER_RADIUS.ROUND,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: THEME.SPACING.SM,
    },
    permissionIconContainerGranted: {
      backgroundColor: COLORS.SUCCESS_LIGHT,
    },
    permissionIconContainerDefault: {
      backgroundColor: colorScheme === 'dark' ? COLORS.SAFFRON_ALPHA_DARK : COLORS.WARNING_LIGHT,
    },
    permissionTextContainer: {
      flex: 1,
    },
    permissionTitle: {
      fontSize: THEME.FONT_SIZES.BASE,
      fontWeight: '600',
      marginBottom: THEME.SPACING.XS,
    },
    permissionTitleDark: {
      color: COLORS.TEXT_PRIMARY_DARK,
    },
    permissionTitleLight: {
      color: COLORS.TEXT_PRIMARY_LIGHT,
    },
    permissionDescription: {
      fontSize: THEME.FONT_SIZES.SM,
    },
    permissionDescriptionDark: {
      color: COLORS.TEXT_TERTIARY_DARK,
    },
    permissionDescriptionLight: {
      color: COLORS.TEXT_TERTIARY_LIGHT,
    },
    checkIconContainer: {
      backgroundColor: COLORS.SUCCESS_LIGHT,
      borderRadius: THEME.BORDER_RADIUS.SMALL,
      padding: THEME.SPACING.XS,
    },
    actionButton: {
      paddingVertical: THEME.SPACING.MD,
      borderRadius: THEME.BORDER_RADIUS.LARGE,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: THEME.SPACING.SM,
    },
    actionButtonBlocked: {
      backgroundColor: COLORS.ERROR,
    },
    actionButtonDefault: {
      backgroundColor: COLORS.SAFFRON,
    },
    refreshButton: {
      paddingVertical: THEME.SPACING.MD,
      borderRadius: THEME.BORDER_RADIUS.LARGE,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    refreshButtonDark: {
      borderColor: COLORS.BORDER_DARK,
    },
    refreshButtonLight: {
      borderColor: COLORS.BORDER_LIGHT,
    },
    refreshTextDisabled: {
      fontSize: THEME.FONT_SIZES.BASE,
      fontWeight: '500',
    },
    refreshTextDisabledDark: {
      color: COLORS.TEXT_DISABLED_DARK,
    },
    refreshTextDisabledLight: {
      color: COLORS.TEXT_DISABLED_LIGHT,
    },
    refreshTextEnabled: {
      fontSize: THEME.FONT_SIZES.BASE,
      fontWeight: '500',
    },
    refreshTextEnabledDark: {
      color: COLORS.TEXT_SECONDARY_DARK,
    },
    refreshTextEnabledLight: {
      color: COLORS.TEXT_SECONDARY_LIGHT,
    },
    privacyContainer: {
      position: 'absolute',
      bottom: THEME.SPACING.XL,
      left: THEME.SPACING.XL,
      right: THEME.SPACING.XL,
    },
    privacyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    privacyText: {
      fontSize: THEME.FONT_SIZES.XS,
      marginLeft: THEME.SPACING.XS,
    },
    privacyTextDark: {
      color: COLORS.TEXT_DISABLED_DARK,
    },
    privacyTextLight: {
      color: COLORS.TEXT_DISABLED_LIGHT,
    },
  });

  const requestPermissions = useCallback(async () => {
    if (isRequesting) return;

    setIsRequesting(true);
    try {
      // Request all permissions with retry logic
      const result = await permissionService.requestAllPermissions();
      setPermissions(result.permissions);

      // If all permissions are granted, call callback
      if (result.allGranted && onPermissionsGranted) {
        onPermissionsGranted();
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    } finally {
      setIsRequesting(false);
    }
  }, [onPermissionsGranted, isRequesting]);

  const checkPermissions = useCallback(async () => {
    try {
      const result = await permissionService.checkAllPermissionsDetailed();
      setPermissions(result.permissions);

      // If all permissions are now granted, call callback
      if (result.allGranted && onPermissionsGranted) {
        onPermissionsGranted();
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  }, [onPermissionsGranted]);

  useEffect(() => {
    if (!initialPermissions) {
      checkPermissions();
    }

    // Listen for app state changes to auto-check permissions when returning from settings
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App came to foreground, check permissions in case they were updated in settings
        // Add a small delay to ensure the system has time to register permission changes
        setTimeout(() => {
          checkPermissions();
        }, 500);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [initialPermissions, checkPermissions]);

  const openSettings = async () => {
    try {
      const success = await permissionService.openAppSettings();
      if (success) {
        // Note: on iOS, the app will be backgrounded when settings open
        // The app will need to check permissions again when it becomes active
      }
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  };

  const allGranted = permissions.camera === 'granted' && permissions.location === 'granted' && permissions.notifications === 'granted';
  const hasAnyBlocked = Object.values(permissions).some(status => status === 'blocked');

  // Check if we need to show location always rationale
  const needsAlwaysLocation = permissions.locationDetails?.needsAlwaysAccess || false;

  return (
    <View style={styles.container}>
      {/* Header with icon and title */}
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <View style={[
            styles.iconContainer,
            allGranted ? styles.iconContainerGranted : styles.iconContainerDefault
          ]}>
            <Shield
              size={40}
              color={allGranted ? '#10B981' : '#FFB74D'}
            />
          </View>

          <Text style={[
            styles.title,
            colorScheme === 'dark' ? styles.titleDark : styles.titleLight
          ]}>
            {allGranted ? 'Permissions Granted' : 'Enable Permissions'}
          </Text>

          <Text style={[
            styles.subtitle,
            colorScheme === 'dark' ? styles.subtitleDark : styles.subtitleLight
          ]}>
            {allGranted
              ? 'All required permissions are enabled. You can now use the app.'
              : 'PGN needs camera, location, and notification access for attendance tracking'
            }
          </Text>
        </View>

        {!allGranted && (
          <>
            {/* Permission Items */}
            <View style={styles.permissionsList}>
              <View style={styles.permissionItem}>
                <View style={[
                  styles.permissionIconContainer,
                  permissions.camera === 'granted'
                    ? styles.permissionIconContainerGranted
                    : styles.permissionIconContainerDefault
                ]}>
                  {permissions.camera === 'granted' ? (
                    <CheckCircle size={24} color="#10B981" />
                  ) : (
                    <Camera size={24} color="#FFB74D" />
                  )}
                </View>
                <View style={styles.permissionTextContainer}>
                  <Text style={[
                    styles.permissionTitle,
                    colorScheme === 'dark' ? styles.permissionTitleDark : styles.permissionTitleLight
                  ]}>
                    Camera Access
                  </Text>
                  <Text style={[
                    styles.permissionDescription,
                    colorScheme === 'dark' ? styles.permissionDescriptionDark : styles.permissionDescriptionLight
                  ]}>
                    Required for selfie check-in/out and face recognition
                  </Text>
                </View>
                {permissions.camera === 'granted' && (
                  <View style={styles.checkIconContainer}>
                    <CheckCircle size={16} color="#10B981" />
                  </View>
                )}
              </View>

              <View style={styles.permissionItem}>
                <View style={[
                  styles.permissionIconContainer,
                  permissions.location === 'granted'
                    ? styles.permissionIconContainerGranted
                    : styles.permissionIconContainerDefault
                ]}>
                  {permissions.location === 'granted' ? (
                    <CheckCircle size={24} color="#10B981" />
                  ) : (
                    <MapPin size={24} color="#FFB74D" />
                  )}
                </View>
                <View style={styles.permissionTextContainer}>
                  <Text style={[
                    styles.permissionTitle,
                    colorScheme === 'dark' ? styles.permissionTitleDark : styles.permissionTitleLight
                  ]}>
                    Location Access
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <Text style={[
                      styles.permissionDescription,
                      colorScheme === 'dark' ? styles.permissionDescriptionDark : styles.permissionDescriptionLight,
                      { flex: 1 }
                    ]}>
                      Required for attendance tracking with background location monitoring.
                    </Text>
                    {needsAlwaysLocation && (
                      <TouchableOpacity
                        onPress={() => permissionService.showLocationAlwaysRationale()}
                        style={{ padding: 4, marginLeft: 8 }}
                      >
                        <Info size={16} color={colorScheme === 'dark' ? COLORS.SAFFRON : '#F59E0B'} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                {permissions.location === 'granted' && (
                  <View style={styles.checkIconContainer}>
                    <CheckCircle size={16} color="#10B981" />
                  </View>
                )}
              </View>

              <View style={styles.permissionItem}>
                <View style={[
                  styles.permissionIconContainer,
                  permissions.notifications === 'granted'
                    ? styles.permissionIconContainerGranted
                    : styles.permissionIconContainerDefault
                ]}>
                  {permissions.notifications === 'granted' ? (
                    <CheckCircle size={24} color="#10B981" />
                  ) : (
                    <Bell size={24} color="#FFB74D" />
                  )}
                </View>
                <View style={styles.permissionTextContainer}>
                  <Text style={[
                    styles.permissionTitle,
                    colorScheme === 'dark' ? styles.permissionTitleDark : styles.permissionTitleLight
                  ]}>
                    Notification Access
                  </Text>
                  <Text style={[
                    styles.permissionDescription,
                    colorScheme === 'dark' ? styles.permissionDescriptionDark : styles.permissionDescriptionLight
                  ]}>
                    Required for attendance tracking alerts and important work updates
                  </Text>
                </View>
                {permissions.notifications === 'granted' && (
                  <View style={styles.checkIconContainer}>
                    <CheckCircle size={16} color="#10B981" />
                  </View>
                )}
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                hasAnyBlocked ? styles.actionButtonBlocked : styles.actionButtonDefault
              ]}
              onPress={hasAnyBlocked ? openSettings : requestPermissions}
              disabled={isRequesting}
              activeOpacity={0.9}
            >
              {hasAnyBlocked ? (
                <Settings size={20} color="#FFFFFF" />
              ) : (
                <Shield size={20} color="#FFFFFF" />
              )}
              <Text style={{
                color: '#FFFFFF',
                fontWeight: '600',
                fontSize: 16,
                marginLeft: 12,
              }}>
                {isRequesting
                  ? 'Requesting...'
                  : hasAnyBlocked
                    ? 'Open Settings'
                    : 'Request All Permissions'
                }
              </Text>
            </TouchableOpacity>

            {/* Check Again Button */}
            {(hasAnyBlocked || isRequesting) && (
              <TouchableOpacity
                style={[
                  styles.refreshButton,
                  colorScheme === 'dark' ? styles.refreshButtonDark : styles.refreshButtonLight
                ]}
                onPress={checkPermissions}
                disabled={isRequesting}
                activeOpacity={0.9}
              >
                <RefreshCw size={16} color={colorScheme === 'dark' ? COLORS.TEXT_SECONDARY_DARK : COLORS.TEXT_SECONDARY_LIGHT} />
                <Text style={[
                  styles.refreshTextEnabled,
                  colorScheme === 'dark' ? styles.refreshTextEnabledDark : styles.refreshTextEnabledLight,
                  { marginLeft: 8 }
                ]}>
                  Check Again
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Privacy Note */}
        <View style={styles.privacyContainer}>
          <View style={styles.privacyRow}>
            <Shield size={12} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
            <Text style={[
              styles.privacyText,
              colorScheme === 'dark' ? styles.privacyTextDark : styles.privacyTextLight
            ]}>
              Your privacy is respected. Permissions used only for work purposes.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}