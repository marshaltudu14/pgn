import { Platform, StyleSheet } from 'react-native';

export const createLoginScreenStyles = (colorScheme: 'light' | 'dark' | null | undefined) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 32,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 18,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    color: colorScheme === 'dark' ? '#ffffff' : '#000000',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: colorScheme === 'dark' ? '#A1A1AA' : '#52525B',
    fontWeight: '500',
  },
  formSection: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  formContainer: {
    width: '100%',
  },
});

export const createLoginFormStyles = (colorScheme: 'light' | 'dark' | null | undefined) => StyleSheet.create({
  container: {
    width: '100%',
  },
  inputSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
    color: colorScheme === 'dark' ? '#E4E4E7' : '#3F3F46',
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'absolute',
    left: 14,
    zIndex: 10,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingLeft: 44,
    paddingRight: 14,
    fontSize: 15,
    fontWeight: '500',
    backgroundColor: colorScheme === 'dark' ? '#18181B' : '#ffffff',
    borderColor: 'transparent',
    color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
  },
  inputFocused: {
    borderColor: '#FF9933', // Saffron
    backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
  },
  inputWithError: {
    borderColor: '#EF4444',
    backgroundColor: colorScheme === 'dark' ? '#2A1515' : '#FEF2F2',
  },
  passwordToggle: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 6,
  },
  errorMessageContainer: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorMessageContainerDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorMessageContainerLight: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  errorMessageText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  errorMessageTextDark: {
    color: '#F87171',
  },
  errorMessageTextLight: {
    color: '#B91C1C',
  },
  buttonSection: {
    marginTop: 8,
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FF9933', // Saffron
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: '#D4D4D8',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF', // White text on Saffron usually looks better, or black? User said "primary color should be saffrnon for button". Usually white text on orange. Let's try White.
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
  },
});