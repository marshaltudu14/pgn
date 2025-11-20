import { StyleSheet } from 'react-native';

export const createHomeScreenStyles = (colorScheme: 'light' | 'dark' | null | undefined, topInset: number = 0) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: topInset + 48, // Safe area top + pt-12 (12 * 4)
    paddingBottom: 32, // pb-8 (8 * 4)
    paddingHorizontal: 24, // px-6 (6 * 4)
    backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 24, // mb-6 (6 * 4)
  },
  welcomeText: {
    fontSize: 30, // text-3xl
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? '#ffffff' : '#000000',
    marginBottom: 8, // mb-2 (2 * 4)
  },
  userNameText: {
    fontSize: 18, // text-lg
    color: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)',
  },
  detailsCard: {
    backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6',
    borderRadius: 8, // rounded-lg
    padding: 16, // p-4 (4 * 4)
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailColumn: {
    flex: 1,
  },
  detailColumnEnd: {
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: 14, // text-sm
    color: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#6b7280',
    marginBottom: 4, // mb-1 (1 * 4)
  },
  detailValue: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    color: colorScheme === 'dark' ? '#ffffff' : '#111827',
  },
});