import { StyleSheet } from 'react-native';
import { COLORS, THEME } from '@/constants/theme';

export const tasksStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: THEME.SPACING.MD,
    paddingTop: 50,
    paddingBottom: THEME.SPACING.MD,
  },
  headerContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: THEME.SPACING.MD,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  titleIcon: {
    marginRight: THEME.SPACING.SM - THEME.SPACING.XS,
  },
  title: {
    fontSize: 22,
    fontWeight: '600' as const,
    fontFamily: 'System',
  },
  scrollView: {
    flex: 1,
  },

  // Tasks list styles
  listItem: {
    backgroundColor: 'transparent',
  },
  listItemContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: THEME.SPACING.MD,
    paddingVertical: THEME.SPACING.MD,
  },
  listItemMain: {
    flex: 1,
  },
  listItemHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: THEME.SPACING.SM - THEME.SPACING.XS,
  },
  listItemIcon: {
    marginRight: THEME.SPACING.SM + THEME.SPACING.XS,
  },
  listItemTitles: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: 'System',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 14,
    fontWeight: '400' as const,
    fontFamily: 'System',
  },
  listItemDetails: {
    paddingLeft: 44, // 32px icon + 12px margin
  },
  listItemDetail: {
    fontSize: 14,
    marginBottom: 2,
  },
  listItemBadge: {
    paddingHorizontal: THEME.SPACING.SM - THEME.SPACING.XS,
    paddingVertical: THEME.SPACING.XS,
    borderRadius: 12,
    marginLeft: THEME.SPACING.SM - THEME.SPACING.XS,
  },
  listItemBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    fontFamily: 'System',
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600' as const,
    fontFamily: 'System',
  },
  listItemSeparator: {
    height: 1,
    marginLeft: THEME.SPACING.MD,
  },
  pendingBadge: {
    paddingHorizontal: THEME.SPACING.SM - THEME.SPACING.XS,
    paddingVertical: THEME.SPACING.XS,
    borderRadius: 12,
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: THEME.SPACING.XXL + THEME.SPACING.XL,
    paddingHorizontal: THEME.SPACING.LG * 2.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    fontFamily: 'System',
    marginBottom: THEME.SPACING.SM - THEME.SPACING.XS,
    textAlign: 'center' as const,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'System',
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: THEME.SPACING.MD + THEME.SPACING.XS,
  },

  });

// Helper function to get task status colors
export const getStatusStyles = (status: 'pending' | 'in-progress' | 'completed' | 'overdue', isDark: boolean) => {
  if (isDark) {
    switch (status) {
      case 'completed':
        return {
          color: COLORS.SUCCESS,
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderColor: 'rgba(16, 185, 129, 0.25)',
        };
      case 'in-progress':
        return {
          color: COLORS.INFO,
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          borderColor: 'rgba(59, 130, 246, 0.25)',
        };
      case 'overdue':
        return {
          color: COLORS.ERROR,
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          borderColor: 'rgba(239, 68, 68, 0.25)',
        };
      default:
        return {
          color: COLORS.TEXT_TERTIARY_DARK,
          backgroundColor: '#1F2937',
          borderColor: '#374151',
        };
    }
  } else {
    switch (status) {
      case 'completed':
        return {
          color: COLORS.SUCCESS,
          backgroundColor: COLORS.SUCCESS_LIGHT,
          borderColor: COLORS.SUCCESS + '40',
        };
      case 'in-progress':
        return {
          color: COLORS.INFO,
          backgroundColor: COLORS.INFO_LIGHT,
          borderColor: COLORS.INFO + '40',
        };
      case 'overdue':
        return {
          color: COLORS.ERROR,
          backgroundColor: COLORS.ERROR_LIGHT,
          borderColor: COLORS.ERROR + '40',
        };
      default:
        return {
          color: COLORS.TEXT_TERTIARY_LIGHT,
          backgroundColor: '#F3F4F6',
          borderColor: '#E5E7EB',
        };
    }
  }
};

// Helper function to get priority colors
export const getPriorityStyles = (priority: 'low' | 'medium' | 'high', isDark: boolean) => {
  if (isDark) {
    switch (priority) {
      case 'high':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: COLORS.ERROR,
        };
      case 'medium':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          color: COLORS.WARNING,
        };
      default:
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          color: COLORS.SUCCESS,
        };
    }
  } else {
    switch (priority) {
      case 'high':
        return {
          backgroundColor: COLORS.ERROR_LIGHT,
          color: COLORS.ERROR,
        };
      case 'medium':
        return {
          backgroundColor: COLORS.WARNING_LIGHT,
          color: COLORS.WARNING,
        };
      default:
        return {
          backgroundColor: COLORS.SUCCESS_LIGHT,
          color: COLORS.SUCCESS,
        };
    }
  }
};

// Helper function to get icon colors
export const getStatusIconColor = (status: 'pending' | 'in-progress' | 'completed' | 'overdue') => {
  switch (status) {
    case 'completed':
      return COLORS.SUCCESS;
    case 'in-progress':
      return COLORS.INFO;
    case 'overdue':
      return COLORS.ERROR;
    default:
      return COLORS.TEXT_TERTIARY_LIGHT;
  }
};