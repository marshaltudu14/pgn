import { StyleSheet } from 'react-native';

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Profile Section
  profileSection: {
    paddingHorizontal: 20,
  },
  profileHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 16,
    gap: 16,
  },
  profileLogoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700' as const,
    fontFamily: 'System',
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 14,
    fontFamily: 'System',
  },
  statusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    fontFamily: 'System',
  },

  // Section styles
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    fontFamily: 'System',
  },

  // Stats Cards
  statsCardsContainer: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  statCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  statCardContent: {
    flex: 1,
  },
  statCardLabel: {
    fontSize: 12,
    fontFamily: 'System',
    marginBottom: 2,
  },
  statCardValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: 'System',
  },

  // Regions Card
  regionsCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  regionsText: {
    fontSize: 14,
    fontFamily: 'System',
    flex: 1,
  },

  // Legacy styles (keeping for compatibility)
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
  headerRight: {
    alignItems: 'flex-end' as const,
    gap: 6,
  },
  networkStatusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  networkStatusText: {
    fontSize: 11,
    fontWeight: '500' as const,
    fontFamily: 'System',
  },

  // Stats section (legacy)
  statsSection: {
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  statItem: {
    alignItems: 'center' as const,
    flex: 1,
  },
  statIconContainer: {
    marginBottom: 2,
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