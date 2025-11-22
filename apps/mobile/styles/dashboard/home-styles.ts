import { StyleSheet } from 'react-native';

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  compactHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  headerLeft: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700' as const,
    fontFamily: 'System',
    marginBottom: 2,
  },
  userSubtitle: {
    fontSize: 14,
    fontFamily: 'System',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    fontFamily: 'System',
  },

  // Section styles
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: 'System',
  },

  // Stats section
  statsSection: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  statItem: {
    alignItems: 'center' as const,
    flex: 1,
  },
  statIconContainer: {
    marginBottom: 4,
  },
  statContent: {
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    fontFamily: 'System',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'System',
  },

  });