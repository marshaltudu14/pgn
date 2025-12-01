import { StyleSheet } from 'react-native';

export const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'System',
  },
  refreshButton: {
    padding: 8,
  },
  profileContainer: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
    fontFamily: 'System',
  },
  profileName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'System',
    marginBottom: 4,
  },
  profileId: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontFamily: 'System',
    marginBottom: 4,
  },
  profileStatus: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'System',
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 12,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  itemBorder: {
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
  notice: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  noticeContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noticeEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  noticeText: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  noticeDescription: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'System',
  },
  appInfo: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  appIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appIconText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'System',
  },
  appVersion: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 12,
    fontFamily: 'System',
    marginTop: 4,
  },
});

// New redesigned profile styles - no cards, no shadows, just separators
export const newProfileStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'System',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileSubtitle: {
    fontSize: 14,
    fontFamily: 'System',
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    width: '100%',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontFamily: 'System',
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
});