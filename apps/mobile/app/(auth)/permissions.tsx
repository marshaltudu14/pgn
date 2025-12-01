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
import { useTheme } from '@/contexts/theme-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
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
  const { resolvedTheme } = useTheme();
  const colors = useThemeColors();
  const [permissions, setPermissions] = useState<AppPermissions>(
    initialPermissions || { camera: 'denied', location: 'denied', notifications: 'denied' }
  );
  const [isRequesting, setIsRequesting] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      backgroundColor: COLORS.WARNING_LIGHT,
    },
    title: {
      fontSize: THEME.FONT_SIZES.DISPLAY,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: THEME.SPACING.SM,
    },
    subtitle: {
      fontSize: THEME.FONT_SIZES.BASE,
      textAlign: 'center',
      paddingHorizontal: THEME.SPACING.SM,
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
      backgroundColor: COLORS.WARNING_LIGHT,
    },
    permissionTextContainer: {
      flex: 1,
    },
    permissionTitle: {
      fontSize: THEME.FONT_SIZES.BASE,
      fontWeight: '600',
      marginBottom: THEME.SPACING.XS,
    },
    permissionDescription: {
      fontSize: THEME.FONT_SIZES.SM,
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
      borderColor: colors.border,
    },
    refreshTextDisabled: {
      fontSize: THEME.FONT_SIZES.BASE,
      fontWeight: '500',
    },
    refreshTextEnabled: {
      fontSize: THEME.FONT_SIZES.BASE,
      fontWeight: '500',
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

          <Text style={[styles.title, { color: colors.text }]}>
            {allGranted ? 'Permissions Granted' : 'Enable Permissions'}
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
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
                  <Text style={[styles.permissionTitle, { color: colors.text }]}>
                    Camera Access
                  </Text>
                  <Text style={[styles.permissionDescription, { color: colors.textSecondary }]}>
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
                  <Text style={[styles.permissionTitle, { color: colors.text }]}>
                    Location Access
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <Text style={[styles.permissionDescription, { color: colors.textSecondary, flex: 1 }]}>
                      Required for attendance tracking with background location monitoring.
                    </Text>
                    {needsAlwaysLocation && (
                      <TouchableOpacity
                        onPress={() => permissionService.showLocationAlwaysRationale()}
                        style={{ padding: 4, marginLeft: 8 }}
                      >
                        <Info size={16} color={COLORS.SAFFRON} />
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
                  <Text style={[styles.permissionTitle, { color: colors.text }]}>
                    Notification Access
                  </Text>
                  <Text style={[styles.permissionDescription, { color: colors.textSecondary }]}>
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
                style={styles.refreshButton}
                onPress={checkPermissions}
                disabled={isRequesting}
                activeOpacity={0.9}
              >
                <RefreshCw size={16} color={colors.textSecondary} />
                <Text style={[styles.refreshTextEnabled, { color: colors.textSecondary, marginLeft: 8 }]}>
                  Check Again
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Privacy Note */}
        <View style={styles.privacyContainer}>
          <View style={styles.privacyRow}>
            <Shield size={12} color={colors.textTertiary} />
            <Text style={[styles.privacyText, { color: colors.textTertiary }]}>
              Your privacy is respected. Permissions used only for work purposes.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}