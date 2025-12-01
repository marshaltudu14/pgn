import { StyleSheet } from 'react-native';
import { COLORS } from '@/constants';

export const createLoginScreenStyles = (resolvedTheme: 'light' | 'dark', colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    shadowColor: colors.text,
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
    color: colors.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: colors.textSecondary,
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

export const createLoginFormStyles = (resolvedTheme: 'light' | 'dark', colors: any) => StyleSheet.create({
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
    color: colors.textSecondary,
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
    backgroundColor: colors.listBg,
    borderColor: 'transparent',
    color: colors.text,
  },
  inputFocused: {
    borderColor: COLORS.SAFFRON,
    backgroundColor: colors.background,
  },
  inputWithError: {
    borderColor: '#EF4444',
    backgroundColor: colors.errorBg,
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
    backgroundColor: colors.errorBg,
    borderColor: colors.error + '30',
  },
  errorMessageText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    color: colors.error,
  },
  buttonSection: {
    marginTop: 8,
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.SAFFRON,
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