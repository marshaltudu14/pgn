import { StyleSheet } from 'react-native';

export const createLoginScreenStyles = (colorScheme: 'light' | 'dark' | null | undefined) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  mainContainer: {
    flex: 1,
  },
  headerSection: {
    flex: 3,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 64,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 128,
    height: 128,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: colorScheme === 'dark' ? '#ffffff' : '#000000',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
  },
  formSection: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  formContainer: {
    width: '100%',
    maxWidth: 384,
  },
});

export const createLoginFormStyles = (colorScheme: 'light' | 'dark' | null | undefined) => StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 8,
  },
  inputSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    marginBottom: 12,
    color: colorScheme === 'dark' ? '#E5E7EB' : '#374151',
  },
  inputContainer: {
    position: 'relative',
  },
  iconContainer: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 10,
  },
  input: {
    paddingLeft: 40,
    paddingRight: 12,
    fontSize: 14,
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
    color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
  },
  inputWithError: {
    borderColor: '#EF4444',
  },
  inputNormal: {
    borderColor: colorScheme === 'dark' ? '#4B5563' : '#D1D5DB',
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EF4444',
  },
  errorMessageContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 32,
    borderWidth: 1,
  },
  errorMessageContainerDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorMessageContainerLight: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  errorMessageText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorMessageTextDark: {
    color: '#F87171',
  },
  errorMessageTextLight: {
    color: '#B91C1C',
  },
  buttonSection: {
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: '#FBBF24', // amber-400
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
});