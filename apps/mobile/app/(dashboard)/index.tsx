import React from 'react';
import {
  View,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/store/auth-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createHomeScreenStyles } from './_styles';

export default function HomeScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const styles = createHomeScreenStyles(colorScheme, insets.top);

  return (
    <View style={styles.container}>
      {/* Header with Primary Color Background */}
      <View style={styles.header}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            Welcome back!
          </Text>
          <Text style={styles.userNameText}>
            {user?.fullName || 'Employee'}
          </Text>
        </View>

        {/* Employee Basic Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsRow}>
            <View style={styles.detailColumn}>
              <Text style={styles.detailLabel}>
                Employee ID
              </Text>
              <Text style={styles.detailValue}>
                {user?.humanReadableId || 'N/A'}
              </Text>
            </View>
            <View style={[styles.detailColumn, styles.detailColumnEnd]}>
              <Text style={styles.detailLabel}>
                Status
              </Text>
              <Text style={styles.detailValue}>
                {user?.employmentStatus?.toLowerCase() || 'Active'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}