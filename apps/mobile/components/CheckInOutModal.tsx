import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
// No longer need CameraView since we're using expo-image-picker
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Camera } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import {
  useAttendance,
  useAttendanceLoading,
  useAttendanceError
} from '@/store/attendance-store';
import { getCurrentLocation } from '@/utils/location';
import { CheckInMobileRequest, CheckOutMobileRequest } from '@pgn/shared';
import { COLORS } from '@/constants';
import { showToast } from '@/utils/toast';

interface CheckInOutModalProps {
  visible: boolean;
  onClose: () => void;
  mode: 'checkin' | 'checkout';
}


export default function CheckInOutModal({ visible, onClose, mode }: CheckInOutModalProps) {
  const { resolvedTheme } = useTheme();
  const colors = useThemeColors();
  const isLoading = useAttendanceLoading();
  const error = useAttendanceError();

  const [isCapturing, setIsCapturing] = useState(false);
  const [locationData, setLocationData] = useState<any>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<any>(null);
  const [step, setStep] = useState<'location' | 'camera' | 'preview' | 'processing'>('location');
  const [pulseAnim] = useState(new Animated.Value(1));

  
  const checkIn = useAttendance((state) => state.checkIn);
  const checkOut = useAttendance((state) => state.checkOut);
  const clearError = useAttendance((state) => state.clearError);

  
  // Camera methods from attendance store
  const capturePhoto = useAttendance((state) => state.capturePhoto);
  const validateCapturedPhoto = useAttendance((state) => state.validateCapturedPhoto);

  
  // Pulse animation for loading states
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const fetchLocation = useCallback(async () => {
    try {
      setStep('location');
      const location = await getCurrentLocation();
      setLocationData(location);
      // Automatically trigger camera capture after getting location
      setTimeout(() => {
        // Open camera directly without storing the function
        setStep('camera');
        setIsCapturing(true);

        // Then call capturePhoto from store
        capturePhoto({
          quality: 0.8,
          aspectRatio: 1,
        }).then((photo) => {
          const validation = validateCapturedPhoto(photo);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }
          setCapturedPhoto(photo);
          setStep('preview');
        }).catch((error) => {
          // Don't show error for user cancellation - just close the modal silently
          // This is expected behavior when user closes camera without taking photo
          if (
            (error instanceof Error && (
              error.message.includes('PHOTO_CAPTURE_CANCELED') ||
              error.message.includes('User canceled photo capture')
            )) ||
            (error as any)?.code === 'PHOTO_CAPTURE_CANCELED'
          ) {
            // User voluntarily closed camera without taking photo - this is normal behavior
            // Just close the modal silently without any error message
            onClose();
          } else {
            // Only show error toasts for actual errors (permission denied, camera failure, etc.)
            showToast.error(error instanceof Error ? error.message : 'Failed to capture photo. Please try again.');
            onClose(); // Close modal on camera error to prevent getting stuck
          }
        }).finally(() => {
          setIsCapturing(false);
        });
      }, 500);
    } catch {
      showToast.error('Unable to get your current location. Please ensure GPS is enabled and try again.');
      onClose();
    }
  }, [onClose, capturePhoto, validateCapturedPhoto]);

  const initializeModal = useCallback(async () => {
    try {
      // Reset state
      setStep('location');
      setLocationData(null);
      setCapturedPhoto(null);
      setIsCapturing(false);

      // Get current location (permissions already handled by AuthGuard)
      await fetchLocation();
    } catch {
      showToast.error('Failed to initialize attendance. Please try again.');
      onClose();
    }
  }, [onClose, fetchLocation]);

  useEffect(() => {
    if (visible) {
      initializeModal();
    }
  }, [visible, initializeModal]);

  useEffect(() => {
    if (error) {
      // Only show non-authentication errors to the user
      // Authentication errors are handled globally by AuthGuard
      if (!error.includes('authorization') &&
          !error.includes('unauthorized') &&
          !error.includes('token') &&
          !error.includes('Authentication') &&
          !error.includes('Login')) {
        showToast.error(error);
        clearError();
      }
    }
  }, [error, clearError]);

  const captureSelfie = async () => {
    try {
      setIsCapturing(true);
      setStep('camera');

      // Capture photo using expo-image-picker
      const photo = await capturePhoto({
        quality: 0.8,
        aspectRatio: 1,
      });

      // Validate photo
      const validation = validateCapturedPhoto(photo);

      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Show preview instead of processing immediately
      setCapturedPhoto(photo);
      setStep('preview');
    } catch (error) {
      // Don't show error for user cancellation - just close the modal silently
      // This is expected behavior when user closes camera without taking photo
      if (
        (error instanceof Error && (
          error.message.includes('PHOTO_CAPTURE_CANCELED') ||
          error.message.includes('User canceled photo capture')
        )) ||
        (error as any)?.code === 'PHOTO_CAPTURE_CANCELED'
      ) {
        // User voluntarily closed camera without taking photo - this is normal behavior
        // Just close the modal silently without any error message
        onClose();
      } else {
        // Only show error toasts for actual errors (permission denied, camera failure, etc.)
        showToast.error(error instanceof Error ? error.message : 'Failed to capture photo. Please try again.');
        onClose(); // Close modal on camera error to prevent getting stuck
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const confirmPhoto = async () => {
    if (!capturedPhoto) {
      showToast.error('No photo captured. Please try again.');
      return;
    }

    await processAttendance(capturedPhoto);
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    captureSelfie();
  };

  const processAttendance = async (photo: any) => {
    try {
      
      if (!locationData || !photo.base64) {
        throw new Error('Missing location or photo data');
      }

      setStep('processing');
      
      const attendanceData = {
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          timestamp: locationData.timestamp.getTime(),
          address: locationData.address,
        },
        selfie: photo.base64,
        deviceInfo: {
          platform: 'mobile',
          version: '1.0.0',
          model: 'React Native Device',
        },
      };

  
      let result;
      if (mode === 'checkin') {
                result = await checkIn(attendanceData as CheckInMobileRequest);
      } else {
                result = await checkOut(attendanceData as CheckOutMobileRequest);
      }

      
      if (result.success) {
        showToast.success(
          mode === 'checkin' ? 'Checked in successfully!' : 'Checked out successfully!',
          result.message
        );
                onClose();
      } else {
        throw new Error(result.message || 'Attendance failed');
      }
    } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to process attendance. Please try again.';

      // Only show non-authentication errors to the user
      // Authentication errors are handled globally by AuthGuard
      if (!errorMessage.includes('authorization') &&
          !errorMessage.includes('unauthorized') &&
          !errorMessage.includes('token') &&
          !errorMessage.includes('Authentication') &&
          !errorMessage.includes('Login')) {
        showToast.error(errorMessage);
        onClose(); // Close modal on error to prevent getting stuck
      } else {
        // For authentication errors, silently close the modal
        // AuthGuard will handle the authentication flow
        onClose();
      }
    }
  };

  const closeModal = () => {
    if (!isLoading && !isCapturing) {
      onClose();
    }
  };

  const renderLocationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Animated.View style={[styles.locationIcon, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.locationDot} />
          <View style={[styles.locationRing, { borderColor: COLORS.SAFFRON }]} />
        </Animated.View>
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          Getting Your Location
        </Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Please wait while we accurately determine your current location...
        </Text>
      </View>

      <ActivityIndicator size="large" color={COLORS.SAFFRON} style={styles.loader} />
    </View>
  );

  const renderCameraStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <View style={[styles.cameraIcon, { backgroundColor: 'rgba(255, 153, 51, 0.1)' }]}>
          <Camera size={40} color={COLORS.SAFFRON} />
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          Opening Camera...
        </Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          Please wait while we open the camera for your selfie
        </Text>
      </View>

      <ActivityIndicator size="large" color={COLORS.SAFFRON} style={styles.loader} />
    </View>
  );

  const renderPreviewStep = () => (
    <View style={styles.previewContainer}>
      <View style={styles.previewHeader}>
        <Text style={[styles.previewTitle, { color: colors.text }]}>
          Review Your Selfie
        </Text>
        <Text style={[styles.previewDescription, { color: colors.textSecondary }]}>
          Please confirm your photo is clear and your face is visible
        </Text>
      </View>

      {capturedPhoto && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: `data:image/jpeg;base64,${capturedPhoto.base64}` }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.previewButtons}>
        <TouchableOpacity
          style={[styles.previewButton, styles.retakeButton, { borderColor: colors.border }]}
          onPress={retakePhoto}
          disabled={isLoading}
        >
          <Text style={[styles.retakeButtonText, { color: colors.text }]}>
            Retake
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.previewButton, styles.confirmButton, { backgroundColor: COLORS.SAFFRON }]}
          onPress={confirmPhoto}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.confirmButtonText}>
              Confirm & {mode === 'checkin' ? 'Check In' : 'Check Out'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProcessingStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Animated.View style={[styles.processingIcon, { transform: [{ scale: pulseAnim }] }]}>
          <ActivityIndicator size="large" color={COLORS.SAFFRON} />
        </Animated.View>
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          Processing Attendance
        </Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          {mode === 'checkin' ? 'Checking you in and verifying your location...' : 'Checking you out and finalizing your attendance...'}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closeModal}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Modern Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={closeModal}
            disabled={isLoading || isCapturing}
          >
            <ChevronLeft
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {mode === 'checkin' ? 'Check In' : 'Check Out'}
            </Text>
          </View>

          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {step === 'location' && renderLocationStep()}
          {step === 'camera' && renderCameraStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'processing' && renderProcessingStep()}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  locationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 153, 51, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  locationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.SAFFRON,
    position: 'absolute',
  },
  locationRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  processingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 153, 51, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  loader: {
    marginTop: 24,
  },
  cameraIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    shadowColor: COLORS.SAFFRON,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 32,
  },
  previewHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  previewDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 300,
    marginVertical: 32,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
    width: '100%',
  },
  previewButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  retakeButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    shadowColor: COLORS.SAFFRON,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});